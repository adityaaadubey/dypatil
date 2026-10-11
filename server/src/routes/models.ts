import express from 'express';
import crypto from 'crypto';
import { db } from '../database/db.ts';
import { getGroqCatalogue, isGroqConfigured } from '../providers/groqProvider.ts';

const router = express.Router();

let lastRefreshTimestamp = new Date().toISOString();

// GET /api/models/providers - Safe provider configuration status
router.get('/providers', async (_req, res) => {
  try {
    const groqModels = await getGroqCatalogue();
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 10);
    const hasGroq = isGroqConfigured();

    return res.json({
      providers: {
        groq: {
          name: 'Groq',
          configured: hasGroq,
          status: hasGroq ? 'active' : 'unconfigured',
          modelCount: groqModels.length,
          executableRoutes: groqModels.filter(m => m.executable).length,
          lastRefresh: lastRefreshTimestamp,
          features: ['ultra_low_latency', 'lpu_acceleration', 'openai_compatible']
        },
        gemini: {
          name: 'Google Gemini',
          configured: hasGemini,
          status: hasGemini ? 'active' : 'unconfigured',
          features: ['direct_api', 'multimodal', 'large_context']
        },
        openrouter: {
          name: 'OpenRouter',
          configured: hasOpenRouter,
          status: hasOpenRouter ? 'active' : 'catalogue_only',
          features: ['unified_gateway', 'free_tier_routing']
        },
        openai: {
          name: 'OpenAI',
          configured: Boolean(process.env.OPENAI_API_KEY),
          status: process.env.OPENAI_API_KEY ? 'active' : 'unconfigured',
          features: ['gpt4o', 'reasoning']
        },
        anthropic: {
          name: 'Anthropic Claude',
          configured: Boolean(process.env.ANTHROPIC_API_KEY),
          status: process.env.ANTHROPIC_API_KEY ? 'active' : 'unconfigured',
          features: ['claude_sonnet', 'extended_thinking']
        }
      },
      unifiedCatalogueFreshness: lastRefreshTimestamp
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to inspect provider configurations.' });
  }
});

// POST /api/models/refresh - Manual model catalogue refresh
router.post('/refresh', async (_req, res) => {
  try {
    const refreshedGroq = await getGroqCatalogue(true);
    lastRefreshTimestamp = new Date().toISOString();
    return res.json({
      message: 'Model catalogue refreshed successfully from upstream providers.',
      refreshedAt: lastRefreshTimestamp,
      groqDiscoveredCount: refreshedGroq.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to refresh model catalogue.' });
  }
});

// GET /api/models - Unified model catalogue combining SQL registry and Groq discovery
router.get('/', async (_req, res) => {
  try {
    const dbModels = db.prepare(`
      SELECT * FROM model_registry ORDER BY is_executable DESC, display_name ASC
    `).all();

    const formattedDbModels = dbModels.map((m: any) => ({
      ...m,
      modalities: typeof m.modalities === 'string' ? JSON.parse(m.modalities) : m.modalities,
      capabilities: typeof m.capabilities === 'string' ? JSON.parse(m.capabilities) : m.capabilities,
      isExecutable: Boolean(m.is_executable),
      isVerified: Boolean(m.is_verified)
    }));

    // Fetch live Groq models
    const groqModels = await getGroqCatalogue();
    const formattedGroqModels = groqModels.map((gm) => ({
      id: gm.id,
      model_id: gm.id,
      display_name: gm.name,
      provider: 'Groq',
      context_window: gm.contextWindow,
      input_cost_per_million: gm.inputCostPerMillion,
      output_cost_per_million: gm.outputCostPerMillion,
      latency_p95: gm.baseLatencyP95,
      capability_rating: gm.capabilityRating,
      access_tier: gm.accessTier,
      is_free_tier: gm.isFreeTier ? 1 : 0,
      is_executable: gm.executable ? 1 : 0,
      is_verified: 1,
      isExecutable: gm.executable,
      isVerified: true,
      pricing_status: gm.pricingStatus,
      documentation_url: gm.documentationUrl,
      modalities: ['text'],
      capabilities: gm.specialties
    }));

    // Merge unified catalogue without ID collisions
    const seenIds = new Set(formattedDbModels.map(m => m.id));
    const merged = [...formattedDbModels];

    for (const gm of formattedGroqModels) {
      if (!seenIds.has(gm.id)) {
        merged.push(gm as any);
        seenIds.add(gm.id);
      }
    }

    return res.json({ 
      models: merged,
      groqCount: formattedGroqModels.length,
      totalCount: merged.length,
      refreshedAt: lastRefreshTimestamp
    });
  } catch (_err: any) {
    return res.status(500).json({ error: 'Failed to fetch model registry.' });
  }
});

// GET /api/models/:id - Get specific model
router.get('/:id', (req, res) => {
  try {
    const model = db.prepare('SELECT * FROM model_registry WHERE id = ?').get(req.params.id) as any;
    if (!model) {
      return res.status(404).json({ error: 'Model not found.' });
    }

    return res.json({
      model: {
        ...model,
        modalities: typeof model.modalities === 'string' ? JSON.parse(model.modalities) : model.modalities,
        capabilities: typeof model.capabilities === 'string' ? JSON.parse(model.capabilities) : model.capabilities,
        isExecutable: Boolean(model.is_executable),
        isVerified: Boolean(model.is_verified)
      }
    });
  } catch (_err: any) {
    return res.status(500).json({ error: 'Failed to fetch model.' });
  }
});

// POST /api/orders - Persist pending QR-only purchase orders
router.post('/orders', (req, res) => {
  const { packageId, modelAllocations, amountInr, userId } = req.body;

  if (!packageId || amountInr === undefined) {
    return res.status(400).json({ error: 'Package ID and amount are required.' });
  }

  const orderId = 'ord_' + crypto.randomBytes(8).toString('hex');
  const orderRef = 'VYR-' + Math.floor(100000 + Math.random() * 900000);

  db.prepare(`
    INSERT INTO pricing_packages_orders (
      id, order_ref, user_id, package_id, model_allocations, amount_inr, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    orderId,
    orderRef,
    userId || null,
    packageId,
    JSON.stringify(modelAllocations || {}),
    Number(amountInr)
  );

  return res.status(201).json({
    orderId,
    orderRef,
    status: 'pending',
    message: 'Pending order registered. Awaiting manual verification.'
  });
});

export default router;

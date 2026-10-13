import express from 'express';
import crypto from 'crypto';
import { db } from '../database/db.ts';
import { getGroqCatalogue, isGroqConfigured } from '../providers/groqProvider.ts';
import { getGeminiCatalogue, getGeminiApiKey } from '../../geminiService.js';

const router = express.Router();

let lastRefreshTimestamp = new Date().toISOString();

// GET /api/models/providers - Safe provider configuration status
router.get('/providers', async (_req, res) => {
  try {
    const [groqModels, geminiCatalogue] = await Promise.all([
      getGroqCatalogue(),
      getGeminiCatalogue()
    ]);
    const geminiModels = Array.isArray(geminiCatalogue?.models) ? geminiCatalogue.models : [];
    const hasGemini = Boolean(getGeminiApiKey());
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
          modelCount: geminiModels.length,
          executableRoutes: hasGemini ? geminiModels.length : 0,
          lastRefresh: lastRefreshTimestamp,
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
    const [refreshedGroq, refreshedGemini] = await Promise.all([
      getGroqCatalogue(true),
      getGeminiCatalogue(true)
    ]);
    lastRefreshTimestamp = new Date().toISOString();
    return res.json({
      message: 'Model catalogue refreshed successfully from upstream providers.',
      refreshedAt: lastRefreshTimestamp,
      groqDiscoveredCount: refreshedGroq.length,
      geminiDiscoveredCount: refreshedGemini?.models?.length || 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to refresh model catalogue.' });
  }
});

// GET /api/models - Unified model catalogue combining SQL registry, Google Gemini discovery, and Groq discovery
router.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const dbModels = db.prepare(`
      SELECT * FROM model_registry ORDER BY is_executable DESC, display_name ASC
    `).all();

    const formattedDbModels = dbModels.map((m: any) => {
      const capabilities = typeof m.capabilities === 'string' ? JSON.parse(m.capabilities) : (m.capabilities || ['General']);
      const modalities = typeof m.modalities === 'string' ? JSON.parse(m.modalities) : (m.modalities || ['text']);
      const contextWindow = m.context_limit || m.context_window || 128000;
      const inputCost = typeof m.input_cost_per_million === 'number' ? m.input_cost_per_million : 0.15;
      const outputCost = typeof m.output_cost_per_million === 'number' ? m.output_cost_per_million : 0.60;
      const latency = m.latency_p95 || 200;
      const capRating = m.capability_rating || 9.0;

      return {
        ...m,
        id: m.id,
        name: m.display_name || m.id,
        provider: m.provider === 'Google Gemini' ? 'Google' : m.provider,
        category: m.id.includes('pro') ? 'reasoning' : m.id.includes('flash') ? 'fast' : 'general',
        description: `${m.display_name || m.id} (${m.provider}) verified endpoint.`,
        contextWindow,
        inputCostPerMillion: inputCost,
        outputCostPerMillion: outputCost,
        baseLatencyP95: latency,
        currentLatencyP95: latency,
        capabilityRating: capRating,
        reliabilityScore: 99.95,
        endpointStatus: 'online',
        specialties: capabilities,
        modalities,
        capabilities,
        isExecutable: Boolean(m.is_executable),
        isVerified: Boolean(m.is_verified)
      };
    });

    // Fetch live Google Gemini and Groq models concurrently
    const [groqModels, geminiCatalogue] = await Promise.all([
      getGroqCatalogue(forceRefresh),
      getGeminiCatalogue(forceRefresh)
    ]);

    const geminiList = Array.isArray(geminiCatalogue?.models) ? geminiCatalogue.models : [];
    const formattedGeminiModels = geminiList.map((gm: any) => ({
      id: gm.id,
      model_id: gm.id,
      name: gm.name,
      display_name: gm.name,
      provider: 'Google',
      category: gm.category || 'fast',
      description: gm.description,
      contextWindow: gm.contextWindow,
      context_window: gm.contextWindow,
      inputCostPerMillion: gm.inputCostPerMillion,
      input_cost_per_million: gm.inputCostPerMillion,
      outputCostPerMillion: gm.outputCostPerMillion,
      output_cost_per_million: gm.outputCostPerMillion,
      baseLatencyP95: gm.baseLatencyP95,
      currentLatencyP95: gm.currentLatencyP95 || gm.baseLatencyP95,
      latency_p95: gm.baseLatencyP95,
      capabilityRating: gm.capabilityRating,
      capability_rating: gm.capabilityRating,
      reliabilityScore: gm.reliabilityScore || 99.98,
      endpointStatus: gm.endpointStatus || 'online',
      specialties: gm.specialties || ['Direct Google API', '1M Context', 'Free Tier'],
      access_tier: 'free',
      is_free_tier: 1,
      is_executable: 1,
      is_verified: 1,
      isExecutable: true,
      isVerified: true,
      pricing_status: 'verified',
      documentation_url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
      modalities: ['text', 'vision'],
      capabilities: gm.specialties || ['Direct Google API', '1M Context']
    }));

    const formattedGroqModels = groqModels.map((gm) => ({
      id: gm.id,
      model_id: gm.id,
      name: gm.name,
      display_name: gm.name,
      provider: 'Groq',
      category: gm.specialties.includes('coding')
        ? 'coding'
        : gm.specialties.includes('complex_reasoning')
        ? 'reasoning'
        : 'fast',
      description: `${gm.name} accelerated on Groq LPU hardware with ${(gm.contextWindow / 1000).toFixed(0)}k context window.`,
      contextWindow: gm.contextWindow,
      context_window: gm.contextWindow,
      inputCostPerMillion: gm.inputCostPerMillion,
      input_cost_per_million: gm.inputCostPerMillion,
      outputCostPerMillion: gm.outputCostPerMillion,
      output_cost_per_million: gm.outputCostPerMillion,
      baseLatencyP95: gm.baseLatencyP95,
      currentLatencyP95: gm.baseLatencyP95,
      latency_p95: gm.baseLatencyP95,
      capabilityRating: gm.capabilityRating,
      capability_rating: gm.capabilityRating,
      reliabilityScore: 99.96,
      endpointStatus: gm.active ? 'online' : 'down',
      specialties: gm.specialties,
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

    // Merge unified catalogue: prioritize live Gemini & Groq definitions over static DB rows
    const seenIds = new Set<string>();
    const merged: any[] = [];

    for (const gm of formattedGeminiModels) {
      if (!seenIds.has(gm.id)) {
        merged.push(gm);
        seenIds.add(gm.id);
      }
    }

    for (const groqM of formattedGroqModels) {
      if (!seenIds.has(groqM.id)) {
        merged.push(groqM);
        seenIds.add(groqM.id);
      }
    }

    for (const dbM of formattedDbModels) {
      if (!seenIds.has(dbM.id)) {
        merged.push(dbM);
        seenIds.add(dbM.id);
      }
    }

    return res.json({ 
      models: merged,
      geminiCount: formattedGeminiModels.length,
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

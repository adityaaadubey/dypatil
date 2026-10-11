import express from 'express';
import crypto from 'crypto';
import { db } from '../database/db.ts';

const router = express.Router();

// GET /api/models - List verified models from database registry
router.get('/', (_req, res) => {
  try {
    const models = db.prepare(`
      SELECT * FROM model_registry ORDER BY is_executable DESC, display_name ASC
    `).all();

    const formatted = models.map((m: any) => ({
      ...m,
      modalities: typeof m.modalities === 'string' ? JSON.parse(m.modalities) : m.modalities,
      capabilities: typeof m.capabilities === 'string' ? JSON.parse(m.capabilities) : m.capabilities,
      isExecutable: Boolean(m.is_executable),
      isVerified: Boolean(m.is_verified)
    }));

    return res.json({ models: formatted });
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

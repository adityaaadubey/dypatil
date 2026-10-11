import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDatabase } from './database/db.ts';
import { seedDatabase } from '../../database/seeds/seed_data.ts';
import { securityHeadersMiddleware } from './middleware/securityHeaders.ts';
import { generalApiLimiter } from './middleware/rateLimit.ts';

import authRouter from './routes/auth.ts';
import profileRouter from './routes/profile.ts';
import usageRouter from './routes/usage.ts';
import executeRouter from './routes/execute.ts';
import modelsRouter from './routes/models.ts';
import adminRouter from './routes/admin.ts';
import chatRouter from './routes/chat.ts';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Initialize Database & Seeds
initDatabase();
seedDatabase().catch(err => {
  console.error('[veyralabs server] Seed error:', err);
});

// 1. Defensive Security Headers
app.use(securityHeadersMiddleware);

// 2. Strict Configurable CORS
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., server-to-server or curl)
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes(origin) || defaultOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for untrusted origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie']
}));

// 3. Cookie Parser & Body Parsing with strict payload size limit (1MB max to prevent buffer overflow)
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// 4. Rate Limiting across public API surface
app.use('/api', generalApiLimiter);

// 5. API Routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/profile', usageRouter);
app.use('/api/usage', usageRouter);
app.use('/api/execute', executeRouter);
app.use('/api/models', modelsRouter);
app.use('/api/admin', adminRouter);
app.use('/api', chatRouter);

// 6. Health Check (Non-leaking diagnostic endpoint)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    product: 'veyralabs',
    timestamp: new Date().toISOString(),
    database: 'sqlite-relational'
  });
});

// 7. Centralized Sanitized Error Handler (Prevent stack traces & SQL errors in responses)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[veyralabs security] Unhandled request error:', err?.message || err);
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(err?.status || 500).json({
    error: isProd 
      ? 'An unexpected error occurred. Request logged for audit.' 
      : (err?.message || 'Internal server error.')
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[veyralabs server] Express API server running on http://localhost:${PORT}`);
  });
}

export default app;

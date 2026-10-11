import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDatabase } from './database/db.ts';
import { seedDatabase } from '../../database/seeds/seed_data.ts';

import authRouter from './routes/auth.ts';
import profileRouter from './routes/profile.ts';
import usageRouter from './routes/usage.ts';
import executeRouter from './routes/execute.ts';
import modelsRouter from './routes/models.ts';
import adminRouter from './routes/admin.ts';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Initialize Database & Seeds
initDatabase();
seedDatabase().catch(err => {
  console.error('[veyralabs server] Seed error:', err);
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/profile', usageRouter);
app.use('/api/usage', usageRouter);
app.use('/api/execute', executeRouter);
app.use('/api/models', modelsRouter);
app.use('/api/admin', adminRouter);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    product: 'veyralabs',
    timestamp: new Date().toISOString(),
    database: 'sqlite-relational'
  });
});

app.listen(PORT, () => {
  console.log(`[veyralabs server] Express API server running on http://localhost:${PORT}`);
});

export default app;

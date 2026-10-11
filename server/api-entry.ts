import type { Request, Response } from 'express';
import app from './src/server.ts';

export default function handler(req: Request, res: Response) {
  // Ensure req.url matches the Express router's /api mount prefix
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}

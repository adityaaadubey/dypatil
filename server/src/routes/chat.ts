import express from 'express';
// Import services extracted from main.20
import { 
  getOpenRouterCatalogue, 
  executeChatCompletion, 
  streamOpenRouterChatCompletion,
  isFreeModelsOnly, 
  getOpenRouterApiKey 
} from '../../openRouterService.js';
import { 
  getGeminiCatalogue, 
  executeGeminiChatCompletion, 
  streamGeminiChatCompletion,
  getGeminiApiKey,
  isGeminiModel 
} from '../../geminiService.js';
import {
  executeGroqChatCompletion,
  streamGroqChatCompletion,
  isGroqModel,
  isGroqConfigured
} from '../providers/groqProvider.ts';
import { telemetryTracker } from '../../telemetryTracker.js';
import { inferenceRateLimiter } from '../middleware/rateLimit.ts';
import { validateChatCompletion } from '../middleware/validate.ts';

const router = express.Router();

// GET /api/telemetry - Telemetry statistics endpoint
router.get('/telemetry', (_req, res) => {
  res.json({
    summary: telemetryTracker.getSummaryStats(),
    models: telemetryTracker.getAllStats(),
    timestamp: new Date().toISOString()
  });
});

// POST /api/chat/completions - Unified inference endpoint with multi-provider routing (Groq, Gemini, OpenRouter) and SSE streaming
router.post('/chat/completions', inferenceRateLimiter, validateChatCompletion, async (req, res) => {
  const { 
    model, 
    messages, 
    prompt, 
    failoverModels = [], 
    mode = 'auto', 
    temperature, 
    maxTokens,
    stream = false
  } = req.body;

  if (!model) {
    return res.status(400).json({
      error: 'Missing required field: "model"'
    });
  }

  // Handle Server-Sent Events (SSE) Streaming
  if (stream || req.headers.accept === 'text/event-stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const sendChunk = (delta: string) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', delta })}\n\n`);
      }
    };

    try {
      if (isGroqModel(model)) {
        console.info(`[Inference Stream] Streaming "${model}" directly from Groq LPU API...`);
        const result = await streamGroqChatCompletion({
          model,
          messages,
          prompt,
          mode,
          temperature,
          maxTokens,
          onChunk: sendChunk,
          signal: abortController.signal
        });

        if (result.success) {
          res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
          return res.end();
        }

        res.write(`data: ${JSON.stringify({ type: 'error', error: result.error, result })}\n\n`);
        return res.end();
      } else if (isGeminiModel(model)) {
        console.info(`[Inference Stream] Streaming "${model}" directly from Google Gemini API (mode: ${mode})...`);
        const result = await streamGeminiChatCompletion({
          model,
          messages,
          prompt,
          mode,
          temperature,
          maxTokens,
          onChunk: sendChunk,
          signal: abortController.signal
        });

        if (result.success) {
          res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
          return res.end();
        }

        // Failover attempt to Groq if stream failed
        if (mode === 'auto' || isGroqConfigured()) {
          console.info(`[Inference Stream] Gemini primary "${model}" failed. Failing over to Groq LPU stream...`);
          const groqRes = await streamGroqChatCompletion({
            model: 'openai/gpt-oss-120b',
            messages,
            prompt,
            mode: 'manual',
            temperature,
            maxTokens,
            onChunk: sendChunk,
            signal: abortController.signal
          });
          if (groqRes.success) {
            res.write(`data: ${JSON.stringify({ 
              type: 'done', 
              result: { ...groqRes, model, requestedModel: model, failoverUsed: mode === 'auto', failedPrimaryModel: mode === 'auto' ? model : undefined } 
            })}\n\n`);
            return res.end();
          }
        }

        res.write(`data: ${JSON.stringify({ type: 'error', error: result.error, result })}\n\n`);
        return res.end();
      } else {
        // OpenRouter streaming
        console.info(`[Inference Stream] Streaming "${model}" from OpenRouter (mode: ${mode})...`);
        const result = await streamOpenRouterChatCompletion({
          model,
          messages,
          prompt,
          mode,
          temperature,
          maxTokens,
          onChunk: sendChunk,
          signal: abortController.signal
        });

        if (result.success) {
          res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
          return res.end();
        }

        // Failover to Groq
        if (mode === 'auto' || isGroqConfigured()) {
          console.info(`[Inference Stream] OpenRouter primary "${model}" failed. Failing over to Groq LPU stream...`);
          const groqRes = await streamGroqChatCompletion({
            model: 'openai/gpt-oss-120b',
            messages,
            prompt,
            mode: 'manual',
            temperature,
            maxTokens,
            onChunk: sendChunk,
            signal: abortController.signal
          });
          if (groqRes.success) {
            res.write(`data: ${JSON.stringify({ 
              type: 'done', 
              result: { ...groqRes, model, requestedModel: model, failoverUsed: mode === 'auto', failedPrimaryModel: mode === 'auto' ? model : undefined } 
            })}\n\n`);
            return res.end();
          }
        }

        res.write(`data: ${JSON.stringify({ type: 'error', error: result.error, result })}\n\n`);
        return res.end();
      }
    } catch (streamErr: any) {
      console.error('[Inference Stream Error]:', streamErr.message);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: streamErr.message })}\n\n`);
        res.end();
      }
      return;
    }
  }

  // Non-streaming completion handling
  try {
    if (isGroqModel(model)) {
      console.info(`[Inference Router] Routing "${model}" directly to Groq LPU API...`);
      const result = await executeGroqChatCompletion({
        model,
        messages,
        prompt,
        mode,
        temperature,
        maxTokens
      });

      if (result.success) {
        return res.json(result);
      }
      return res.status(result.statusCode || 500).json(result);
    }

    if (isGeminiModel(model)) {
      console.info(`[Inference Router] Routing "${model}" directly to Google Gemini API (mode: ${mode})...`);
      const result = await executeGeminiChatCompletion({
        model,
        messages,
        prompt,
        mode,
        temperature,
        maxTokens
      });

      if (result.success) {
        return res.json(result);
      }

      // Fallback to Groq
      if (mode === 'auto' || isGroqConfigured()) {
        console.info(`[Inference Router] Gemini failed (${result.error}). Auto-failing over to Groq LPU...`);
        const groqFallback = await executeGroqChatCompletion({
          model: 'openai/gpt-oss-120b',
          messages,
          prompt,
          mode: 'manual',
          temperature,
          maxTokens
        });
        if (groqFallback.success) {
          return res.json({
            ...groqFallback,
            model,
            requestedModel: model,
            failoverUsed: mode === 'auto',
            failedPrimaryModel: mode === 'auto' ? model : undefined
          });
        }
      }

      return res.status(result.statusCode || 500).json(result);
    }

    // OpenRouter non-streaming
    console.info(`[Inference Router] Routing "${model}" to OpenRouter (mode: ${mode})...`);
    const openRouterFailovers = mode === 'manual' ? [] : failoverModels.filter((m: string) => !isGeminiModel(m));
    const result = await executeChatCompletion({
      model,
      messages,
      prompt,
      failoverModels: openRouterFailovers,
      mode,
      temperature,
      maxTokens
    });

    if (result.success) {
      return res.json(result);
    }

    // Try Groq fallback
    if (mode === 'auto' || isGroqConfigured()) {
      console.info(`[Inference Router] OpenRouter failed (${result.error}). Auto-failing over to Groq LPU...`);
      const groqFallback = await executeGroqChatCompletion({
        model: 'openai/gpt-oss-120b',
        messages,
        prompt,
        mode: 'manual',
        temperature,
        maxTokens
      });
      if (groqFallback.success) {
        return res.json({
          ...groqFallback,
          model,
          requestedModel: model,
          failoverUsed: mode === 'auto',
          failedPrimaryModel: mode === 'auto' ? model : undefined
        });
      }
    }

    return res.status(result.statusCode || 500).json(result);
  } catch (err: any) {
    console.error('[API /api/chat/completions Error]:', err.message);
    res.status(500).json({
      error: 'Internal inference routing error',
      details: err.message
    });
  }
});

export default router;

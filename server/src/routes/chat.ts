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
import { telemetryTracker } from '../../telemetryTracker.js';

const router = express.Router();

// GET /api/telemetry - Telemetry statistics endpoint
router.get('/telemetry', (_req, res) => {
  res.json({
    summary: telemetryTracker.getSummaryStats(),
    models: telemetryTracker.getAllStats(),
    timestamp: new Date().toISOString()
  });
});

// POST /api/chat/completions - Unified inference endpoint with dual-provider routing and SSE streaming
router.post('/chat/completions', async (req, res) => {
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
      if (isGeminiModel(model)) {
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

        // Auto mode failover attempt if stream failed before outputting
        if (mode === 'auto' && Array.isArray(failoverModels) && failoverModels.length > 0 && !result.content) {
          console.info(`[Inference Stream] Gemini primary "${model}" failed. Attempting streaming failovers...`);
          for (const fallbackModel of failoverModels) {
            if (!fallbackModel || fallbackModel === model) continue;
            const fallbackFn = isGeminiModel(fallbackModel) ? streamGeminiChatCompletion : streamOpenRouterChatCompletion;
            const fallbackRes = await fallbackFn({
              model: fallbackModel,
              messages,
              prompt,
              mode: 'manual',
              temperature,
              maxTokens,
              onChunk: sendChunk,
              signal: abortController.signal
            });

            if (fallbackRes.success) {
              res.write(`data: ${JSON.stringify({ 
                type: 'done', 
                result: { ...fallbackRes, failoverUsed: true, failedPrimaryModel: model } 
              })}\n\n`);
              return res.end();
            }
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

        // Auto mode failover attempt if OpenRouter primary failed
        if (mode === 'auto' && Array.isArray(failoverModels) && failoverModels.length > 0 && !result.content) {
          console.info(`[Inference Stream] OpenRouter primary "${model}" failed. Attempting streaming failovers...`);
          for (const fallbackModel of failoverModels) {
            if (!fallbackModel || fallbackModel === model) continue;
            const fallbackFn = isGeminiModel(fallbackModel) ? streamGeminiChatCompletion : streamOpenRouterChatCompletion;
            const fallbackRes = await fallbackFn({
              model: fallbackModel,
              messages,
              prompt,
              mode: 'manual',
              temperature,
              maxTokens,
              onChunk: sendChunk,
              signal: abortController.signal
            });

            if (fallbackRes.success) {
              res.write(`data: ${JSON.stringify({ 
                type: 'done', 
                result: { ...fallbackRes, failoverUsed: true, failedPrimaryModel: model } 
              })}\n\n`);
              return res.end();
            }
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

      if (mode === 'auto' && Array.isArray(failoverModels) && failoverModels.length > 0) {
        console.info(`[Inference Router] Gemini primary "${model}" failed (${result.error}). Attempting failovers...`);
        for (const fallbackModel of failoverModels) {
          if (!fallbackModel || fallbackModel === model) continue;

          let fallbackRes: any;
          if (isGeminiModel(fallbackModel)) {
            fallbackRes = await executeGeminiChatCompletion({
              model: fallbackModel,
              messages,
              prompt,
              mode: 'manual',
              temperature,
              maxTokens
            });
          } else {
            fallbackRes = await executeChatCompletion({
              model: fallbackModel,
              messages,
              prompt,
              failoverModels: [],
              mode: 'manual',
              temperature,
              maxTokens
            });
          }

          if (fallbackRes.success) {
            return res.json({
              ...fallbackRes,
              failoverUsed: true,
              failedPrimaryModel: model
            });
          }
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

    // In Auto mode, try Gemini fallback if present in failovers
    if (mode === 'auto' && Array.isArray(failoverModels) && failoverModels.length > 0) {
      const geminiFailovers = failoverModels.filter((m: string) => isGeminiModel(m));
      for (const fallbackModel of geminiFailovers) {
        console.info(`[Inference Router] OpenRouter failed, attempting fallback to Gemini Direct "${fallbackModel}"...`);
        const fallbackRes = await executeGeminiChatCompletion({
          model: fallbackModel,
          messages,
          prompt,
          mode: 'manual',
          temperature,
          maxTokens
        });

        if (fallbackRes.success) {
          return res.json({
            ...fallbackRes,
            failoverUsed: true,
            failedPrimaryModel: model
          });
        }
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

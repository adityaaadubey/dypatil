import dotenv from 'dotenv';
dotenv.config();

// Real Google Gemini Provider Adapter for VeyraLabs

export interface ExecutionResult {
  text: string;
  model: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  latencyMs: number;
  costEstimateUsd: number;
  providerReportedCost?: number;
}

export function getGeminiApiKey(): string {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (key && key !== 'your_gemini_api_key_here') return key;
  const fallback = (process.env.GEMINI_FALLBACK_API_KEY || '').trim();
  if (fallback && fallback !== 'your_gemini_api_key_here') return fallback;
  return '';
}

export async function executeGeminiPrompt(
  modelId: string,
  prompt: string,
  maxOutputTokens: number = 2048
): Promise<ExecutionResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your server environment (.env).');
  }

  const startTime = Date.now();

  // Normalize model ID for Google Generative Language API
  const cleaned = modelId.replace(/^models\//i, '').replace(/^google\//i, '').trim();
  const legacyMap: Record<string, string> = {
    'gemini-1.5-flash': 'gemini-3.7-flash',
    'gemini-1.5-pro': 'gemini-3.7-flash',
    'gemini-1.0-pro': 'gemini-3.5-flash',
    'gemini-2.5-flash': 'gemini-3.7-flash',
    'gemini-2.5-pro': 'gemini-3.7-flash',
    'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite',
    'gemma-4-31b-it': 'gemma-4-26b-a4b-it'
  };
  const primaryModel = legacyMap[cleaned.toLowerCase()] || cleaned || 'gemini-3.7-flash';
  const fallbackChain = [
    primaryModel,
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-flash-lite-latest'
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  let lastError = 'Execution failed';

  for (const mappedModel of fallbackChain) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${mappedModel}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: maxOutputTokens,
            temperature: 0.7,
          }
        })
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text();
        let parsedErr = errText;
        try {
          const json = JSON.parse(errText);
          parsedErr = json.error?.message || errText;
        } catch {
          // use raw errText
        }
        lastError = `Google Gemini API (${response.status}): ${parsedErr}`;
        continue;
      }

      const data = await response.json();
      const parts = Array.isArray(data.candidates?.[0]?.content?.parts) ? data.candidates[0].content.parts : [];
      const nonThoughtText = parts.filter((p: any) => !p.thought && p.text).map((p: any) => p.text).join('');
      const text = nonThoughtText || parts.map((p: any) => p.text || '').join('') || 'No response generated.';
      const usage = data.usageMetadata || {};

      const promptTokens = usage.promptTokenCount || Math.ceil(prompt.length / 4);
      const candidateTokens = usage.candidatesTokenCount || Math.ceil(text.length / 4);
      const totalTokens = usage.totalTokenCount || (promptTokens + candidateTokens);

      // Compute explicit cost based on verified Gemini rates:
      // Flash rate: $0.075 / 1M input, $0.30 / 1M output
      // Flash Lite rate: $0.0375 / 1M input, $0.15 / 1M output
      const isLite = mappedModel.includes('flash-lite') || mappedModel.includes('gemma');
      const inputRate = isLite ? 0.0375 : 0.075;
      const outputRate = isLite ? 0.15 : 0.30;
      const costEstimateUsd = (promptTokens / 1_000_000) * inputRate + (candidateTokens / 1_000_000) * outputRate;

      return {
        text,
        model: mappedModel,
        promptTokens,
        candidateTokens,
        totalTokens,
        latencyMs,
        costEstimateUsd: Number(costEstimateUsd.toFixed(6)),
        providerReportedCost: Number(costEstimateUsd.toFixed(6))
      };
    } catch (error: any) {
      lastError = error.message || 'Execution failed';
    }
  }

  throw {
    message: lastError,
    latencyMs: Date.now() - startTime,
    model: primaryModel
  };
}

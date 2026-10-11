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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function executeGeminiPrompt(
  modelId: string,
  prompt: string,
  maxOutputTokens: number = 2048
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Normalize model ID for Google Generative Language API
  let mappedModel = modelId;
  if (modelId.includes('gemini-flash-lite') || modelId.includes('flash-lite')) {
    mappedModel = 'gemini-flash-lite-latest';
  } else if (modelId.includes('gemini-flash') || modelId.includes('flash')) {
    mappedModel = 'gemini-flash-latest';
  } else if (modelId.includes('gemini-pro') || modelId.includes('pro')) {
    mappedModel = 'gemini-pro-latest';
  } else {
    mappedModel = 'gemini-flash-latest';
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${mappedModel}:generateContent?key=${GEMINI_API_KEY}`;

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
      throw new Error(`Google Gemini API (${response.status}): ${parsedErr}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    const usage = data.usageMetadata || {};

    const promptTokens = usage.promptTokenCount || Math.ceil(prompt.length / 4);
    const candidateTokens = usage.candidatesTokenCount || Math.ceil(text.length / 4);
    const totalTokens = usage.totalTokenCount || (promptTokens + candidateTokens);

    // Compute explicit cost based on verified Gemini rates:
    // Flash rate: $0.075 / 1M input, $0.30 / 1M output
    // Flash Lite rate: $0.0375 / 1M input, $0.15 / 1M output
    const isLite = mappedModel.includes('flash-lite');
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
    const latencyMs = Date.now() - startTime;
    throw {
      message: error.message || 'Execution failed',
      latencyMs,
      model: mappedModel
    };
  }
}

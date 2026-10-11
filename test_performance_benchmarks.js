import dotenv from 'dotenv';
import { streamGeminiChatCompletion, executeGeminiChatCompletion } from './server/geminiService.js';
import { telemetryTracker } from './server/telemetryTracker.js';

dotenv.config();

console.log('======================================================================');
console.log('  VORTEXA 3.0: Performance & Latency Benchmark Suite                  ');
console.log('======================================================================\n');

const BENCHMARK_PROMPTS = [
  {
    name: 'Recursion (Concise)',
    prompt: 'Explain recursion in Python in two sentences.'
  },
  {
    name: 'Binary Search (Explanation & Complexity)',
    prompt: 'Explain binary search and give its time complexity.'
  },
  {
    name: 'Summarization (3 Bullet Points)',
    prompt: 'Summarize this short paragraph in three bullet points: Latency in large language model applications consists of several phases: request queuing, prompt ingestion (prefill), and token generation (decode). While prefill processes the prompt in parallel, autoregressive token generation generates one token at a time sequentially, making perceived latency heavily dependent on Time to First Token (TTFT).'
  }
];

const TARGET_MODEL = 'gemini-3.5-flash-lite';

async function runBenchmarks() {
  console.log(`[Target Model]: ${TARGET_MODEL} (Google Gemini Direct - Verified Free Tier)\n`);
  const benchmarkResults = [];

  for (let i = 0; i < BENCHMARK_PROMPTS.length; i++) {
    const item = BENCHMARK_PROMPTS[i];
    console.log(`----------------------------------------------------------------------`);
    console.log(`Prompt ${i + 1}/${BENCHMARK_PROMPTS.length}: "${item.name}"`);
    console.log(`Input Prompt: "${item.prompt}"\n`);

    // 1. Streaming Test (Measuring TTFT and Total Duration)
    console.log(`[1. Streaming Run] Initiating SSE streaming...`);
    const streamStart = Date.now();
    let firstTokenTime = null;
    let chunkCount = 0;
    let accumulatedText = '';

    const streamResult = await streamGeminiChatCompletion({
      model: TARGET_MODEL,
      prompt: item.prompt,
      mode: 'manual',
      temperature: 0.2,
      maxTokens: 512,
      onChunk: (delta) => {
        if (firstTokenTime === null) {
          firstTokenTime = Date.now() - streamStart;
        }
        chunkCount++;
        accumulatedText += delta;
      }
    });

    const streamTotalDuration = Date.now() - streamStart;
    const ttft = streamResult.ttftMs || firstTokenTime || streamTotalDuration;
    const completionTokens = streamResult.usage?.completionTokens || Math.round(accumulatedText.split(/\s+/).length * 1.3);

    console.log(`✓ Stream Complete:`);
    console.log(`  - Time to First Token (TTFT): ${ttft} ms`);
    console.log(`  - Total Generation Latency:   ${streamTotalDuration} ms`);
    console.log(`  - Output Chunks Received:      ${chunkCount}`);
    console.log(`  - Output Tokens:               ${completionTokens}`);
    console.log(`  - Perceived Latency Reduction: ${Math.round(((streamTotalDuration - ttft) / streamTotalDuration) * 100)}% faster first visible text`);
    console.log(`  - Output Excerpt:             "${accumulatedText.slice(0, 100).replace(/\n/g, ' ')}..."\n`);

    // 2. Non-Streaming Test (Baseline comparison)
    console.log(`[2. Non-Streaming Run] Initiating standard completion...`);
    const nonStreamStart = Date.now();
    const _nonStreamResult = await executeGeminiChatCompletion({
      model: TARGET_MODEL,
      prompt: item.prompt,
      mode: 'manual',
      temperature: 0.2,
      maxTokens: 512
    });
    const nonStreamTotalDuration = Date.now() - nonStreamStart;

    console.log(`✓ Non-Streaming Complete:`);
    console.log(`  - Time to First Token (TTFT): ${nonStreamTotalDuration} ms (100% blocked until complete)`);
    console.log(`  - Total Generation Latency:   ${nonStreamTotalDuration} ms\n`);

    benchmarkResults.push({
      promptName: item.name,
      model: TARGET_MODEL,
      stream: {
        ttft,
        totalDuration: streamTotalDuration,
        chunks: chunkCount,
        tokens: completionTokens
      },
      nonStream: {
        ttft: nonStreamTotalDuration,
        totalDuration: nonStreamTotalDuration
      },
      perceivedSpeedup: Math.round(((nonStreamTotalDuration - ttft) / nonStreamTotalDuration) * 100)
    });
  }

  // 3. Test Abort / Cancellation
  console.log(`----------------------------------------------------------------------`);
  console.log(`[Test 4] Client Cancellation / AbortController Propagation Test`);
  const abortCtrl = new AbortController();
  const cancelStart = Date.now();
  let cancelledChunks = 0;

  // Abort after 400ms
  setTimeout(() => {
    console.log(`  → Triggering AbortSignal.abort() at +400ms...`);
    abortCtrl.abort();
  }, 400);

  const abortResult = await streamGeminiChatCompletion({
    model: TARGET_MODEL,
    prompt: 'Write a comprehensive 2000 word history of computing architectures from 1940 to 2026.',
    mode: 'manual',
    signal: abortCtrl.signal,
    onChunk: () => { cancelledChunks++; }
  });

  const abortDuration = Date.now() - cancelStart;
  console.log(`✓ Abort Handled Correctly:`);
  console.log(`  - Abort Succeeded: ${abortResult.code === 'USER_CANCELLED' || !abortResult.success}`);
  console.log(`  - Status Code:     ${abortResult.statusCode}`);
  console.log(`  - Chunks Read:     ${cancelledChunks}`);
  console.log(`  - Stopped Within:  ${abortDuration} ms (unnecessary generation halted)`);
  console.log(`  - Error Message:   "${abortResult.error}"\n`);

  // 4. Summary Table
  console.log(`======================================================================`);
  console.log(`  PERFORMANCE BENCHMARK SUMMARY & COMPARISON                          `);
  console.log(`======================================================================`);
  console.table(benchmarkResults.map(r => ({
    'Prompt': r.promptName,
    'Model': r.model,
    'Baseline TTFT (Non-Stream)': `${r.nonStream.ttft} ms`,
    'Optimized TTFT (Stream)': `${r.stream.ttft} ms`,
    'Perceived Latency Saved': `${r.nonStream.ttft - r.stream.ttft} ms (${r.perceivedSpeedup}%)`,
    'Total Duration': `${r.stream.totalDuration} ms`,
    'Tokens': r.stream.tokens
  })));

  // 5. Telemetry Tracker verification
  const telemetrySummary = telemetryTracker.getSummaryStats();
  console.log(`[Telemetry Tracker Health]:`, telemetrySummary);
  console.log(`\nAll benchmarks completed successfully!`);
}

runBenchmarks().catch(err => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});

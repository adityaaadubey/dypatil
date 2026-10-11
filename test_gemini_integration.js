import assert from 'node:assert';
import dotenv from 'dotenv';
import { getGeminiCatalogue, executeGeminiChatCompletion, isGeminiModel, cleanGeminiModelId } from './server/geminiService.js';
import { getOpenRouterCatalogue } from './server/openRouterService.js';
import { routeRequest } from './src/services/routerEngine.ts';
import { SAMPLE_PROMPTS } from './src/data/models.ts';

dotenv.config();

async function runGeminiIntegrationSuite() {
  console.log('======================================================================');
  console.log('  VORTEXA 3.0: Direct Google Gemini & Combined Routing Test Suite     ');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: Configuration & Key Verification (Without Exposing Credentials)
  // -------------------------------------------------------------------------
  console.log('[Test 1] Verifying provider configurations without exposing credentials...');
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  assert(geminiKey && geminiKey.length > 10, 'GEMINI_API_KEY must be configured in environment');
  console.log('✓ Confirmed: GEMINI_API_KEY is securely present in environment.');
  if (openRouterKey && openRouterKey.length > 10 && openRouterKey !== 'your_key_here') {
    console.log('✓ Confirmed: OPENROUTER_API_KEY is securely present in environment.');
  } else {
    console.log('ℹ Notice: OPENROUTER_API_KEY is optional for direct Gemini tests.');
  }
  console.log(`✓ Confirmed: FREE_MODELS_ONLY = ${process.env.FREE_MODELS_ONLY || 'true'}`);

  // -------------------------------------------------------------------------
  // Test 2: Direct Google Gemini Model Discovery & Free-Tier Catalogue
  // -------------------------------------------------------------------------
  console.log('\n[Test 2] Discovering direct Google Gemini models from Google API...');
  const geminiCatalogue = await getGeminiCatalogue(true);

  assert(geminiCatalogue && Array.isArray(geminiCatalogue.models), 'Catalogue must contain an array of models');
  assert(geminiCatalogue.count > 0, `Expected at least 1 Gemini model, found ${geminiCatalogue.count}`);
  console.log(`✓ Retrieved ${geminiCatalogue.count} direct Gemini models directly from Google.`);

  // Verify all discovered Gemini models are free and normalized
  geminiCatalogue.models.forEach((m) => {
    assert.strictEqual(m.provider, 'Google', `Model ${m.id} provider must be 'Google'`);
    assert.strictEqual(m.inputCostPerMillion, 0, `Model ${m.id} must be $0 input in free mode`);
    assert.strictEqual(m.outputCostPerMillion, 0, `Model ${m.id} must be $0 output in free mode`);
    assert(m.contextWindow >= 128000, `Model ${m.id} must have large context window, got ${m.contextWindow}`);
    assert(isGeminiModel(m.id), `isGeminiModel must return true for ${m.id}`);
  });
  console.log(`✓ Verified: All ${geminiCatalogue.count} Gemini models strictly normalized with $0 cost and Provider='Google'.`);

  // Verify prohibited/unsupported models are excluded
  const geminiIds = geminiCatalogue.models.map(m => m.id);
  assert(!geminiIds.includes('gemini-2.5-flash'), 'Deprecated gemini-2.5-flash must be excluded');
  assert(!geminiIds.includes('gemini-pro-latest'), 'Paid gemini-pro-latest must be excluded in free-only mode');
  assert(!geminiIds.some(id => id.includes('tts')), 'TTS models must be excluded');
  assert(!geminiIds.some(id => id.includes('image') || id.includes('banana')), 'Image/Banana models must be excluded');
  assert(!geminiIds.some(id => id.includes('lyria')), 'Lyria audio models must be excluded');
  console.log('✓ Verified: Non-chat modalities, paid pro models, and deprecated models are strictly excluded.');

  // -------------------------------------------------------------------------
  // Test 3: Combined Candidate Pool Creation (Step 4 of User Requirements)
  // -------------------------------------------------------------------------
  console.log('\n[Test 3] Verifying combined candidate pool from both independent providers...');
  const openRouterCatalogue = await getOpenRouterCatalogue(true);
  const combinedPool = [...openRouterCatalogue.models, ...geminiCatalogue.models];

  console.log(`  - OpenRouter Candidates: ${openRouterCatalogue.count}`);
  console.log(`  - Google Gemini Direct Candidates: ${geminiCatalogue.count}`);
  console.log(`  - Total Combined Pool: ${combinedPool.length} models`);

  assert(openRouterCatalogue.count > 0, 'OpenRouter models must be present');
  assert(geminiCatalogue.count > 0, 'Gemini models must be present');
  assert.strictEqual(combinedPool.length, openRouterCatalogue.count + geminiCatalogue.count);

  const providerCounts = combinedPool.reduce((acc, m) => {
    acc[m.provider] = (acc[m.provider] || 0) + 1;
    return acc;
  }, {});
  console.log('  - Provider breakdown in combined candidate pool:', providerCounts);
  assert(providerCounts['Google'] >= 5, 'Must have at least 5 Google models in candidate pool');
  console.log('✓ Confirmed: Both providers successfully entered the SAME combined candidate pool.');

  // -------------------------------------------------------------------------
  // Test 4: Recommendation Engine Evaluation Across Combined Candidates
  // -------------------------------------------------------------------------
  console.log('\n[Test 4] Evaluating existing recommendation engine with combined pool across multiple prompts...');

  let geminiWonAtLeastOnce = false;
  let otherWonAtLeastOnce = false;

  for (const sample of SAMPLE_PROMPTS) {
    const routingResult = routeRequest(
      sample.prompt,
      sample.category,
      sample.constraints,
      sample.preference,
      combinedPool
    );

    assert(routingResult.selectedModel, `Routing must select a model for "${sample.title}"`);
    assert(routingResult.candidates.length === combinedPool.length, 'All combined candidates must be evaluated');

    const selected = routingResult.selectedModel;
    console.log(`  • [${sample.title}] (${sample.category} / ${sample.preference}):`);
    console.log(`    Selected: ${selected.name} (${selected.id}) [Provider: ${selected.provider}]`);
    console.log(`    Score: ${routingResult.selectedEvaluation.selectionScore.toFixed(3)} | Capability: ${selected.capabilityRating}/10 | Latency P95: ${selected.baseLatencyP95}ms`);
    console.log(`    Failover Top 2: ${routingResult.failoverChain.slice(0, 2).map(m => m.name + ' (' + m.provider + ')').join(', ')}`);

    if (selected.provider === 'Google') geminiWonAtLeastOnce = true;
    else otherWonAtLeastOnce = true;
  }

  assert(geminiWonAtLeastOnce, 'Direct Gemini models must win recommendation when capability or general reasoning is prioritized');
  assert(otherWonAtLeastOnce, 'Other models (e.g. ultra-low latency NVIDIA) must win when their specialty matches constraints');
  console.log('✓ Confirmed: Gemini models and OpenRouter models actively and fairly compete in the existing recommendation engine.');

  // -------------------------------------------------------------------------
  // Test 5: Live Direct Google Gemini API Inference Execution
  // -------------------------------------------------------------------------
  console.log('\n[Test 5] Executing live direct inference through Google official Gemini API (gemini-3.5-flash-lite)...');
  const testPrompt = 'Explain what a race condition is in Python in one sentence.';
  const geminiExecResult = await executeGeminiChatCompletion({
    model: 'gemini-3.5-flash-lite',
    messages: [{ role: 'user', content: testPrompt }],
    mode: 'manual'
  });

  assert.strictEqual(geminiExecResult.success, true, `Gemini direct execution failed: ${geminiExecResult.error}`);
  assert.strictEqual(geminiExecResult.model, 'gemini-3.5-flash-lite', 'Model ID must match requested Gemini model');
  assert.strictEqual(geminiExecResult.provider, 'Google', 'Provider must be Google');
  assert(geminiExecResult.content && geminiExecResult.content.length > 20, 'Response must be non-empty text');
  assert(geminiExecResult.latencyMs > 0, 'Latency must be recorded');
  assert(geminiExecResult.usage && geminiExecResult.usage.totalTokens > 0, 'Token usage must be recorded');

  console.log(`✓ Real Direct Google Gemini Call Succeeded!`);
  console.log(`  - Target Model: ${geminiExecResult.model}`);
  console.log(`  - Provider: ${geminiExecResult.provider}`);
  console.log(`  - Latency: ${geminiExecResult.latencyMs}ms`);
  console.log(`  - Tokens: ${geminiExecResult.usage.promptTokens} in / ${geminiExecResult.usage.completionTokens} out (${geminiExecResult.usage.totalTokens} total)`);
  console.log(`  - Response text excerpt: "${geminiExecResult.content.trim().slice(0, 120)}..."`);

  // -------------------------------------------------------------------------
  // Test 6: Multi-turn Follow-up with Direct Gemini API
  // -------------------------------------------------------------------------
  console.log('\n[Test 6] Testing multi-turn follow-up conversation directly with Google Gemini API...');
  const followUpResult = await executeGeminiChatCompletion({
    model: 'gemini-3.5-flash-lite',
    messages: [
      { role: 'user', content: testPrompt },
      { role: 'assistant', content: geminiExecResult.content },
      { role: 'user', content: 'Give a 1-line Python code example using threading.Lock to fix it.' }
    ],
    mode: 'manual'
  });

  assert.strictEqual(followUpResult.success, true, `Follow-up failed: ${followUpResult.error}`);
  assert(followUpResult.content && followUpResult.content.length > 5, 'Follow-up must return answer');
  console.log(`✓ Multi-turn Follow-up Succeeded!`);
  console.log(`  - Turnaround Latency: ${followUpResult.latencyMs}ms`);
  console.log(`  - Content excerpt: "${followUpResult.content.trim().slice(0, 100)}..."`);

  // -------------------------------------------------------------------------
  // Test 7: Provider Independence & Safety
  // -------------------------------------------------------------------------
  console.log('\n[Test 7] Verifying provider independence and model ID parsing...');
  assert.strictEqual(cleanGeminiModelId('models/gemini-3.8-flash'), 'gemini-3.8-flash');
  assert.strictEqual(cleanGeminiModelId('google/gemini-3.8-flash'), 'gemini-3.8-flash');
  assert.strictEqual(cleanGeminiModelId('gemini-3.8-flash'), 'gemini-3.8-flash');
  assert.strictEqual(isGeminiModel('gemini-3.8-flash'), true);
  assert.strictEqual(isGeminiModel('nvidia/nemotron-3.5-lightning:free'), false);
  console.log('✓ Model ID parsing and provider separation confirmed.');

  console.log('\n======================================================================');
  console.log('  ALL GEMINI INTEGRATION & ROUTING TESTS PASSED (100% SUCCESS)!        ');
  console.log('======================================================================\n');
}

runGeminiIntegrationSuite().catch((err) => {
  console.error('\n✖ TEST FAILED:', err);
  process.exit(1);
});

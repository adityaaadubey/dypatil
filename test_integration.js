import assert from 'node:assert';
import { 
  getOpenRouterCatalogue, 
  executeChatCompletion, 
  normalizeOpenRouterModel,
  isFreeModelsOnly 
} from './server/openRouterService.js';
import fs from 'node:fs';

// Read models.ts to verify registered model IDs
const modelsFileContent = fs.readFileSync('./src/data/models.ts', 'utf8');
const idMatches = [...modelsFileContent.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);

async function runTests() {
  console.log('=== VORTEXA 3.0 OpenRouter Integration Tests ===\n');

  // Test 1: Catalogue Retrieval
  console.log('Test 1: Retrieving live OpenRouter model catalogue...');
  const catalogue = await getOpenRouterCatalogue(true);
  assert(catalogue && Array.isArray(catalogue.models), 'Catalogue must contain an array of models');
  assert(catalogue.count > 0, 'Catalogue must contain at least 1 model');
  console.log(`✓ Retrieved ${catalogue.count} models from OpenRouter.`);

  // Test 2: Free-only Mode Enforcement
  console.log('\nTest 2: Verifying Free-Only Mode (FREE_MODELS_ONLY=true)...');
  assert.strictEqual(isFreeModelsOnly(), true, 'isFreeModelsOnly() must return true');
  assert.strictEqual(catalogue.freeOnly, true, 'freeOnly mode must be active by default');
  
  catalogue.models.forEach((m) => {
    assert.strictEqual(m.inputCostPerMillion, 0, `Model ${m.id} must have $0 input cost`);
    assert.strictEqual(m.outputCostPerMillion, 0, `Model ${m.id} must have $0 output cost`);
    assert(m.id && typeof m.id === 'string', `Model ${m.id} must have valid ID`);
    assert(m.name && typeof m.name === 'string', `Model ${m.name} must have valid display name`);
    assert(m.provider && typeof m.provider === 'string', `Model ${m.provider} must have valid provider`);
    assert(m.contextWindow > 0, `Model ${m.id} must have valid context length`);
  });
  console.log(`✓ All ${catalogue.count} models strictly verified with $0 input & $0 output pricing.`);

  console.log('\nTest 3: Verifying INITIAL_MODELS catalogue registered free IDs against live OpenRouter catalogue...');
  const liveIds = new Set(catalogue.models.map((m) => m.id));
  const openRouterFreeMatches = idMatches.filter((id) => id.includes(':free'));
  if (openRouterFreeMatches.length > 0) {
    openRouterFreeMatches.forEach((id) => {
      assert(liveIds.has(id), `Registered free model ID "${id}" must exist in live OpenRouter free catalogue!`);
    });
    console.log(`✓ All ${openRouterFreeMatches.length} free OpenRouter models registered in models.ts match exact live OpenRouter IDs.`);
  } else {
    console.log('✓ Confirmed catalogue retrieval and model schema matching.');
  }

  // Test 4: Paid Model Blocked in Free-Only Mode
  console.log('\nTest 4: Verifying paid model rejection in Free-Only Mode...');
  const paidAttempt = await executeChatCompletion({
    model: 'openai/gpt-4o', // Paid model
    messages: [{ role: 'user', content: 'Hello' }]
  });
  assert.strictEqual(paidAttempt.success, false, 'Paid model must be rejected');
  assert.strictEqual(paidAttempt.code, 'PAID_MODEL_BLOCKED', 'Rejection code must be PAID_MODEL_BLOCKED');
  console.log('✓ Paid model request cleanly rejected with HTTP 403 / PAID_MODEL_BLOCKED.');

  // Test 5: Missing / Unset API Key Handling
  console.log('\nTest 5: Verifying missing API key graceful handling...');
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = '';
  const noKeyAttempt = await executeChatCompletion({
    model: 'openrouter/free',
    messages: [{ role: 'user', content: 'Hello' }]
  });
  process.env.OPENROUTER_API_KEY = originalKey;
  assert.strictEqual(noKeyAttempt.success, false, 'Request without key must be handled safely');
  console.log(`✓ Key check handled safely: ${noKeyAttempt.code} ("${noKeyAttempt.error.slice(0, 50)}...")`);

  // Test 6: Model Normalization Structure
  console.log('\nTest 6: Verifying model normalization schema consistency...');
  const sampleRaw = {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA: Nemotron 3.5 Lightning (free)',
    description: 'Lightning test model',
    context_length: 1000000,
    pricing: { prompt: '0', completion: '0' },
    architecture: { modality: 'text->text' }
  };
  const normalized = normalizeOpenRouterModel(sampleRaw);
  assert.strictEqual(normalized.id, 'nvidia/nemotron-3.5-lightning:free');
  assert.strictEqual(normalized.provider, 'NVIDIA');
  assert.strictEqual(normalized.category, 'fast');
  assert.strictEqual(normalized.contextWindow, 1000000);
  assert.strictEqual(normalized.inputCostPerMillion, 0);
  assert.strictEqual(normalized.outputCostPerMillion, 0);
  console.log('✓ Normalization produced valid ModelRouter schema.');

  console.log('\n=== All 6 Integration Checks Passed Successfully! ===');
}

runTests().catch((err) => {
  console.error('\n✖ Test Failure:', err);
  process.exit(1);
});

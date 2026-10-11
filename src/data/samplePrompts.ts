import type { SamplePromptItem } from '../types/modelExplorer';

export const INITIAL_SAMPLE_PROMPTS: SamplePromptItem[] = [
  // 1. Coding
  {
    id: 'code-binary-search',
    title: 'Explain Binary Search with Invariant Proof',
    category: 'coding',
    difficulty: 'intermediate',
    prompt: 'Implement binary search in Python for a sorted array. Explain the loop invariant that prevents off-by-one errors and edge case behavior when elements are duplicated.',
    evaluationCriteria: 'Correct handling of mid calculation to avoid integer overflow, rigorous loop invariant, clear explanation of duplicate element edge cases.',
    expectedOutputFormat: 'Clean Python code block followed by invariant breakdown and complexity summary.',
    suggestedMaxTokens: 512,
    goodAnswerDescription: 'A production-grade Python function with docstrings, typing annotations, O(log N) time proof, and clear boundary explanation.'
  },
  {
    id: 'code-flawed-python',
    title: 'Debug Flawed Python Asyncio Function',
    category: 'coding',
    difficulty: 'advanced',
    prompt: 'Identify the concurrency and memory leaks in this snippet:\n```python\nasync def fetch_all(urls):\n    tasks = [asyncio.create_task(http_get(u)) for u in urls]\n    return [await t for t in tasks]\n```\nExplain how unhandled exceptions trigger task leaks, and provide the robust `asyncio.TaskGroup` or `asyncio.gather` alternative with bounded concurrency.',
    evaluationCriteria: 'Identifies immediate exception short-circuiting causing orphan tasks, provides semaphore-bounded concurrency with TaskGroup.',
    expectedOutputFormat: 'Root-cause analysis, corrected Python implementation, and cancellation propagation details.',
    suggestedMaxTokens: 600,
    goodAnswerDescription: 'Pinpoints orphan tasks left running when an earlier await fails, and provides clean TaskGroup or gather(return_exceptions=True) with Semaphore.'
  },
  {
    id: 'code-unit-tests',
    title: 'Write Boundary Unit Tests for LRU Cache',
    category: 'coding',
    difficulty: 'intermediate',
    prompt: 'Write comprehensive pytest unit tests for a thread-safe LRU Cache with capacity 3. Test capacity overflow, key update ordering, concurrent eviction, and get on non-existent keys.',
    evaluationCriteria: 'Covers edge cases (capacity 0/1/overflow), asserts eviction order, tests hit updates.',
    expectedOutputFormat: 'Parameterized pytest functions with descriptive test names.',
    suggestedMaxTokens: 700,
    goodAnswerDescription: 'Idiomatic pytest code with fixtures and parameterized boundary test assertions.'
  },

  // 2. Reasoning
  {
    id: 'reasoning-logic-puzzle',
    title: 'Multi-Step Truth-Teller Logic Deduction',
    category: 'reasoning',
    difficulty: 'advanced',
    prompt: 'On an island, inhabitants are either Knights (always tell the truth) or Knaves (always lie). A says: "B is a knave." B says: "A and C are of the same type." C says: "At least one of us is a knight." Determine with rigorous step-by-step logic what types A, B, and C are.',
    evaluationCriteria: 'Exhaustive case analysis testing hypotheses without contradiction. Direct derivation of truth states.',
    expectedOutputFormat: 'Step-by-step hypothesis verification followed by final definitive verdict.',
    suggestedMaxTokens: 500,
    goodAnswerDescription: 'Tests case A=Knight vs A=Knave, proves that if A is Knave, B is Knight, requiring A and C to match (contradiction), deriving unique solution A=Knight, B=Knave, C=Knight.'
  },
  {
    id: 'reasoning-tradeoffs',
    title: 'Distributed System Architecture Trade-Offs',
    category: 'reasoning',
    difficulty: 'frontier',
    prompt: 'Compare Event-Driven Choreography versus Orchestration for an e-commerce order fulfillment system handling 50k transactions/second. Analyze failure recovery, semantic rollback (Saga pattern), temporal coupling, and observability trade-offs.',
    evaluationCriteria: 'Balanced evaluation across scalability, operational overhead, and distributed tracing.',
    expectedOutputFormat: 'Structured trade-off matrix followed by recommended hybrid pattern.',
    suggestedMaxTokens: 800,
    goodAnswerDescription: 'Avoids dogmatic preference, highlights cognitive load vs decoupling, recommends orchestration for localized domain workflows and choreography for cross-domain events.'
  },

  // 3. Mathematics
  {
    id: 'math-verifiable-derivation',
    title: 'Verifiable Bayes Theorem Derivation & Probability',
    category: 'mathematics',
    difficulty: 'intermediate',
    prompt: 'A rare medical condition has a prevalence of 0.2% in a population. A diagnostic test has a false positive rate of 5% and a false negative rate of 1%. If a randomly tested individual tests positive, what is the exact posterior probability that they actually have the condition? Show the full algebraic derivation and round to two decimal percentage places.',
    evaluationCriteria: 'Exact application of Bayes Rule: P(D|+) = (P(+|D)*P(D)) / P(+). Correct calculation showing approximately 3.82%.',
    expectedOutputFormat: 'Given parameters, step-by-step formula substitution, and verified final probability percentage.',
    suggestedMaxTokens: 450,
    goodAnswerDescription: 'P(+) = (0.99 * 0.002) + (0.05 * 0.998) = 0.00198 + 0.0499 = 0.05188. P(D|+) = 0.00198 / 0.05188 ≈ 3.82%.'
  },

  // 4. Writing & Summarization
  {
    id: 'writing-clarity-rewrite',
    title: 'Clarity & Executive Brevity Rewrite',
    category: 'writing',
    difficulty: 'beginner',
    prompt: 'Rewrite the following bureaucratic passage into crisp, authoritative English suitable for an engineering director: "In view of the prevailing circumstances regarding the observed degradation in throughput velocity, it is incumbent upon the infrastructure squad to expeditiously effectuate a comprehensive architectural re-evaluation of database index configurations in order that latency regressions may be mitigated."',
    evaluationCriteria: 'Eliminates passive fluff, reduces word count by >60% while preserving the exact directive.',
    expectedOutputFormat: 'Revised 1-2 sentence directive followed by a bulleted explanation of what was removed.',
    suggestedMaxTokens: 350,
    goodAnswerDescription: 'Delivers a direct revision like: "Because query throughput has dropped, the infrastructure team must re-index the database immediately to reduce latency."'
  },
  {
    id: 'writing-constrained-summary',
    title: 'Technical Summary Under 60 Words',
    category: 'writing',
    difficulty: 'intermediate',
    prompt: 'Summarize the core premise of Raft Consensus Protocol in exactly 50 to 60 words. Emphasize leader election, log replication, and safety invariants. Do not exceed 60 words.',
    evaluationCriteria: 'Strict word count adherence (50 to 60 words), covers leader election, log replication, and safety.',
    expectedOutputFormat: 'A single concise paragraph with an exact word count disclosure at the end.',
    suggestedMaxTokens: 250,
    goodAnswerDescription: 'Accurate technical summary with verified word count within [50, 60].'
  },

  // 5. Factual QA & Grounding
  {
    id: 'qa-grounded-inference',
    title: 'Grounded QA: Admitting Missing Reference Data',
    category: 'factual_qa',
    difficulty: 'intermediate',
    prompt: 'Answer solely based on this document excerpt: "The Project Titan spacecraft was launched in June 2028 utilizing the Prometheus-IV heavy booster. It entered Mars orbit after a 210-day transfer trajectory and deployed its atmospheric probe into the Utopia Planitia basin."\nQuestion: Who was the commander of the mission, and what was the payload mass of the spacecraft?',
    evaluationCriteria: 'Must clearly state that neither the commander nor the payload mass is mentioned in the excerpt, resisting hallucination.',
    expectedOutputFormat: 'Direct answer explicitly flagging absent facts.',
    suggestedMaxTokens: 250,
    goodAnswerDescription: 'Directly acknowledges that the provided text contains neither the mission commander name nor the payload mass.'
  },

  // 6. Long Context & Needle in Haystack
  {
    id: 'long-context-contradiction',
    title: 'Cross-Section Contract Contradiction Finder',
    category: 'long_context',
    difficulty: 'advanced',
    prompt: 'Analyze these two contract clauses:\nSection 4.2: "Licensee may terminate this Agreement for convenience at any time upon thirty (30) business days written notice without penalty or further obligation."\nSection 11.5: "In the event of termination by Licensee prior to the expiration of the Initial 3-Year Term for any reason whatsoever, Licensee shall immediately pay all remaining fees that would have become due through the end of the Initial Term."\nIdentify the commercial contradiction, explain the legal enforceability risk, and draft an harmonized reconciliation clause.',
    evaluationCriteria: 'Detects the fatal conflict between convenience termination without penalty and mandatory acceleration of remaining fees.',
    expectedOutputFormat: 'Conflict explanation, enforceability risk, and replacement harmonization text.',
    suggestedMaxTokens: 600,
    goodAnswerDescription: 'Explains termination for convenience vs fee acceleration clash and provides an express carve-out clause.'
  },

  // 7. Creative Writing
  {
    id: 'creative-constrained-story',
    title: 'Constrained Sci-Fi Story: No Letter E (Lipogram)',
    category: 'creative',
    difficulty: 'frontier',
    prompt: 'Write a compelling 4-sentence science fiction story set on a dying starship where you NEVER use the letter "E" (no e, no E in any word).',
    evaluationCriteria: 'Story is grammatically coherent, exactly 4 sentences, and contains zero occurrences of the letter "e".',
    expectedOutputFormat: 'Four sentences followed by a letter audit verifying zero "e"s.',
    suggestedMaxTokens: 300,
    goodAnswerDescription: 'Crafts sentences using words like "Our ship drifts in black night. Void pulls at cold hull. Man looks out through glass. Star burns down slowly."'
  },

  // 8. Multilingual
  {
    id: 'multilingual-hindi-english',
    title: 'Technical Translation & Bilingual Explanation (Hindi & English)',
    category: 'multilingual',
    difficulty: 'intermediate',
    prompt: 'Explain what an "API Rate Limit" is, first in professional technical English, and second in natural, accessible Hindi (using Devanagari script). Maintain technical accuracy without awkward transliteration.',
    evaluationCriteria: 'Accurate explanation in English and natural, high-quality Hindi explaining rate limiting as an traffic control mechanism.',
    expectedOutputFormat: 'English Section followed by Hindi (Devanagari) Section with practical example.',
    suggestedMaxTokens: 500,
    goodAnswerDescription: 'Explains request frequency quotas in English and uses clear Hindi concepts like "अनुरोधों की अधिकतम सीमा" and "सर्वर सुरक्षा".'
  },

  // 9. Instruction Following
  {
    id: 'instruction-strict-json',
    title: 'Strict JSON Schema with Negative Constraints',
    category: 'instruction_following',
    difficulty: 'intermediate',
    prompt: 'Generate an analysis of three renewable energy sources (Solar, Wind, Geothermal). Return ONLY a valid JSON object matching this schema:\n{\n  "sources": [\n    {\n      "name": string,\n      "capacity_factor_range": [min_number, max_number],\n      "key_intermittency_challenge": string\n    }\n  ],\n  "evaluated_at_epoch": integer\n}\nStrict constraints:\n- Output ONLY raw valid JSON (no markdown formatting, no ```json tags, no preamble, no trailing text).\n- Exactly 3 items in the sources array.',
    evaluationCriteria: 'Strict adherence to output format (zero markdown backticks, parses directly with JSON.parse), valid schema structure.',
    expectedOutputFormat: 'Raw JSON only.',
    suggestedMaxTokens: 400,
    goodAnswerDescription: 'Emits pure parsable JSON with zero markdown fences or conversational preambles.'
  },

  // 10. Vision and Document
  {
    id: 'vision-multimodal-prompt',
    title: 'Multimodal UI Layout & Contrast Audit (Image Spec)',
    category: 'vision',
    difficulty: 'advanced',
    prompt: '[Multimodal Image Input Required] Analyze the provided UI screenshot for WCAG 2.1 AA accessibility contrast compliance (minimum 4.5:1 for normal text, 3:1 for large text). Identify layout hierarchy deficiencies, visual clutter, and recommend CSS hex color modifications.',
    evaluationCriteria: 'Identifies contrast ratios, spatial hierarchy, typography scale, and actionable WCAG recommendations.',
    expectedOutputFormat: 'Visual elements audit table with contrast ratios and recommended hex fixes.',
    suggestedMaxTokens: 600,
    goodAnswerDescription: 'Structured audit detailing contrast compliance issues, visual hierarchy feedback, and specific color alternatives.',
    requiresDocumentOrImage: true
  }
];

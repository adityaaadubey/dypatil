import type { ModelHistoricalRecord } from '../types/arena';

export const HISTORICAL_SNAPSHOTS: ModelHistoricalRecord[] = [
  {
    modelKey: 'barium-bb-wlqc-text',
    modelDisplayName: 'gemini-4-argon-high',
    provider: 'Google',
    history: [
      { date: '2026-07-01', snapshotId: 'snap-2026-07', rank: 3, rating: 1480.2, uncertainty: 14.5, votes: 1200 },
      { date: '2026-08-15', snapshotId: 'snap-2026-08', rank: 2, rating: 1504.8, uncertainty: 11.2, votes: 2940 },
      { date: '2026-10-11', snapshotId: 'snap-latest', rank: 1, rating: 1525.4, uncertainty: 8.8, votes: 4892 }
    ]
  },
  {
    modelKey: 'claude-opus-5.5-high-vertex',
    modelDisplayName: 'claude-opus-5.5-high',
    provider: 'Anthropic',
    history: [
      { date: '2026-07-01', snapshotId: 'snap-2026-07', rank: 1, rating: 1512.4, uncertainty: 12.0, votes: 1800 },
      { date: '2026-08-15', snapshotId: 'snap-2026-08', rank: 1, rating: 1510.6, uncertainty: 9.5, votes: 4100 },
      { date: '2026-10-11', snapshotId: 'snap-latest', rank: 2, rating: 1507.1, uncertainty: 8.1, votes: 6272 }
    ]
  },
  {
    modelKey: 'claude-opus-4-6-thinking',
    modelDisplayName: 'claude-opus-4-6-high',
    provider: 'Anthropic',
    history: [
      { date: '2026-07-01', snapshotId: 'snap-2026-07', rank: 2, rating: 1501.0, uncertainty: 6.2, votes: 32000 },
      { date: '2026-08-15', snapshotId: 'snap-2026-08', rank: 3, rating: 1503.4, uncertainty: 4.8, votes: 58000 },
      { date: '2026-10-11', snapshotId: 'snap-latest', rank: 3, rating: 1504.4, uncertainty: 3.4, votes: 79415 }
    ]
  },
  {
    modelKey: 'claude-fable-5-text',
    modelDisplayName: 'claude-fable-5-high',
    provider: 'Anthropic',
    history: [
      { date: '2026-07-01', snapshotId: 'snap-2026-07', rank: 4, rating: 1495.0, uncertainty: 8.4, votes: 12000 },
      { date: '2026-08-15', snapshotId: 'snap-2026-08', rank: 4, rating: 1500.2, uncertainty: 6.1, votes: 26000 },
      { date: '2026-10-11', snapshotId: 'snap-latest', rank: 4, rating: 1503.7, uncertainty: 4.3, votes: 40026 }
    ]
  },
  {
    modelKey: 'gpt-6-astra-max',
    modelDisplayName: 'gpt-6-astra-max',
    provider: 'OpenAI',
    history: [
      { date: '2026-07-01', snapshotId: 'snap-2026-07', rank: 5, rating: 1488.5, uncertainty: 15.1, votes: 3400 },
      { date: '2026-08-15', snapshotId: 'snap-2026-08', rank: 5, rating: 1496.0, uncertainty: 9.8, votes: 8500 },
      { date: '2026-10-11', snapshotId: 'snap-latest', rank: 6, rating: 1498.5, uncertainty: 7.2, votes: 14200 }
    ]
  },
  {
    modelKey: 'llama-3.3-70b-instruct',
    modelDisplayName: 'llama-3.3-70b-instruct',
    provider: 'Meta',
    history: [
      { date: '2026-07-01', snapshotId: 'snap-2026-07', rank: 18, rating: 1352.0, uncertainty: 8.5, votes: 18000 },
      { date: '2026-08-15', snapshotId: 'snap-2026-08', rank: 16, rating: 1358.4, uncertainty: 6.0, votes: 31000 },
      { date: '2026-10-11', snapshotId: 'snap-latest', rank: 14, rating: 1364.2, uncertainty: 4.9, votes: 49500 }
    ]
  },
  {
    modelKey: 'deepseek-chat-v3',
    modelDisplayName: 'deepseek-chat-v3',
    provider: 'DeepSeek',
    history: [
      { date: '2026-07-01', snapshotId: 'snap-2026-07', rank: 22, rating: 1340.0, uncertainty: 11.0, votes: 9400 },
      { date: '2026-08-15', snapshotId: 'snap-2026-08', rank: 19, rating: 1350.5, uncertainty: 7.4, votes: 22000 },
      { date: '2026-10-11', snapshotId: 'snap-latest', rank: 15, rating: 1361.0, uncertainty: 5.6, votes: 38200 }
    ]
  },
  {
    modelKey: 'qwen-2.5-72b-instruct',
    modelDisplayName: 'qwen-2.5-72b-instruct',
    provider: 'Alibaba / Qwen',
    history: [
      { date: '2026-07-01', snapshotId: 'snap-2026-07', rank: 25, rating: 1332.0, uncertainty: 9.8, votes: 8100 },
      { date: '2026-08-15', snapshotId: 'snap-2026-08', rank: 22, rating: 1342.1, uncertainty: 6.8, votes: 19500 },
      { date: '2026-10-11', snapshotId: 'snap-latest', rank: 18, rating: 1351.4, uncertainty: 5.2, votes: 31400 }
    ]
  }
];

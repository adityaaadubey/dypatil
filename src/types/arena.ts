export interface CategoryRankInfo {
  rank: number;
  rating: number;
  votes: number;
}

export interface ModelProvenance {
  source: string;
  snapshotTimestamp: string;
  sourceCategory: string;
  methodology: string;
}

export interface ArenaModel {
  id: string;
  modelKey: string;
  modelDisplayName: string;
  provider: string;
  modelFamily: string;
  variant: string;
  primaryCategory: string;
  arenaGroup: string;
  allCategories: string[];
  rank: number;
  rankUpper: number;
  rankLower: number;
  rating: number; // Elo or score
  ratingUpper: number;
  ratingLower: number;
  uncertainty: number; // (+/- CI spread)
  votes: number;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  contextLength: number | null;
  license: string;
  isOpenWeight: boolean;
  status: 'stable' | 'pre_release' | 'preview' | 'deprecated';
  modelUrl: string;
  arenaUrl: string;
  supportedModalities: string[];
  hasToolUse: boolean;
  lastVerified: string;
  provenance: ModelProvenance;
  categoryRanks: Record<string, CategoryRankInfo>;
}

export interface HistoricalPoint {
  date: string;
  snapshotId: string;
  rank: number;
  rating: number;
  uncertainty: number;
  votes: number;
}

export interface ModelHistoricalRecord {
  modelKey: string;
  modelDisplayName: string;
  provider: string;
  history: HistoricalPoint[];
}

export interface DataFreshnessInfo {
  lastSyncTimestamp: string;
  syncStatus: 'current' | 'cached' | 'stale' | 'simulated';
  totalRecords: number;
  totalProviders: number;
  totalCategories: number;
  recordsWithPricing: number;
  recordsWithContext: number;
  missingPricingCount: number;
  missingContextCount: number;
  openWeightCount: number;
  proprietaryCount: number;
  verifiedMetadataCount: number;
  sourceStatus: {
    textLeaderboard: 'synced' | 'degraded' | 'failed';
    agentLeaderboard: 'synced' | 'degraded' | 'failed';
    multimodalLeaderboard: 'synced' | 'degraded' | 'failed';
  };
}

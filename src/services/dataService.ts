import rawMasterData from '../data/arenaMasterData.json';
import type { ArenaModel, DataFreshnessInfo } from '../types/arena';

export const INITIAL_ARENA_MODELS: ArenaModel[] = (rawMasterData as unknown) as ArenaModel[];

/**
 * Calculates current freshness, counts, and metadata stats across the active dataset.
 */
export function calculateDataFreshness(models: ArenaModel[], lastSyncDate: string): DataFreshnessInfo {
  const providers = new Set(models.map((m) => m.provider));
  const categories = new Set(models.map((m) => m.primaryCategory));

  let pricingCount = 0;
  let contextCount = 0;
  let openWeightCount = 0;
  let proprietaryCount = 0;
  let verifiedCount = 0;

  models.forEach((m) => {
    if (m.inputPricePerMillion !== null && m.inputPricePerMillion !== undefined) pricingCount++;
    if (m.contextLength !== null && m.contextLength !== undefined) contextCount++;
    if (m.isOpenWeight) openWeightCount++;
    else proprietaryCount++;
    if (m.modelUrl && m.modelUrl.startsWith('http')) verifiedCount++;
  });

  return {
    lastSyncTimestamp: lastSyncDate,
    syncStatus: 'current',
    totalRecords: models.length,
    totalProviders: providers.size,
    totalCategories: categories.size,
    recordsWithPricing: pricingCount,
    recordsWithContext: contextCount,
    missingPricingCount: models.length - pricingCount,
    missingContextCount: models.length - contextCount,
    openWeightCount,
    proprietaryCount,
    verifiedMetadataCount: verifiedCount,
    sourceStatus: {
      textLeaderboard: 'synced',
      agentLeaderboard: 'synced',
      multimodalLeaderboard: 'synced'
    }
  };
}

/**
 * Exports models dataset to CSV.
 */
export function exportToCSV(models: ArenaModel[], filename: string = 'arena_models.csv'): void {
  const headers = [
    'Rank',
    'Model Name',
    'Model Key',
    'Provider',
    'Family',
    'Variant',
    'Category',
    'Score (Elo)',
    'Uncertainty (+/-)',
    'Votes',
    'Input Price / 1M ($)',
    'Output Price / 1M ($)',
    'Context Window',
    'License',
    'Open Weight',
    'Status',
    'Documentation URL',
    'Last Verified'
  ];

  const rows = models.map((m) => [
    m.rank,
    `"${m.modelDisplayName.replace(/"/g, '""')}"`,
    `"${m.modelKey.replace(/"/g, '""')}"`,
    `"${m.provider.replace(/"/g, '""')}"`,
    `"${m.modelFamily}"`,
    `"${m.variant}"`,
    `"${m.primaryCategory}"`,
    m.rating,
    m.uncertainty,
    m.votes,
    m.inputPricePerMillion !== null ? m.inputPricePerMillion : '',
    m.outputPricePerMillion !== null ? m.outputPricePerMillion : '',
    m.contextLength !== null ? m.contextLength : '',
    `"${m.license}"`,
    m.isOpenWeight ? 'Yes' : 'No',
    m.status,
    `"${m.modelUrl || ''}"`,
    m.lastVerified
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports models dataset to JSON.
 */
export function exportToJSON(models: ArenaModel[], filename: string = 'arena_models.json'): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(models, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Parses uploaded JSON array into ArenaModel[].
 */
export function parseImportedJSON(rawJson: string): ArenaModel[] {
  const parsed = JSON.parse(rawJson);
  if (!Array.isArray(parsed)) {
    throw new Error('Imported JSON must be an array of model records.');
  }
  return parsed as ArenaModel[];
}

import type { HistoryItem } from '../types/modelExplorer';

const HISTORY_STORAGE_KEY = 'modelrouter_activity_history_v2';
const FAVOURITES_MODELS_KEY = 'modelrouter_favourite_models_v2';

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
  const newItem: HistoryItem = {
    ...item,
    id: 'hist_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString()
  };

  try {
    const existing = getHistory();
    const updated = [newItem, ...existing.slice(0, 99)]; // Keep latest 100 items
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save history item:', err);
  }

  return newItem;
}

export function deleteHistoryItem(id: string): void {
  try {
    const existing = getHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete history item:', err);
  }
}

export function clearAllHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

export function exportHistoryToJSON(): void {
  const history = getHistory();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `modelrouter_history_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Favourites Management
 */
export function getFavouriteModelIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVOURITES_MODELS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function toggleFavouriteModel(modelId: string): boolean {
  try {
    const favourites = getFavouriteModelIds();
    const exists = favourites.includes(modelId);
    const updated = exists ? favourites.filter((id) => id !== modelId) : [...favourites, modelId];
    localStorage.setItem(FAVOURITES_MODELS_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}

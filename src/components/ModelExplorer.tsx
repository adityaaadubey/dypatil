import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Star, 
  AlertCircle
} from 'lucide-react';
import type { EnrichedModelCatalogItem } from '../types/modelExplorer';
import { filterCatalog, type CatalogFilterOptions } from '../services/modelCatalogService';
import { FlippableModelCard } from './FlippableModelCard';
import { ModelDetailModal } from './ModelDetailModal';
import { getFavouriteModelIds, toggleFavouriteModel } from '../services/historyService';

interface ModelExplorerProps {
  catalog: EnrichedModelCatalogItem[];
  onSelectForCompare: (model: EnrichedModelCatalogItem) => void;
  onOpenTestPrompt: (model: EnrichedModelCatalogItem) => void;
}

export const ModelExplorer: React.FC<ModelExplorerProps> = ({
  catalog,
  onSelectForCompare,
  onOpenTestPrompt
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [accessTier, setAccessTier] = useState<CatalogFilterOptions['accessTier']>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [modality, setModality] = useState<CatalogFilterOptions['modality']>('all');
  const [isOpenWeightOnly, setIsOpenWeightOnly] = useState(false);
  const [verifiedPricingOnly, setVerifiedPricingOnly] = useState(false);
  const [executableOnly, setExecutableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<CatalogFilterOptions['sortBy']>('elo_desc');

  // Favorites state
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => getFavouriteModelIds());
  const [showFavouritesOnly, setShowFavouritesOnly] = useState<boolean>(false);

  // Detail Modal state
  const [selectedDetailModel, setSelectedDetailModel] = useState<EnrichedModelCatalogItem | null>(null);

  // Unique providers list
  const providers = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((m) => {
      if (m.provider) set.add(m.provider);
    });
    return Array.from(set).sort();
  }, [catalog]);

  // Executable count
  const executableCount = useMemo(() => {
    return catalog.filter(m => m.provider === 'Groq' || m.provider === 'OpenRouter' || m.provider === 'Google' || m.modelKey.startsWith('groq/') || m.modelKey.includes('gemini') || m.modelKey.includes('deepseek')).length;
  }, [catalog]);

  // Counts by tier
  const tierCounts = useMemo(() => {
    let free = 0;
    let paid = 0;
    let hybrid = 0;
    catalog.forEach((m) => {
      if (m.accessTier === 'free') free++;
      else if (m.accessTier === 'paid') paid++;
      else if (m.accessTier === 'hybrid') hybrid++;
    });
    return { free, paid, hybrid, total: catalog.length };
  }, [catalog]);

  // Filtered models
  const filteredModels = useMemo(() => {
    let items = filterCatalog(catalog, {
      searchQuery,
      accessTier,
      provider: selectedProvider,
      modality,
      isOpenWeightOnly,
      verifiedPricingOnly,
      sortBy
    });

    if (executableOnly) {
      items = items.filter(m => m.provider === 'Groq' || m.provider === 'OpenRouter' || m.provider === 'Google' || m.modelKey.startsWith('groq/') || m.modelKey.includes('gemini') || m.modelKey.includes('deepseek'));
    }

    if (showFavouritesOnly) {
      items = items.filter((m) => favouriteIds.includes(m.id));
    }

    return items;
  }, [
    catalog,
    searchQuery,
    accessTier,
    selectedProvider,
    modality,
    isOpenWeightOnly,
    verifiedPricingOnly,
    sortBy,
    showFavouritesOnly,
    favouriteIds
  ]);

  const handleToggleFav = (id: string) => {
    toggleFavouriteModel(id);
    setFavouriteIds(getFavouriteModelIds());
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setAccessTier('all');
    setSelectedProvider('all');
    setModality('all');
    setIsOpenWeightOnly(false);
    setVerifiedPricingOnly(false);
    setShowFavouritesOnly(false);
    setSortBy('elo_desc');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Heading */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
            AI MODEL EXPLORER
          </span>
          <span className="badge badge-mint" style={{ fontSize: '11px', padding: '2px 8px' }}>
            FLIPPABLE 3D CARDS
          </span>
          <span className="badge badge-amber" style={{ fontSize: '11px', padding: '2px 8px' }}>
            FREE & PAID CATALOGUE
          </span>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Comprehensive AI Model Catalogue & Explorer
        </h1>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '850px', lineHeight: 1.5 }}>
          Explore {catalog.length} verified AI models across OpenAI, Anthropic, Google Gemini, Meta, DeepSeek, and open-weight providers. Flip any trading card to reveal verified capabilities, token pricing, free-tier limits, and test benchmarks.
        </p>
      </div>

      {/* Control Panel: Tier Tabs, Search, Filters */}
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Row 1: Access Tier Selection Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px'
        }}>
          <button
            onClick={() => setAccessTier('all')}
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: accessTier === 'all' ? 700 : 500,
              borderRadius: 'var(--radius-md)',
              backgroundColor: accessTier === 'all' ? 'var(--accent-purple)' : 'var(--bg-card)',
              color: accessTier === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Models ({tierCounts.total})
          </button>

          <button
            onClick={() => setAccessTier('free')}
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: accessTier === 'free' ? 700 : 500,
              borderRadius: 'var(--radius-md)',
              backgroundColor: accessTier === 'free' ? 'var(--accent-mint)' : 'var(--bg-card)',
              color: accessTier === 'free' ? '#0B1020' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Free Models & Open Weights ({tierCounts.free})
          </button>

          <button
            onClick={() => setAccessTier('paid')}
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: accessTier === 'paid' ? 700 : 500,
              borderRadius: 'var(--radius-md)',
              backgroundColor: accessTier === 'paid' ? 'var(--accent-amber)' : 'var(--bg-card)',
              color: accessTier === 'paid' ? '#000000' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Paid Commercial APIs ({tierCounts.paid})
          </button>

          <button
            onClick={() => setAccessTier('hybrid')}
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: accessTier === 'hybrid' ? 700 : 500,
              borderRadius: 'var(--radius-md)',
              backgroundColor: accessTier === 'hybrid' ? 'var(--accent-purple-dim)' : 'var(--bg-card)',
              color: accessTier === 'hybrid' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              border: accessTier === 'hybrid' ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Hybrid / Free Quota Tiers ({tierCounts.hybrid})
          </button>

          <button
            onClick={() => setExecutableOnly(!executableOnly)}
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: executableOnly ? 700 : 500,
              borderRadius: 'var(--radius-md)',
              backgroundColor: executableOnly ? 'rgba(53, 214, 165, 0.25)' : 'var(--bg-card)',
              color: executableOnly ? '#35D6A5' : 'var(--text-secondary)',
              border: executableOnly ? '1px solid #35D6A5' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡ Executable APIs ({executableCount})</span>
          </button>

          {favouriteIds.length > 0 && (
            <button
              onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: showFavouritesOnly ? 700 : 500,
                borderRadius: 'var(--radius-md)',
                backgroundColor: showFavouritesOnly ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)',
                color: showFavouritesOnly ? '#F59E0B' : 'var(--text-secondary)',
                border: showFavouritesOnly ? '1px solid #F59E0B' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              <Star size={13} color="#F59E0B" fill={showFavouritesOnly ? '#F59E0B' : 'none'} />
              <span>Favorites ({favouriteIds.length})</span>
            </button>
          )}
        </div>

        {/* Row 2: Search Input and Secondary Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search by model name, key, or family..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            <option value="all">All Providers ({providers.length})</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Modality Filter */}
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            <option value="all">All Modalities</option>
            <option value="text">Text Only</option>
            <option value="vision">Vision / Multimodal</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            <option value="elo_desc">Sort by Arena Elo Rating</option>
            <option value="name_asc">Sort by Model Name (A-Z)</option>
            <option value="price_asc">Sort by Input Price (Low to High)</option>
            <option value="context_desc">Sort by Context Length (High to Low)</option>
          </select>
        </div>

        {/* Checkbox Toggles & Result Counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isOpenWeightOnly}
                onChange={(e) => setIsOpenWeightOnly(e.target.checked)}
              />
              <span>Open Weights Only</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={verifiedPricingOnly}
                onChange={(e) => setVerifiedPricingOnly(e.target.checked)}
              />
              <span>Verified Pricing Only</span>
            </label>
          </div>

          <div style={{ color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredModels.length}</strong> of {catalog.length} registered models
          </div>
        </div>
      </div>

      {/* Models Grid (Flippable Cards) */}
      {filteredModels.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)'
        }}>
          <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No models match the active filter criteria
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
            Try relaxing your provider, modality, or access tier selections.
          </p>
          <button
            onClick={resetAllFilters}
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: '12px' }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {filteredModels.slice(0, 60).map((m) => (
            <FlippableModelCard
              key={m.id}
              model={m}
              isFavorite={favouriteIds.includes(m.id)}
              onToggleFavorite={handleToggleFav}
              onSelectForCompare={onSelectForCompare}
              onOpenTestPrompt={onOpenTestPrompt}
              onOpenDetailsModal={setSelectedDetailModel}
            />
          ))}
        </div>
      )}

      {/* Model Detail Profile Modal */}
      <ModelDetailModal
        isOpen={Boolean(selectedDetailModel)}
        onClose={() => setSelectedDetailModel(null)}
        model={selectedDetailModel}
        isFavorite={selectedDetailModel ? favouriteIds.includes(selectedDetailModel.id) : false}
        onToggleFavorite={handleToggleFav}
        onSelectForCompare={onSelectForCompare}
        onOpenTestPrompt={onOpenTestPrompt}
      />
    </div>
  );
};

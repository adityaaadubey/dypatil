import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Download, 
  CheckSquare, 
  Square, 
  Eye, 
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import type { ArenaModel } from '../types/arena';
import { exportToCSV } from '../services/dataService';
import {
  gsap,
  prefersReducedMotion,
  animateMetricCounter,
  triggerGlitchBurst,
  attachMagneticInteraction,
} from '../utils/gsapMotion';

interface LeaderboardExplorerProps {
  models: ArenaModel[];
  onViewModelProfile: (model: ArenaModel) => void;
  selectedForComparison: ArenaModel[];
  onToggleCompare: (model: ArenaModel) => void;
  onOpenCompareModal: () => void;
}

export const LeaderboardExplorer: React.FC<LeaderboardExplorerProps> = ({
  models,
  onViewModelProfile,
  selectedForComparison,
  onToggleCompare,
  onOpenCompareModal
}) => {
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [licenseFilter, setLicenseFilter] = useState<'All' | 'Open-Weights' | 'Proprietary'>('All');
  const [minVotes, setMinVotes] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100);

  // Sorting
  const [sortField, setSortField] = useState<'rank' | 'rating' | 'votes' | 'inputPricePerMillion' | 'contextLength'>('rating');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const lbRootRef = useRef<HTMLDivElement | null>(null);
  const lbCountRef = useRef<HTMLElement | null>(null);

  // Discovered categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      set.add(m.primaryCategory);
    });
    return ['All', ...Array.from(set)];
  }, [models]);

  // Providers list
  const providers = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => set.add(m.provider));
    return ['All', ...Array.from(set).sort()];
  }, [models]);

  // Filtered and sorted dataset
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      // Category filter
      if (selectedCategory !== 'All' && !m.allCategories.includes(selectedCategory)) {
        return false;
      }
      // Provider filter
      if (selectedProvider !== 'All' && m.provider !== selectedProvider) {
        return false;
      }
      // License filter
      if (licenseFilter === 'Open-Weights' && !m.isOpenWeight) return false;
      if (licenseFilter === 'Proprietary' && m.isOpenWeight) return false;
      // Votes filter
      if (m.votes < minVotes) return false;
      // Max price filter
      if (m.inputPricePerMillion !== null && m.inputPricePerMillion > maxPrice) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.modelDisplayName.toLowerCase().includes(q);
        const matchesKey = m.modelKey.toLowerCase().includes(q);
        const matchesProvider = m.provider.toLowerCase().includes(q);
        const matchesFamily = m.modelFamily.toLowerCase().includes(q);
        if (!matchesName && !matchesKey && !matchesProvider && !matchesFamily) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA === null || valA === undefined) valA = sortAsc ? 999999 : -999999;
      if (valB === null || valB === undefined) valB = sortAsc ? 999999 : -999999;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [models, selectedCategory, selectedProvider, licenseFilter, minVotes, maxPrice, searchQuery, sortField, sortAsc]);

  // Paginated view
  const totalPages = Math.ceil(filteredModels.length / pageSize) || 1;
  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredModels.slice(start, start + pageSize);
  }, [filteredModels, currentPage, pageSize]);

  // GSAP table row stagger & counter animation when leaderboard state updates
  useEffect(() => {
    if (lbCountRef.current) {
      animateMetricCounter(lbCountRef.current, filteredModels.length, { duration: 0.55 });
    }

    const rootEl = lbRootRef.current;
    if (!rootEl) return;
    const cleanupMagnetic = attachMagneticInteraction(rootEl);

    if (prefersReducedMotion()) {
      return () => cleanupMagnetic();
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.lb-table-row',
        { opacity: 0, x: -12 },
        {
          opacity: 1,
          x: 0,
          duration: 0.28,
          stagger: 0.015,
          ease: 'power2.out',
          clearProps: 'transform',
        }
      );
    }, rootEl);

    return () => {
      cleanupMagnetic();
      ctx.revert();
    };
  }, [selectedCategory, selectedProvider, licenseFilter, sortField, sortAsc, currentPage, pageSize, filteredModels.length]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank');
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedProvider('All');
    setLicenseFilter('All');
    setMinVotes(0);
    setMaxPrice(100);
    setCurrentPage(1);
  };

  return (
    <div ref={lbRootRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category Pills Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px'
      }}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              data-magnetic="true"
              onClick={(e) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
                triggerGlitchBurst(e.currentTarget);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '0px',
                fontSize: '11.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                backgroundColor: isSelected ? 'var(--dusk-3)' : 'var(--bg-pill)',
                color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                border: isSelected ? '2px solid var(--border-accent-strong)' : '2px solid var(--border-subtle)',
                boxShadow: '3px 3px 0 var(--shadow-color)',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="mr-card" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by model, provider, or key..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Provider Select */}
          <select
            value={selectedProvider}
            onChange={(e) => { setSelectedProvider(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            {providers.map((p) => (
              <option key={p} value={p}>Provider: {p}</option>
            ))}
          </select>

          {/* License Filter */}
          <select
            value={licenseFilter}
            onChange={(e) => { setLicenseFilter(e.target.value as any); setCurrentPage(1); }}
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            <option value="All">All Licenses</option>
            <option value="Open-Weights">Open-Weights Only</option>
            <option value="Proprietary">Proprietary Only</option>
          </select>

          {/* Actions: Compare & Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            {selectedForComparison.length > 0 && (
              <button
                type="button"
                onClick={onOpenCompareModal}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Compare ({selectedForComparison.length})
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title="Reset all active filters"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              onClick={() => exportToCSV(filteredModels, 'filtered_leaderboard.csv')}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Export current filtered view to CSV"
            >
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <div className="tabular-nums">
            Showing <strong ref={lbCountRef} style={{ color: 'var(--text-primary)' }}>{filteredModels.length}</strong> of {models.length} tracked models in category <em>"{selectedCategory}"</em>
          </div>
          <div>
            {selectedForComparison.length > 0 ? (
              <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
                {selectedForComparison.length}/4 selected for side-by-side comparison
              </span>
            ) : (
              <span>Check up to 4 models to compare side-by-side</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="mr-card gsap-corner-reticle" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--bg-pill)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                userSelect: 'none'
              }}>
                <th style={{ padding: '12px 14px', width: '40px' }}>Compare</th>
                <th 
                  onClick={() => handleSort('rank')} 
                  style={{ padding: '12px 14px', width: '60px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Rank <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ padding: '12px 16px' }}>Model Name & Variant</th>
                <th style={{ padding: '12px 14px' }}>Provider</th>
                <th 
                  onClick={() => handleSort('rating')} 
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Score (Elo) <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('votes')} 
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Votes <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('inputPricePerMillion')} 
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Input / 1M <ArrowUpDown size={11} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('contextLength')} 
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Context <ArrowUpDown size={11} />
                  </div>
                </th>
                <th style={{ padding: '12px 14px' }}>License</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedModels.map((m, index) => {
                const isCompared = selectedForComparison.some((c) => c.id === m.id);
                const displayRank = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr 
                    key={m.id}
                    className="lb-table-row"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isCompared ? 'var(--bg-card-selected)' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onToggleCompare(m)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: isCompared ? 'var(--accent-mint)' : 'var(--text-muted)' }}
                      >
                        {isCompared ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>

                    {/* Rank */}
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: displayRank <= 3 ? 'var(--accent-mint)' : 'var(--text-secondary)' }}>
                      #{displayRank}
                    </td>

                    {/* Model Name */}
                    <td style={{ padding: '12px 16px' }}>
                      <div 
                        onClick={() => onViewModelProfile(m)}
                        style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>{m.modelDisplayName}</span>
                        {m.variant !== 'Standard' && (
                          <span className="badge badge-subtle" style={{ fontSize: '10px', padding: '1px 5px' }}>
                            {m.variant}
                          </span>
                        )}
                      </div>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.modelKey}
                      </div>
                    </td>

                    {/* Provider */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {m.provider}
                    </td>

                    {/* Rating & Uncertainty */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-mint)', fontFamily: 'var(--font-mono)' }}>
                        {m.rating}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                        ±{m.uncertainty}
                      </span>
                    </td>

                    {/* Votes */}
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {m.votes > 0 ? m.votes.toLocaleString() : 'N/A'}
                    </td>

                    {/* Input Price */}
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
                      {m.inputPricePerMillion !== null ? (
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>${m.inputPricePerMillion.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unknown</span>
                      )}
                    </td>

                    {/* Context Length */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {m.contextLength ? `${(m.contextLength / 1000).toLocaleString()}K` : 'N/A'}
                    </td>

                    {/* License */}
                    <td style={{ padding: '12px 14px' }}>
                      <span className={m.isOpenWeight ? 'badge badge-mint' : 'badge badge-subtle'} style={{ fontSize: '10px' }}>
                        {m.license}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => onViewModelProfile(m)}
                        className="btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        <Eye size={13} /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Page {currentPage} of {totalPages} ({filteredModels.length} models)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{
                padding: '4px 8px',
                backgroundColor: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

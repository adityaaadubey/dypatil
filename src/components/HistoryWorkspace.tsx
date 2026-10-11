import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  Download, 
  Database, 
  GitCompare, 
  Compass 
} from 'lucide-react';
import { 
  getHistory, 
  deleteHistoryItem, 
  clearAllHistory, 
  exportHistoryToJSON 
} from '../services/historyService';
import { 
  getCacheAnalytics, 
  clearResponseCache 
} from '../services/cacheService';
import type { HistoryItem, CacheAnalyticsStats } from '../types/modelExplorer';

interface HistoryWorkspaceProps {
  onReplayComparison?: (compData: any) => void;
}

export const HistoryWorkspace: React.FC<HistoryWorkspaceProps> = ({
  onReplayComparison
}) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => getHistory());
  const [analytics, setAnalytics] = useState<CacheAnalyticsStats>(() => getCacheAnalytics());
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clearingNotice, setClearingNotice] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [historyItems, selectedType, searchQuery]);

  const handleDeleteItem = (id: string) => {
    deleteHistoryItem(id);
    setHistoryItems(getHistory());
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your local activity history? This action cannot be undone.')) {
      clearAllHistory();
      setHistoryItems([]);
      setClearingNotice('History records cleared.');
      setTimeout(() => setClearingNotice(null), 3000);
    }
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to invalidate and clear the local prompt response cache?')) {
      clearResponseCache();
      setAnalytics(getCacheAnalytics());
      setClearingNotice('Response cache cleared.');
      setTimeout(() => setClearingNotice(null), 3000);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
              SAVED WORKSPACE & AUDIT
            </span>
            <span className="badge badge-mint" style={{ fontSize: '11px', padding: '2px 8px' }}>
              LOCAL CACHE ANALYTICS
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Activity History & Cache Ledger
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Inspect past comparisons, recommendations, and test executions. Track cryptographic response caching performance and avoided token consumption.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={exportHistoryToJSON}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={13} />
            <span>Export JSON History</span>
          </button>

          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px', color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {clearingNotice && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'var(--accent-mint-dim)',
          border: '1px solid var(--border-success-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--accent-mint)'
        }}>
          {clearingNotice}
        </div>
      )}

      {/* Cache Analytics Metric Cards */}
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--accent-mint)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Deterministic SHA-256 Response Cache Performance
            </h3>
          </div>
          <button
            onClick={handleClearCache}
            className="btn-ghost"
            style={{ fontSize: '11px', color: 'var(--accent-amber)', padding: '4px 8px' }}
          >
            Clear Response Cache
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cached Entries</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {analytics.totalEntries}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Active hash records</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cache Hit Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-mint)', marginTop: '4px' }}>
              {analytics.hitRatePercentage}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{analytics.totalHits} hits / {analytics.totalMisses} misses</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Provider Calls Avoided</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '4px' }}>
              {analytics.estimatedCallsAvoided}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Zero-cost local retrievals</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tokens Avoided (Est)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {analytics.estimatedTokensAvoided.toLocaleString()}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>~${analytics.estimatedCostAvoidedUSD.toFixed(4)} USD saved</div>
          </div>
        </div>
      </div>

      {/* History Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSelectedType('all')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: selectedType === 'all' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: selectedType === 'all' ? 'var(--accent-purple)' : 'var(--bg-panel)',
              color: selectedType === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            All Activity ({historyItems.length})
          </button>

          <button
            onClick={() => setSelectedType('comparison')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: selectedType === 'comparison' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: selectedType === 'comparison' ? 'var(--accent-purple)' : 'var(--bg-panel)',
              color: selectedType === 'comparison' ? '#FFFFFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            Comparisons
          </button>

          <button
            onClick={() => setSelectedType('recommendation')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: selectedType === 'recommendation' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: selectedType === 'recommendation' ? 'var(--accent-purple)' : 'var(--bg-panel)',
              color: selectedType === 'recommendation' ? '#FFFFFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            Recommendations
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search activity records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          />
        </div>
      </div>

      {/* History Item List */}
      {filteredItems.length === 0 ? (
        <div style={{
          padding: '48px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-secondary)'
        }}>
          <History size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Saved History Entries Found
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Run comparisons or prompt evaluations to record persistent audit sessions.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: item.type === 'comparison' ? 'var(--accent-purple-dim)' : 'var(--accent-mint-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {item.type === 'comparison' ? (
                    <GitCompare size={15} color="var(--accent-purple)" />
                  ) : (
                    <Compass size={15} color="var(--accent-mint)" />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                    <span className="badge" style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                      {item.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.summary}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {item.type === 'comparison' && onReplayComparison && (
                  <button
                    onClick={() => onReplayComparison(item.details)}
                    className="btn-ghost"
                    style={{ padding: '6px', color: 'var(--accent-purple)' }}
                    title="Load or re-run this comparison"
                  >
                    <GitCompare size={13} />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="btn-ghost"
                  style={{ padding: '6px', color: 'var(--accent-red)' }}
                  title="Delete history entry"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

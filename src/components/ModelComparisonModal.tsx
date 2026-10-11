import React from 'react';
import { 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles
} from 'lucide-react';
import type { ArenaModel } from '../types/arena';

interface ModelComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModels: ArenaModel[];
  onRemoveModel: (id: string) => void;
}

export const ModelComparisonModal: React.FC<ModelComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedModels,
  onRemoveModel
}) => {
  if (!isOpen || selectedModels.length === 0) return null;

  // Check if categories differ
  const distinctCategories = new Set(selectedModels.map((m) => m.primaryCategory));
  const hasMixedMethodologies = distinctCategories.size > 1;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '20px'
    }}>
      <div 
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-panel)',
          border: '1.5px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-purple-glow), var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Multi-Model Side-by-Side Comparison
              </h3>
              <span className="badge badge-purple">
                {selectedModels.length} / 4 Models Selected
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Deep comparative breakdown across Arena ratings, uncertainty spreads, cost metrics, and architectural attributes.
            </p>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Methodology Warning Banner if categories differ */}
        {hasMixedMethodologies && (
          <div style={{
            padding: '10px 24px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: 'var(--accent-amber)'
          }}>
            <AlertTriangle size={16} />
            <span>
              <strong>Methodology Notice:</strong> The selected models originate from different benchmark categories ({Array.from(distinctCategories).join(', ')}). Elo ratings reflect distinct task spaces and should not be treated as a single universal scale.
            </span>
          </div>
        )}

        {/* Comparison Matrix Table */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${selectedModels.length}, minmax(200px, 1fr))`,
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            overflow: 'hidden'
          }}>
            {/* Header Row: Model Cards */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-pill)' }}>
              Model Candidate
            </div>
            {selectedModels.map((m) => (
              <div key={m.id} style={{
                padding: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-panel)',
                position: 'relative'
              }}>
                <button
                  onClick={() => onRemoveModel(m.id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  title="Remove from comparison"
                >
                  <X size={14} />
                </button>
                <div style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {m.provider}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {m.modelDisplayName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {m.variant} • {m.license}
                </div>
              </div>
            ))}

            {/* Row: Arena Elo Rating & Uncertainty */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Arena Rating / Elo
            </div>
            {selectedModels.map((m) => (
              <div key={m.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-mint)', fontFamily: 'var(--font-mono)' }}>
                  {m.rating}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  ±{m.uncertainty} CI ({m.ratingLower} - {m.ratingUpper})
                </div>
              </div>
            ))}

            {/* Row: Human Evaluations / Votes */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Human Battles / Votes
            </div>
            {selectedModels.map((m) => (
              <div key={m.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: '1px solid var(--border-subtle)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)'
              }}>
                {m.votes.toLocaleString()} comparisons
              </div>
            ))}

            {/* Row: Input Pricing per 1M Tokens */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Input Price / 1M Tokens
            </div>
            {selectedModels.map((m) => (
              <div key={m.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: '1px solid var(--border-subtle)',
                fontSize: '13px',
                fontWeight: 600,
                color: m.inputPricePerMillion !== null ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>
                {m.inputPricePerMillion !== null ? `$${m.inputPricePerMillion.toFixed(2)}` : 'Unknown / Self-Hosted'}
              </div>
            ))}

            {/* Row: Output Pricing per 1M Tokens */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Output Price / 1M Tokens
            </div>
            {selectedModels.map((m) => (
              <div key={m.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: '1px solid var(--border-subtle)',
                fontSize: '13px',
                fontWeight: 600,
                color: m.outputPricePerMillion !== null ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>
                {m.outputPricePerMillion !== null ? `$${m.outputPricePerMillion.toFixed(2)}` : 'Unknown / Self-Hosted'}
              </div>
            ))}

            {/* Row: Context Window */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Context Length
            </div>
            {selectedModels.map((m) => (
              <div key={m.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: '1px solid var(--border-subtle)',
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}>
                {m.contextLength ? `${(m.contextLength / 1000).toLocaleString()}K tokens` : 'Unknown / Non-text'}
              </div>
            ))}

            {/* Row: License & Weight Access */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              License & Architecture
            </div>
            {selectedModels.map((m) => (
              <div key={m.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: '1px solid var(--border-subtle)',
                fontSize: '12px'
              }}>
                <span className={m.isOpenWeight ? 'badge badge-mint' : 'badge badge-subtle'}>
                  {m.license}
                </span>
              </div>
            ))}

            {/* Row: Official Documentation Link */}
            <div style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Documentation & Source
            </div>
            {selectedModels.map((m) => (
              <div key={m.id} style={{
                padding: '12px 16px',
                borderLeft: '1px solid var(--border-subtle)'
              }}>
                <a
                  href={m.modelUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--accent-purple)',
                    textDecoration: 'none'
                  }}
                >
                  Model Docs <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 20px' }}>
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  AlertCircle, 
  Info
} from 'lucide-react';
import type { CandidateEvaluation, Constraints, RoutingPreference } from '../types';

interface DecisionTransparencyProps {
  candidates: CandidateEvaluation[];
  constraints: Constraints;
  preference: RoutingPreference;
}

export const DecisionTransparency: React.FC<DecisionTransparencyProps> = ({
  candidates,
  constraints,
  preference
}) => {
  // Store expanded state for rows. By default, selected model is expanded.
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    candidates.forEach((c) => {
      if (c.status === 'selected') {
        initial[c.model.id] = true;
      }
    });
    return initial;
  });

  const [activeTab, setActiveTab] = useState<'all' | 'eligible' | 'rejected'>('all');

  const selectedCount = candidates.filter((c) => c.status === 'selected').length;
  const eligibleCount = candidates.filter((c) => c.status === 'eligible').length;
  const rejectedCount = candidates.filter((c) => c.status === 'rejected').length;

  const toggleRow = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCandidates = candidates.filter((c) => {
    if (activeTab === 'eligible') return c.status === 'selected' || c.status === 'eligible';
    if (activeTab === 'rejected') return c.status === 'rejected';
    return true;
  });

  return (
    <div className="mr-card" style={{ marginBottom: '32px' }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Decision Transparency
            </h2>
            <span className="badge badge-subtle">
              Audit Grade
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Models considered: {candidates.length} candidates ({preference.replace('_', ' ')} policy)
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <span style={{ fontSize: '13px', color: 'var(--accent-mint)', fontWeight: 600 }}>
              {selectedCount + eligibleCount} eligible
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <span style={{ fontSize: '13px', color: 'var(--accent-danger)', fontWeight: 600 }}>
              {rejectedCount} rejected
            </span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '720px' }}>
            Each candidate is systematically verified against all 5 hard constraints. Expand any model row to review exact pricing, context capacity, and deterministic selection or rejection rationales.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-pill)',
          padding: '3px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          gap: '2px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeTab === 'all' ? 'var(--bg-panel)' : 'transparent',
              color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All ({candidates.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('eligible')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeTab === 'eligible' ? 'var(--bg-panel)' : 'transparent',
              color: activeTab === 'eligible' ? 'var(--accent-mint)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Eligible ({selectedCount + eligibleCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: activeTab === 'rejected' ? 'var(--bg-panel)' : 'transparent',
              color: activeTab === 'rejected' ? 'var(--accent-danger)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Candidate Rows List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredCandidates.map((cand) => {
          const { model, status, estimatedCost, effectiveLatencyP95, rejectionReasons, eligibilityExplanation } = cand;
          const isSelected = status === 'selected';
          const isEligible = status === 'eligible';
          const isRejected = status === 'rejected';
          const isExpanded = !!expandedIds[model.id];

          return (
            <div
              key={model.id}
              style={{
                borderRadius: 'var(--radius-md)',
                border: isSelected 
                  ? '1.5px solid var(--border-success)' 
                  : '1px solid var(--border-subtle)',
                backgroundColor: isSelected 
                  ? 'var(--bg-card-selected)' 
                  : 'var(--bg-card)',
                boxShadow: isSelected ? 'var(--shadow-mint-glow)' : 'var(--shadow-sm)',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Row Summary Bar (Clickable) */}
              <div
                onClick={() => toggleRow(model.id)}
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left: Icon + Model Name + Provider + API ID */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--accent-mint-dim)' : 'var(--bg-pill)',
                    border: isSelected ? '1px solid var(--accent-mint)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Terminal 
                      size={17} 
                      color={isSelected ? 'var(--accent-mint)' : isRejected ? 'var(--text-muted)' : 'var(--accent-purple)'} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isSelected ? 'var(--text-primary)' : isRejected ? 'var(--text-secondary)' : 'var(--text-primary)'
                      }}>
                        {model.name}
                      </span>
                      {isSelected && (
                        <span className="badge badge-mint" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          WINNER
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span style={{ fontWeight: 500 }}>{model.provider}</span>
                      <span>•</span>
                      <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{model.id}</span>
                      <span>•</span>
                      <span style={{ color: '#F59E0B' }}>★ {model.capabilityRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Metrics (Cost & Latency) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  {/* Cost */}
                  <div style={{ textAlign: 'right', minWidth: '85px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. Cost</div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      color: !cand.passedConstraints.cost ? 'var(--accent-danger)' : 'var(--text-primary)'
                    }}>
                      ${estimatedCost.toFixed(5)}
                    </div>
                  </div>

                  {/* Latency */}
                  <div style={{ textAlign: 'right', minWidth: '85px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>p95 Latency</div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      color: !cand.passedConstraints.latency ? 'var(--accent-danger)' : 'var(--text-primary)'
                    }}>
                      {effectiveLatencyP95} ms
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{ minWidth: '90px', textAlign: 'center' }}>
                    {isSelected ? (
                      <span className="badge badge-mint" style={{ width: '100%', justifyContent: 'center' }}>
                        <CheckCircle2 size={12} /> Selected
                      </span>
                    ) : isEligible ? (
                      <span className="badge badge-purple" style={{ width: '100%', justifyContent: 'center' }}>
                        <CheckCircle2 size={12} /> Eligible
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ width: '100%', justifyContent: 'center' }}>
                        <XCircle size={12} /> Rejected ({rejectionReasons.length})
                      </span>
                    )}
                  </div>

                  {/* Chevron Toggle */}
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Expanded Details Section */}
              {isExpanded && (
                <div style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  fontSize: '12px'
                }}>
                  {/* Metadata Specs Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '14px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-panel)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>API Model ID:</span>
                      <div className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                        {model.id}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Endpoint Health:</span>
                      <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: model.endpointStatus === 'online' ? 'var(--accent-mint)' : model.endpointStatus === 'degraded' ? 'var(--accent-amber)' : 'var(--accent-danger)'
                        }} />
                        <span style={{
                          fontWeight: 600,
                          color: model.endpointStatus === 'online' ? 'var(--accent-mint)' : model.endpointStatus === 'degraded' ? 'var(--accent-amber)' : 'var(--accent-danger)',
                          textTransform: 'uppercase',
                          fontSize: '11px'
                        }}>
                          {model.endpointStatus}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({model.reliabilityScore}% uptime)</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Context Window:</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                        {model.contextWindow.toLocaleString()} tokens
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>
                          ({cand.passedConstraints.context ? 'Fits' : 'Violates required'} {constraints.requiredContext.toLocaleString()})
                        </span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Token Pricing:</span>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                        ${model.inputCostPerMillion}/M in • ${model.outputCostPerMillion}/M out
                      </div>
                    </div>
                  </div>

                  {/* Explanation Callout */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected 
                      ? 'var(--accent-mint-dim)' 
                      : isEligible 
                      ? 'var(--accent-purple-dim)' 
                      : 'var(--accent-danger-dim)',
                    border: isSelected 
                      ? '1px solid var(--border-success-subtle)' 
                      : isEligible 
                      ? '1px solid var(--border-accent)' 
                      : '1px solid var(--border-danger)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <div style={{ marginTop: '2px' }}>
                      {isSelected ? (
                        <CheckCircle2 size={16} color="var(--accent-mint)" />
                      ) : isEligible ? (
                        <Info size={16} color="var(--accent-purple)" />
                      ) : (
                        <AlertCircle size={16} color="var(--accent-danger)" />
                      )}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: isSelected ? 'var(--accent-mint)' : isEligible ? 'var(--accent-purple)' : 'var(--accent-danger)',
                        marginBottom: '3px'
                      }}>
                        {isSelected ? 'Why Selected' : isEligible ? 'Eligibility Analysis' : 'Rejection Reason(s)'}
                      </div>
                      <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {eligibilityExplanation}
                      </p>

                      {isRejected && rejectionReasons.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                          {rejectionReasons.map((reason, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              color: 'var(--accent-danger)',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              <span>✖</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

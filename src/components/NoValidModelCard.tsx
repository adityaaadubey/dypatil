import React from 'react';
import { Sliders, XCircle } from 'lucide-react';
import type { RecommendationResult } from '../types';

interface NoValidModelCardProps {
  result: RecommendationResult;
  onRelaxConstraints: () => void;
}

export const NoValidModelCard: React.FC<NoValidModelCardProps> = ({
  result,
  onRelaxConstraints
}) => {
  // Analyze which constraints failed the most across all models
  const totalModels = result.candidates.length;
  const latencyFailures = result.candidates.filter((c) => !c.passedConstraints.latency).length;
  const costFailures = result.candidates.filter((c) => !c.passedConstraints.cost).length;
  const capabilityFailures = result.candidates.filter((c) => !c.passedConstraints.capability).length;
  const contextFailures = result.candidates.filter((c) => !c.passedConstraints.context).length;
  const availabilityFailures = result.candidates.filter((c) => !c.passedConstraints.availability).length;

  return (
    <div 
      className="animate-fade-in"
      style={{
        marginBottom: '32px',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--border-danger)',
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}
    >
      {/* Banner */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderBottom: '1px solid var(--border-danger)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-danger-dim)',
            border: '1.5px solid var(--accent-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <XCircle size={18} color="var(--accent-danger)" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-danger)' }}>
              No Valid Model Meets Stated Hard Constraints
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Gateway strictly rejected all {totalModels} models to prevent SLA violations
            </div>
          </div>
        </div>

        <button
          onClick={onRelaxConstraints}
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '6px 14px',
            borderColor: 'var(--accent-danger)',
            color: 'var(--text-primary)'
          }}
        >
          <Sliders size={13} color="var(--accent-danger)" />
          Auto-Suggest Relaxed Budget
        </button>
      </div>

      {/* Details Breakdown */}
      <div style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '16px' }}>
          As required by the ModelRouter governance policy, requests will never be dispatched to an unapproved or violating endpoint when strict constraints cannot be satisfied.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latency Bound ({result.constraints.maxLatency}ms)</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: latencyFailures > 0 ? 'var(--accent-danger)' : 'var(--accent-mint)', marginTop: '2px' }}>
              {latencyFailures} / {totalModels} models violated
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cost Budget (${result.constraints.maxCost.toFixed(4)})</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: costFailures > 0 ? 'var(--accent-danger)' : 'var(--accent-mint)', marginTop: '2px' }}>
              {costFailures} / {totalModels} models violated
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Capability Floor ({result.constraints.minCapability})</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: capabilityFailures > 0 ? 'var(--accent-danger)' : 'var(--accent-mint)', marginTop: '2px' }}>
              {capabilityFailures} / {totalModels} models violated
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Context Requirement ({(result.constraints.requiredContext / 1000).toFixed(0)}k)</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: contextFailures > 0 ? 'var(--accent-danger)' : 'var(--accent-mint)', marginTop: '2px' }}>
              {contextFailures} / {totalModels} models violated
            </div>
          </div>

          {availabilityFailures > 0 && (
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-danger)'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--accent-danger)' }}>Downtime / Outages</span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-danger)', marginTop: '2px' }}>
                {availabilityFailures} / {totalModels} endpoints down
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  X, 
  RotateCcw, 
  SlidersHorizontal, 
  Clock, 
  ShieldAlert, 
  Flame 
} from 'lucide-react';
import type { Model, EndpointStatus } from '../types';

interface JudgeSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  onUpdateModel: (id: string, updates: Partial<Model>) => void;
  onResetAll: () => void;
  onTriggerFailoverTest: (modelId: string) => void;
  selectedModelId?: string | null;
}

export const JudgeSimulatorModal: React.FC<JudgeSimulatorModalProps> = ({
  isOpen,
  onClose,
  models,
  onUpdateModel,
  onResetAll,
  onTriggerFailoverTest,
  selectedModelId
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div 
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-panel)',
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-purple-dim)',
                color: 'var(--accent-purple)'
              }}>
                <SlidersHorizontal size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Judge & Endpoint Chaos Simulator
              </h3>
              <span className="badge badge-amber" style={{ fontSize: '11px' }}>
                LIVE TEST BENCH
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Override endpoint availability or simulate latency spikes to test real-time failover compliance.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onResetAll}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              title="Reset all models to normal baseline SLAs"
            >
              <RotateCcw size={13} />
              Reset All
            </button>
            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable list of models with controls */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-pill)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldAlert size={18} color="var(--accent-amber)" />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Evaluator Testing Rule:</strong> Changing an endpoint's latency or taking it down triggers immediate re-routing. The failover engine must switch to a valid alternative without relaxing any user constraints.
            </div>
          </div>

          {models.map((model) => {
            const isCurrentlySelected = selectedModelId === model.id;

            return (
              <div
                key={model.id}
                style={{
                  padding: '14px 18px',
                  backgroundColor: isCurrentlySelected ? 'var(--bg-card-selected)' : 'var(--bg-input)',
                  border: isCurrentlySelected ? '1.5px solid var(--border-success)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left: Model Name & Provider */}
                <div style={{ minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {model.name}
                    </span>
                    {isCurrentlySelected && (
                      <span className="badge badge-mint" style={{ fontSize: '10px' }}>
                        ACTIVE CHOICE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {model.provider} • Base SLA: {model.baseLatencyP95}ms
                  </div>
                </div>

                {/* Middle: Latency Slider Override */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
                  <Clock size={14} color="var(--accent-purple)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Latency SLA</span>
                      <span style={{
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: model.currentLatencyP95 > model.baseLatencyP95 * 1.5 ? 'var(--accent-danger)' : 'var(--text-primary)'
                      }}>
                        {model.currentLatencyP95} ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1500"
                      step="25"
                      value={model.currentLatencyP95}
                      onChange={(e) => onUpdateModel(model.id, { currentLatencyP95: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* Right: Endpoint Status Selector & Failover Trigger */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {(['online', 'degraded', 'down'] as EndpointStatus[]).map((status) => {
                    const isActive = model.endpointStatus === status;
                    let color = 'var(--text-muted)';
                    let bg = 'var(--bg-pill)';
                    if (isActive) {
                      if (status === 'online') { color = 'var(--accent-mint)'; bg = 'var(--accent-mint-dim)'; }
                      if (status === 'degraded') { color = 'var(--accent-amber)'; bg = 'var(--accent-amber-dim)'; }
                      if (status === 'down') { color = 'var(--accent-danger)'; bg = 'var(--accent-danger-dim)'; }
                    }

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onUpdateModel(model.id, { endpointStatus: status })}
                        style={{
                          padding: '5px 9px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          backgroundColor: bg,
                          color: color,
                          border: isActive ? `1px solid ${color}` : '1px solid var(--border-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        {status}
                      </button>
                    );
                  })}

                  {/* Quick Spike / Failover Button */}
                  <button
                    type="button"
                    onClick={() => onTriggerFailoverTest(model.id)}
                    className="btn-ghost"
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      color: 'var(--accent-danger)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    title="Simulate immediate outage on this endpoint"
                  >
                    <Flame size={12} />
                    Break
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Apply & Close Bench
          </button>
        </div>
      </div>
    </div>
  );
};

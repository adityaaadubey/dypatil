import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Check, 
  Clock, 
  DollarSign, 
  Award, 
  AlertTriangle, 
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { RecommendationResult, Model } from '../types';

interface RecommendationCardProps {
  result: RecommendationResult;
  onSimulateOutage?: (model: Model) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  result,
  onSimulateOutage
}) => {
  const [copied, setCopied] = useState(false);

  if (!result.selectedModel || !result.selectedEvaluation) {
    return null;
  }

  const { selectedModel, selectedEvaluation } = result;

  const handleCopyId = () => {
    navigator.clipboard.writeText(selectedModel.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
      {/* Top Success Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderBottom: 'none',
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)'
      }}>
        {/* Left Status: Green Outlined Success Icon + Text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid var(--accent-mint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--accent-mint-dim)'
          }}>
            <CheckCircle2 size={16} color="var(--accent-mint)" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recommendation ready
              </span>
              <span className="badge badge-mint" style={{ fontSize: '11px', padding: '1px 8px' }}>
                All hard constraints passed
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Deterministic inference routing • Evaluated against {result.candidates.length} production endpoints
            </div>
          </div>
        </div>

        {/* Right Status: Decision ID & Timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {result.isSimulatedFailoverActive && (
            <span className="badge badge-amber" style={{ fontSize: '11px' }}>
              <AlertTriangle size={12} />
              Failover Active ({result.failedPrimaryModelName} bypassed)
            </span>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-pill)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>ID:</span>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{result.decisionId}</span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>{result.timestamp}</span>
          </div>
        </div>
      </div>

      {/* Main Highlighted Model Card: Dark Indigo Background & Thin Purple Border */}
      <div style={{
        backgroundColor: 'var(--bg-recommended)',
        border: '1.5px solid var(--border-recommended)',
        borderBottomLeftRadius: 'var(--radius-lg)',
        borderBottomRightRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-purple-glow), var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle purple gradient flare in background */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, var(--accent-purple-glow) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Header inside card */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Model info with terminal/chip icon */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-pill)',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px var(--accent-purple-dim)',
              flexShrink: 0
            }}>
              <Terminal size={22} color="var(--accent-purple)" strokeWidth={2.2} />
            </div>

            <div>
              {/* RECOMMENDED MODEL & Provider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--accent-purple)',
                  textTransform: 'uppercase'
                }}>
                  RECOMMENDED MODEL
                </span>
                <span style={{ color: 'var(--border-subtle)' }}>•</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}>
                  {selectedModel.provider}
                </span>
              </div>

              {/* Display Name */}
              <h3 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '6px'
              }}>
                {selectedModel.name}
              </h3>

              {/* Short Description */}
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                maxWidth: '680px',
                lineHeight: 1.5,
                marginBottom: '10px'
              }}>
                {selectedModel.description}
              </p>

              {/* Exact API Model ID Compact Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div 
                  onClick={handleCopyId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                  title="Click to copy exact API model identifier"
                >
                  <span style={{ color: 'var(--text-muted)' }}>model_id:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedModel.id}</span>
                  {copied ? (
                    <Check size={12} color="var(--accent-mint)" />
                  ) : (
                    <Copy size={12} color="var(--text-muted)" />
                  )}
                </div>

                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  backgroundColor: 'var(--bg-pill)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {(selectedModel.contextWindow / 1000).toLocaleString()}k context window
                </span>
              </div>
            </div>
          </div>

          {/* Right Indicator: Green BEST FIT Indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-mint-dim)',
              border: '1.5px solid var(--accent-mint)',
              boxShadow: 'var(--shadow-mint-glow)'
            }}>
              <Sparkles size={14} color="var(--accent-mint)" />
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: 'var(--accent-mint)'
              }}>
                BEST FIT
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Rank #1 under {result.preference.replace('_', ' ')} policy
            </div>
          </div>
        </div>

        {/* Three Horizontally Aligned Metric Sections */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '20px',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)'
        }}>
          {/* Metric 1: Estimated Request Cost */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-mint-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={18} color="var(--accent-mint)" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Est. Request Cost
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                ${selectedEvaluation.estimatedCost.toFixed(5)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-mint)' }}>
                ${selectedModel.inputCostPerMillion}/M in • ${selectedModel.outputCostPerMillion}/M out
              </div>
            </div>
          </div>

          {/* Metric 2: p95 Profile Latency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-purple-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} color="var(--accent-purple)" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                p95 Turnaround Latency
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {selectedEvaluation.effectiveLatencyP95} ms
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Budget limit: {result.constraints.maxLatency} ms ({result.constraints.maxLatency - selectedEvaluation.effectiveLatencyP95}ms headroom)
              </div>
            </div>
          </div>

          {/* Metric 3: Capability Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={18} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Capability Rating
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedModel.capabilityRating.toFixed(1)} / 10
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Exceeds min {result.constraints.minCapability.toFixed(1)} requirement
              </div>
            </div>
          </div>
        </div>

        {/* Divider Followed by "Why this model?" Explanation */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--accent-purple)',
            whiteSpace: 'nowrap',
            paddingTop: '2px'
          }}>
            Why this model?
          </div>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-primary)',
            lineHeight: 1.6
          }}>
            {selectedEvaluation.eligibilityExplanation}
          </p>
        </div>

        {/* Failover Chain Preview Banner */}
        {result.failoverChain.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={14} color="var(--accent-mint)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                Active Zero-Violation Failover Chain:
              </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {selectedModel.name}
              </span>
              <ArrowRight size={12} color="var(--text-muted)" />
              {result.failoverChain.slice(0, 2).map((m, idx) => (
                <React.Fragment key={m.id}>
                  <span style={{ color: 'var(--text-secondary)' }}>{m.name}</span>
                  {idx < Math.min(result.failoverChain.length - 1, 1) && (
                    <ArrowRight size={12} color="var(--text-muted)" />
                  )}
                </React.Fragment>
              ))}
              {result.failoverChain.length > 2 && (
                <span style={{ color: 'var(--text-muted)' }}>+{result.failoverChain.length - 2} more</span>
              )}
            </div>

            {onSimulateOutage && (
              <button
                type="button"
                onClick={() => onSimulateOutage(selectedModel)}
                className="btn-ghost"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  color: 'var(--accent-amber)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="Test router resilience by simulating an outage on this model"
              >
                Simulate Outage on {selectedModel.name.split(' ')[0]}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

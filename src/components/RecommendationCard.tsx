import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Calculator
} from 'lucide-react';
import type { RecommendationResult, Model } from '../types';
import type { TrialAllowance } from '../types/billing';
import { MathExplainerModal } from './MathExplainerModal';
import { LiveInferenceChat, type TopRankedModel } from './LiveInferenceChat';
import {
  gsap,
  prefersReducedMotion,
  scrambleDecodeText,
  animateMetricCounter,
  attachMagneticInteraction,
} from '../utils/gsapMotion';

interface RecommendationCardProps {
  result: RecommendationResult;
  onSimulateOutage?: (model: Model) => void;
  trialAllowance: TrialAllowance;
  onTrialAllowanceUpdated: (updated: TrialAllowance) => void;
  onNavigateToMethodology?: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  result,
  onSimulateOutage,
  trialAllowance,
  onTrialAllowanceUpdated,
  onNavigateToMethodology
}) => {
  const [copied, setCopied] = useState(false);
  const [isMathExplainerOpen, setIsMathExplainerOpen] = useState(false);

  const cardRootRef = useRef<HTMLDivElement | null>(null);
  const decisionIdRef = useRef<HTMLSpanElement | null>(null);
  const modelNameRef = useRef<HTMLHeadingElement | null>(null);
  const bestFitBadgeRef = useRef<HTMLDivElement | null>(null);
  const costValRef = useRef<HTMLDivElement | null>(null);
  const latencyValRef = useRef<HTMLDivElement | null>(null);
  const capValRef = useRef<HTMLDivElement | null>(null);

  const selectedModel = result.selectedModel;
  const selectedEvaluation = result.selectedEvaluation;

  // Dramatic GSAP Routing Lock-In & Metric Counter Sequence on new decision
  useEffect(() => {
    if (!selectedModel || !selectedEvaluation || !cardRootRef.current) return;

    const cleanupMagnetic = attachMagneticInteraction(cardRootRef.current);

    // Scramble decode decision ID & winning model name
    if (decisionIdRef.current) {
      scrambleDecodeText(decisionIdRef.current, result.decisionId, {
        duration: 0.55,
      });
    }
    if (modelNameRef.current) {
      scrambleDecodeText(modelNameRef.current, selectedModel.name, {
        duration: 0.5,
      });
    }

    // Sequential number counters for Cost, p95 Latency, and Capability Rating
    if (costValRef.current) {
      animateMetricCounter(costValRef.current, selectedEvaluation.estimatedCost, {
        duration: 0.75,
        formatter: (v) => `$${v.toFixed(5)}`,
      });
    }
    if (latencyValRef.current) {
      animateMetricCounter(latencyValRef.current, selectedEvaluation.effectiveLatencyP95, {
        duration: 0.75,
        delay: 0.06,
        suffix: ' ms',
      });
    }
    if (capValRef.current) {
      animateMetricCounter(capValRef.current, selectedModel.capabilityRating, {
        duration: 0.75,
        delay: 0.12,
        decimals: 1,
        suffix: ' / 10',
      });
    }

    if (prefersReducedMotion()) {
      return () => cleanupMagnetic();
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      // Winner Frame Lock-in
      tl.fromTo(
        '.rec-winner-frame',
        {
          opacity: 0.35,
          y: 14,
          scale: 0.985,
          boxShadow: '0 0 36px rgba(242, 201, 125, 0.35)',
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          boxShadow: '6px 6px 0 var(--shadow-color)',
          duration: 0.48,
          clearProps: 'transform,boxShadow',
        },
        0
      );

      // Elastic BEST FIT Badge Pop
      if (bestFitBadgeRef.current) {
        tl.fromTo(
          bestFitBadgeRef.current,
          { scale: 0.65, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.55, ease: 'elastic.out(1, 0.45)', clearProps: 'transform' },
          0.08
        );
      }

      // 3 Metric Blocks Staggered Entrance
      tl.fromTo(
        '.rec-metric-block',
        { opacity: 0, y: 12, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          stagger: 0.065,
          ease: 'back.out(1.7)',
          clearProps: 'transform',
        },
        0.1
      );

      // Failover Chain Nodes Sequential Pulse
      tl.fromTo(
        '.rec-failover-node',
        { opacity: 0, x: -8 },
        {
          opacity: 1,
          x: 0,
          duration: 0.32,
          stagger: 0.055,
          ease: 'power2.out',
          clearProps: 'transform',
        },
        0.22
      );
    }, cardRootRef);

    return () => {
      cleanupMagnetic();
      ctx.revert();
    };
  }, [result.decisionId, selectedModel?.id]);

  if (!selectedModel || !selectedEvaluation) {
    return null;
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(selectedModel.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={cardRootRef} style={{ marginBottom: '32px' }}>
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
            borderRadius: '0px',
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
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                RECOMMENDATION READY
              </span>
              <span className="badge badge-mint" style={{ fontSize: '10.5px', padding: '1px 8px' }}>
                ALL HARD CONSTRAINTS PASSED
              </span>
            </div>
            <div className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
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
          <div className="tabular-nums" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-pill)',
            border: '2px solid var(--border-subtle)',
            borderRadius: '0px',
            padding: '4px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>ID:</span>
            <span ref={decisionIdRef} style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{result.decisionId}</span>
            <span style={{ color: 'var(--border-subtle)' }}>//</span>
            <span style={{ color: 'var(--text-secondary)' }}>{result.timestamp}</span>
          </div>

          {/* How was this recommended? Interactive Math Explainer Button */}
          <button
            type="button"
            onClick={() => setIsMathExplainerOpen(true)}
            className="btn-secondary"
            style={{
              padding: '5px 12px',
              fontSize: '11px'
            }}
            title="Inspect mathematical routing formulas and constraint audit"
          >
            <Calculator size={13} color="var(--accent-gold)" />
            <span>How was this recommended?</span>
          </button>
        </div>
      </div>

      {/* Main Highlighted Model Card: Pixel Terminal Frame */}
      <div
        className="rec-winner-frame gsap-laser-sweep gsap-corner-reticle"
        style={{
          backgroundColor: 'var(--bg-recommended)',
          border: '2px solid var(--border-accent-strong)',
          borderRadius: '0px',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
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
              borderRadius: '0px',
              backgroundColor: 'var(--bg-pill)',
              border: '2px solid var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0 var(--shadow-color)',
              flexShrink: 0
            }}>
              <Terminal size={22} color="var(--accent-gold)" strokeWidth={2.2} />
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
              <h3
                ref={modelNameRef}
                className="gsap-terminal-cursor"
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  marginBottom: '6px'
                }}
              >
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

                <span className="tabular-nums" style={{
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
            <div
              ref={bestFitBadgeRef}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-mint-dim)',
                border: '1.5px solid var(--accent-mint)',
                boxShadow: 'var(--shadow-mint-glow)'
              }}
            >
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
          <div className="rec-metric-block" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <div
                ref={costValRef}
                className="tabular-nums"
                style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                ${selectedEvaluation.estimatedCost.toFixed(5)}
              </div>
              <div className="tabular-nums" style={{ fontSize: '11px', color: 'var(--accent-mint)' }}>
                ${selectedModel.inputCostPerMillion}/M in • ${selectedModel.outputCostPerMillion}/M out
              </div>
            </div>
          </div>

          {/* Metric 2: p95 Profile Latency */}
          <div className="rec-metric-block" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <div
                ref={latencyValRef}
                className="tabular-nums"
                style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {selectedEvaluation.effectiveLatencyP95} ms
              </div>
              <div className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Budget limit: {result.constraints.maxLatency} ms ({result.constraints.maxLatency - selectedEvaluation.effectiveLatencyP95}ms headroom)
              </div>
            </div>
          </div>

          {/* Metric 3: Capability Rating */}
          <div className="rec-metric-block" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <div
                ref={capValRef}
                className="tabular-nums"
                style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                {selectedModel.capabilityRating.toFixed(1)} / 10
              </div>
              <div className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <ShieldCheck size={14} color="var(--accent-mint)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                Active Zero-Violation Failover Chain:
              </span>
              <span className="rec-failover-node" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {selectedModel.name}
              </span>
              <ArrowRight size={12} color="var(--text-muted)" />
              {result.failoverChain.slice(0, 2).map((m, idx) => (
                <React.Fragment key={m.id}>
                  <span className="rec-failover-node" style={{ color: 'var(--text-secondary)' }}>{m.name}</span>
                  {idx < Math.min(result.failoverChain.length - 1, 1) && (
                    <ArrowRight size={12} color="var(--text-muted)" />
                  )}
                </React.Fragment>
              ))}
              {result.failoverChain.length > 2 && (
                <span className="rec-failover-node" style={{ color: 'var(--text-muted)' }}>+{result.failoverChain.length - 2} more</span>
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

        {/* Live Model Inference Playground with Top 3 Ranked Models & Credit Deduction */}
        {(() => {
          const silverCandidate = result.candidates.find(
            (c) => c.status === 'eligible' && c.model.id !== selectedModel.id
          );
          const eligibleOthers = result.candidates.filter(
            (c) => c.status === 'eligible' && c.model.id !== selectedModel.id
          );
          const bronzeCandidate = eligibleOthers[1];

          const topRankedModels: TopRankedModel[] = [
            {
              model: selectedModel,
              rank: 1,
              rankLabel: 'Rank #1 // Gold Recommendation',
              score: (selectedEvaluation.selectionScore || 0.98) * 100,
              creditsCost: 5,
              badgeClass: 'badge-amber',
              latencyMs: selectedEvaluation.effectiveLatencyP95,
              estimatedCost: selectedEvaluation.estimatedCost
            },
            ...(silverCandidate ? [{
              model: silverCandidate.model,
              rank: 2 as const,
              rankLabel: 'Rank #2 // Silver Recommendation',
              score: (silverCandidate.selectionScore || 0.92) * 100,
              creditsCost: 3,
              badgeClass: 'badge-mint',
              latencyMs: silverCandidate.effectiveLatencyP95,
              estimatedCost: silverCandidate.estimatedCost
            }] : []),
            ...(bronzeCandidate ? [{
              model: bronzeCandidate.model,
              rank: 3 as const,
              rankLabel: 'Rank #3 // Bronze Recommendation',
              score: (bronzeCandidate.selectionScore || 0.88) * 100,
              creditsCost: 2,
              badgeClass: 'badge-purple',
              latencyMs: bronzeCandidate.effectiveLatencyP95,
              estimatedCost: bronzeCandidate.estimatedCost
            }] : [])
          ];

          return (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
              <LiveInferenceChat
                primaryModel={selectedModel}
                initialPrompt={result.prompt}
                failoverChain={result.failoverChain}
                allEligibleModels={result.candidates.filter((c) => c.status === 'selected' || c.status === 'eligible').map((c) => c.model)}
                topRankedModels={topRankedModels}
                trialAllowance={trialAllowance}
                onTrialAllowanceUpdated={onTrialAllowanceUpdated}
              />
            </div>
          );
        })()}
      </div>

      {/* How was this recommended? Interactive Math Explainer Modal */}
      <MathExplainerModal
        isOpen={isMathExplainerOpen}
        onClose={() => setIsMathExplainerOpen(false)}
        result={result}
        onNavigateToMethodology={onNavigateToMethodology}
      />
    </div>
  );
};

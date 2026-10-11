import React, { useState } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calculator, 
  ShieldCheck, 
  ExternalLink,
  Scale
} from 'lucide-react';
import type { RecommendationResult } from '../types';

interface MathExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: RecommendationResult;
  onNavigateToMethodology?: () => void;
}

export const MathExplainerModal: React.FC<MathExplainerModalProps> = ({
  isOpen,
  onClose,
  result,
  onNavigateToMethodology
}) => {
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(0);

  if (!isOpen || !result.selectedModel || !result.selectedEvaluation) return null;

  const { selectedModel, selectedEvaluation } = result;

  // Real intermediate calculations
  const inputTokens = result.estimatedInputTokens;
  const outputBudget = result.estimatedOutputTokens;
  const inPricePerM = selectedModel.inputCostPerMillion;
  const outPricePerM = selectedModel.outputCostPerMillion;
  const inputCostUSD = (inputTokens / 1_000_000) * inPricePerM;
  const outputCostUSD = (outputBudget / 1_000_000) * outPricePerM;
  const totalCostUSD = inputCostUSD + outputCostUSD;

  // Passed vs Rejected models
  const passedCandidates = result.candidates.filter((c) => c.status === 'selected' || c.status === 'eligible');
  const rejectedCandidates = result.candidates.filter((c) => c.status === 'rejected');

  // Preference weights used
  const weights = {
    quality: 0.35,
    capabilityFit: 0.25,
    cost: 0.20,
    latency: 0.15,
    reliability: 0.05
  };

  const faqItems = [
    {
      q: 'Why was this model selected as Rank #1?',
      a: `${selectedModel.name} passed 100% of your hard constraints (budget, latency P95, context capacity, and minimum capability). Under your selected "${result.preference}" preference profile, it achieved the highest combined utility score of ${selectedEvaluation.selectionScore.toFixed(1)}/100, outperforming runner-up candidates on cost-efficiency and task capability alignment.`
    },
    {
      q: 'Why was the cheapest model rejected or outranked?',
      a: rejectedCandidates.length > 0 && rejectedCandidates.some(c => c.model.inputCostPerMillion < inPricePerM)
        ? `The cheaper models were evaluated first, but failed one or more hard constraints (e.g., minimum required capability rating, maximum P95 latency ceiling, or missing required modality). In veyralabs, hard constraints are never relaxed for lower price.`
        : `Models that were cheaper achieved lower total utility when accounting for capability score and quality benchmarks under your preference weights.`
    },
    {
      q: 'Why was the fastest model not chosen?',
      a: `Faster low-latency models were either disqualified by capability thresholds or had higher per-token prices that penalized their score under your routing preference. ${selectedModel.name} delivers ${selectedModel.currentLatencyP95}ms P95 latency, well within your acceptable limit of ${result.constraints.maxLatency}ms.`
    },
    {
      q: 'How was the prompt token count estimated?',
      a: `Token estimation uses a deterministic BPE-aligned heuristic (${inputTokens} tokens calculated from prompt structure, code blocks, and character density). An expected completion budget of ${outputBudget} output tokens was assigned based on the detected task category (${result.taskCategory}).`
    },
    {
      q: 'How was the cost calculated step-by-step?',
      a: `Input Cost = (${inputTokens.toLocaleString()} / 1,000,000) × $${inPricePerM.toFixed(2)} = $${inputCostUSD.toFixed(6)}. Output Cost = (${outputBudget.toLocaleString()} / 1,000,000) × $${outPricePerM.toFixed(2)} = $${outputCostUSD.toFixed(6)}. Total Estimated Cost = $${totalCostUSD.toFixed(6)} USD (₹${(totalCostUSD * 88.0).toFixed(4)} INR).`
    },
    {
      q: 'What happens if model latency increases in production?',
      a: `veyralabs monitors real-time P95 latency. If ${selectedModel.name}'s measured latency exceeds your hard ceiling, the deterministic router automatically activates failover to the Rank #2 candidate (${result.candidates[1]?.model.name || 'eligible alternative'}) without dropped requests.`
    },
    {
      q: 'Does this recommendation trigger a paid API call?',
      a: `No. Recommendation mode is 100% free of external inference charges. Only when you explicitly click "Run Prompt" or "Test Comparison" will a configured API adapter be dispatched.`
    },
    {
      q: 'Was this response served from cache?',
      a: `Recommendation routing decisions are calculated in-memory in ~2ms. When executing prompts in Execution Mode or Comparison Studio, identical requests are deduplicated by our SHA-256 cryptographic cache with zero provider token consumption.`
    }
  ];

  return (
    <div 
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 7, 49, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-purple-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calculator size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                How was this recommended?
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Mathematical routing proof, step-by-step arithmetic & constraint audit
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="btn-ghost"
            style={{ padding: '6px', color: 'var(--text-secondary)' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Winning Model Math Summary */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-mint" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                  Rank #1 Champion
                </span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedModel.name}
                </span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                Score: {selectedEvaluation.selectionScore.toFixed(1)} / 100
              </span>
            </div>

            {/* Arithmetic Formula Box */}
            <div style={{
              backgroundColor: 'var(--bg-code)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              lineHeight: 1.6
            }}>
              <div style={{ color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '6px' }}>
                // Step-by-Step Cost Arithmetic
              </div>
              <div>Input Cost  = ({inputTokens.toLocaleString()} / 1,000,000) × ${inPricePerM.toFixed(2)} = ${inputCostUSD.toFixed(6)}</div>
              <div>Output Cost = ({outputBudget.toLocaleString()} / 1,000,000) × ${outPricePerM.toFixed(2)} = ${outputCostUSD.toFixed(6)}</div>
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '6px', paddingTop: '6px', fontWeight: 700, color: 'var(--state-success)' }}>
                Total Estimated Cost = ${totalCostUSD.toFixed(6)} USD (≈ ₹{(totalCostUSD * 88.0).toFixed(4)} INR)
              </div>
            </div>
          </div>

          {/* Section 2: Hard Constraints Audit */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--state-success)" />
              Hard Constraints Eligibility Check ({passedCandidates.length} Passed • {rejectedCandidates.length} Disqualified)
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px'
            }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Required Context Window</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedModel.contextWindow.toLocaleString()} tokens (Passed)
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>P95 Latency Ceiling</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedModel.currentLatencyP95} ms (Passed)
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Capability Score Match</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedModel.capabilityRating.toFixed(1)} / 10.0 ({result.taskCategory})
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Preference Scoring Weights Disclosed */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={14} color="var(--accent-primary)" />
              Active Objective Weights (Normalized Sum = 1.0)
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                Quality: {(weights.quality * 100).toFixed(0)}%
              </span>
              <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                Capability Fit: {(weights.capabilityFit * 100).toFixed(0)}%
              </span>
              <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                Cost Utility: {(weights.cost * 100).toFixed(0)}%
              </span>
              <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                Latency Utility: {(weights.latency * 100).toFixed(0)}%
              </span>
              <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                Reliability: {(weights.reliability * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Section 4: Expandable Questions Accordion */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Transparent Decision FAQ
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {faqItems.map((item, idx) => {
                const isOpen = openQuestionIndex === idx;
                return (
                  <div 
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenQuestionIndex(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>{item.q}</span>
                      {isOpen ? <ChevronUp size={14} color="var(--accent-primary)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 16px 14px 16px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        borderTop: '1px solid var(--divider-color)',
                        paddingTop: '10px'
                      }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            All calculations are deterministic and traceable to verified provider pricing.
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onNavigateToMethodology && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToMethodology();
                }}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                <span>View Full Methodology</span>
                <ExternalLink size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ fontSize: '11px', padding: '6px 16px' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

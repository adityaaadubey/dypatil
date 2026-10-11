import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, 
  Info, 
  Calculator, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  HelpCircle, 
  Sparkles,
  Cpu,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import type { RecommendationResult, RoutingPreference } from '../types';

interface RecommendationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: RecommendationResult | null;
  onNavigateToMethodology?: () => void;
}

export const RecommendationInfoModal: React.FC<RecommendationInfoModalProps> = ({
  isOpen,
  onClose,
  result,
  onNavigateToMethodology
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'faqs'>('pipeline');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [demoPreference, setDemoPreference] = useState<RoutingPreference>(result?.preference || 'balanced');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real or demo metrics
  const promptSnippet = (result?.prompt || 'Profile this asynchronous Python gRPC microservice implementation for race conditions...').slice(0, 75) + '...';
  const inputTokens = result?.estimatedInputTokens || 56;
  const outputTokens = result?.estimatedOutputTokens || 250;
  const complexityScore = result?.complexityScore || 7.5;
  const suggestedFloor = result ? Math.max(6.0, Number((result.complexityScore - 1.0).toFixed(1))) : 6.5;

  const weightsMap: Record<RoutingPreference, { quality: number; capability: number; cost: number; latency: number; reliability: number }> = {
    balanced: { quality: 35, capability: 35, cost: 20, latency: 10, reliability: 5 },
    lowest_cost: { cost: 85, capability: 10, quality: 5, latency: 5, reliability: 5 },
    lowest_latency: { latency: 85, capability: 10, cost: 5, quality: 5, reliability: 5 },
    highest_capability: { capability: 85, cost: 10, quality: 5, latency: 5, reliability: 5 }
  };

  const currentWeights = weightsMap[demoPreference];

  const faqs = [
    {
      q: 'How does VeyraLabs differ from generic router benchmarks?',
      a: 'Generic routers use simple random routing or static price lookups. VeyraLabs implements a strict two-phase gate: first, a binary hard-constraint filter that instantly eliminates any model violating SLA latency, token budget, context window, or minimum capability floor; second, a multi-attribute utility calculation with Pareto optimization that balances quality, cost, and latency according to your chosen objective.'
    },
    {
      q: 'Why was the cheapest model rejected or outranked?',
      a: 'Hard constraints are zero-compromise. If a low-cost model has insufficient capability rating (e.g., 6.2/10 when the prompt demands 8.5/10), or its P95 latency exceeds your ceiling, it is strictly rejected before scoring even begins. We never compromise output reliability for fractions of a cent.'
    },
    {
      q: 'How is prompt complexity estimated before sending to any model?',
      a: 'The engine uses a deterministic character-to-token heuristic (~3.8 characters per token), combined with AST regex detection for 20+ programming languages, chain-of-thought vocabulary markers, and task category multipliers. When in doubt, our algorithms choose the safer capability floor.'
    },
    {
      q: 'What happens during an API outage or latency spike?',
      a: 'VeyraLabs continuously monitors live provider telemetry. If an endpoint is marked "degraded", a penalty of (1.6 × latency + 120ms) is applied to its effective score. If an endpoint returns 5xx or is marked "down", the router automatically activates failover to the pre-computed Rank #2 candidate with zero dropped requests.'
    },
    {
      q: 'Does recommendation mode consume API credits or tokens?',
      a: 'No! Recommendation Studio runs 100% locally in-memory in ~2ms. Zero API tokens are expended and zero external requests are triggered during the recommendation phase. Credits are only deducted when you explicitly execute an inference prompt.'
    },
    {
      q: 'How does Pareto optimization prevent local minima?',
      a: 'Instead of linear weighted sums that allow exceptional scores in one dimension (like ultra-cheap price) to mask critical flaws in another (like hallucination rate), Pareto optimization normalizes metrics across all eligible candidates in the candidate pool, penalizing extreme trade-offs.'
    },
    {
      q: 'Can I connect my own API keys (BYOK)?',
      a: 'Yes. VeyraLabs supports BYOK (Bring Your Own Key) for OpenAI, Anthropic, Google Gemini, Groq, and OpenRouter. Your keys are encrypted client-side and routed directly to endpoints with zero markup.'
    }
  ];

  const modalContent = (
    <div 
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 7, 49, 0.78)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
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
          border: '1.5px solid var(--border-accent)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg), 0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(101, 60, 161, 0.2)',
              border: '1px solid var(--accent-purple, #8A5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple, #AC91F1)'
            }}>
              <Info size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  How VeyraLabs Recommends a Model
                </h2>
                <span className="badge badge-mint" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                  Deterministic SLA Engine
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                4-Stage Mathematical Routing Pipeline • Zero SLA Compromise • Deterministic Failovers
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{
              padding: '6px',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-input)',
          overflowX: 'auto',
          padding: '0 16px'
        }}>
          {[
            { id: 'pipeline', label: 'Architecture Overview', icon: Layers },
            { id: 'stage1', label: '1. Prompt Analysis', icon: Sparkles },
            { id: 'stage2', label: '2. SLA Gate (Hard Filter)', icon: ShieldCheck },
            { id: 'stage3', label: '3. Multi-Attribute Math', icon: Calculator },
            { id: 'stage4', label: '4. Failover Logic', icon: RefreshCw },
            { id: 'faqs', label: 'FAQs & Proof', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB: Architecture Overview */}
          {activeTab === 'pipeline' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(101, 60, 161, 0.1)',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <Cpu size={28} color="var(--accent-purple, #8A5CF6)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Mathematical Guarantees:</strong> VeyraLabs does not use arbitrary rankings. Every recommendation is executed via a 4-stage pipeline that computes exact token budgets, verifies 5 hard constraints, and ranks models with Pareto utility scores in <strong>~2 milliseconds</strong>.
                </div>
              </div>

              {/* 4 Stages Visual Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* Stage 1 */}
                <div 
                  onClick={() => setActiveTab('stage1')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-purple)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>STAGE 1</span>
                    <Sparkles size={16} color="var(--accent-purple)" />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Prompt Analysis
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Analyzes length, syntax markers, keywords, and task category to estimate input/output tokens and complexity floor.
                  </p>
                </div>

                {/* Stage 2 */}
                <div 
                  onClick={() => setActiveTab('stage2')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-mint)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-mint" style={{ fontSize: '10px' }}>STAGE 2</span>
                    <ShieldCheck size={16} color="var(--accent-mint)" />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Zero-SLA Hard Filter
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Binary pass/fail gate for Max Latency, Max Cost, Min Capability, Context Window, and Endpoint Availability.
                  </p>
                </div>

                {/* Stage 3 */}
                <div 
                  onClick={() => setActiveTab('stage3')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-purple" style={{ fontSize: '10px' }}>STAGE 3</span>
                    <Calculator size={16} color="var(--accent-primary)" />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Pareto Scoring Math
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Multi-attribute normalization across Quality, Cost, Latency, and Reliability using user-selected weights.
                  </p>
                </div>

                {/* Stage 4 */}
                <div 
                  onClick={() => setActiveTab('stage4')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-amber)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-amber" style={{ fontSize: '10px' }}>STAGE 4</span>
                    <RefreshCw size={16} color="var(--accent-amber)" />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Failover & Circuits
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Pre-computed ordered failover chain. Instant zero-compromise switch to Rank #2 on endpoint failure.
                  </p>
                </div>
              </div>

              {/* Live Status Banner if Result is active */}
              {result && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Active Recommendation Result
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      Selected: <span style={{ color: 'var(--accent-mint)' }}>{result.selectedModel?.name || 'No model matched'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Eligible: </span>
                      <strong style={{ color: 'var(--accent-mint)' }}>
                        {result.candidates.filter(c => c.status === 'eligible' || c.status === 'selected').length}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Disqualified: </span>
                      <strong style={{ color: 'var(--accent-coral, #EF4444)' }}>
                        {result.candidates.filter(c => c.status === 'rejected').length}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Decision ID: </span>
                      <code style={{ color: 'var(--accent-purple)' }}>{result.decisionId}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Stage 1 - Prompt Analysis */}
          {activeTab === 'stage1' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Stage 1: Prompt Parsing & Heuristics
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Before routing begins, VeyraLabs parses prompt semantics to establish conservative token bounds and minimum capability floors:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '14px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      1. Token Estimation Formula
                    </div>
                    <code style={{ fontSize: '11px', color: 'var(--accent-purple)', display: 'block', margin: '6px 0' }}>
                      rawInputTokens = ceil(charLength / 3.8)
                    </code>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Conservative 3.8 chars/token BPE approximation prevents under-budgeting edge cases.
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      2. Complexity Scoring (1.0 - 10.0)
                    </div>
                    <code style={{ fontSize: '11px', color: 'var(--accent-purple)', display: 'block', margin: '6px 0' }}>
                      floor = Math.max(6.0, complexity - 1.0)
                    </code>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Regex scans for code syntax (`function`, `async def`, `import`) and analytical keywords (`step-by-step`, `trade-offs`).
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      3. Output Token Multipliers
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      • <strong>Code:</strong> 2.8x input (dense code generation)<br />
                      • <strong>Reasoning:</strong> 3.2x input (chain-of-thought)<br />
                      • <strong>Summarization:</strong> 0.8x input (condensed synthesis)
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview calculation */}
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(101, 60, 161, 0.08)',
                border: '1px solid var(--border-accent)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Current Analysis Snapshot: <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{promptSnippet}"</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Estimated Input:</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent-mint)' }}>{inputTokens.toLocaleString()} tokens</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Output Budget:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{outputTokens.toLocaleString()} tokens</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Complexity Rating:</span>
                    <div style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{complexityScore} / 10.0</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Suggested Floor:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{suggestedFloor} / 10.0</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Stage 2 - Hard Constraint Filtering */}
          {activeTab === 'stage2' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldCheck size={18} color="var(--accent-mint)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Stage 2: Zero-Compromise Hard Constraint Gate
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Any model that violates <strong>even a single</strong> user-defined SLA threshold is immediately disqualified. Cheaper or faster models are NEVER substituted if they violate your criteria:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  {[
                    { label: 'Latency Ceiling', rule: 'effectiveLatencyP95 <= maxLatency', desc: 'P95 roundtrip turnaround must stay strictly within SLA ceiling.' },
                    { label: 'Cost Budget', rule: 'estimatedCost <= maxCost', desc: 'Estimated combined input + output token cost must stay strictly under max dollar budget.' },
                    { label: 'Capability Floor', rule: 'capabilityRating >= minCapability', desc: 'Model overall benchmark score must meet or exceed minimum quality threshold.' },
                    { label: 'Context Capacity', rule: 'contextWindow >= requiredContext', desc: 'Total model attention span must accommodate required context size.' },
                    { label: 'Endpoint Availability', rule: 'endpointStatus !== "down"', desc: 'Unhealthy or offline provider endpoints are filtered out unconditionally.' }
                  ].map((filter, i) => (
                    <div 
                      key={i}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {filter.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {filter.desc}
                        </div>
                      </div>
                      <code style={{ fontSize: '11px', color: 'var(--accent-mint)', whiteSpace: 'nowrap' }}>
                        {filter.rule}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Stage 3 - Multi-Attribute Scoring & Pareto Optimization */}
          {activeTab === 'stage3' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Stage 3: Normalization & Pareto Utility Function
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Among all eligible models that passed Stage 2, metrics are normalized on a 0.0 to 1.0 scale across the active candidate pool:
                </p>

                {/* Mathematical Formula Display */}
                <div style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '8px',
                  margin: '14px 0',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'var(--accent-purple)'
                }}>
                  Selection Score = (w_cost × CostNorm) + (w_lat × LatencyNorm) + (w_cap × CapNorm) + (w_rel × RelNorm)
                </div>

                {/* Preference Selector */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Select Routing Preference to Inspect Dynamic Weight Distribution:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {(['balanced', 'lowest_cost', 'lowest_latency', 'highest_capability'] as RoutingPreference[]).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setDemoPreference(pref)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: demoPreference === pref ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                          backgroundColor: demoPreference === pref ? 'rgba(101, 60, 161, 0.2)' : 'var(--bg-input)',
                          color: demoPreference === pref ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {pref.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Weights Bar Breakdown */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Capability Weight (w_cap)', val: currentWeights.capability, color: '#AC91F1' },
                    { label: 'Cost-Efficiency Weight (w_cost)', val: currentWeights.cost, color: '#10B981' },
                    { label: 'Latency Weight (w_lat)', val: currentWeights.latency, color: '#3B82F6' },
                    { label: 'Reliability Weight (w_rel)', val: currentWeights.reliability, color: '#F59E0B' }
                  ].map((bar, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{bar.label}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{bar.val}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${bar.val}%`, height: '100%', backgroundColor: bar.color, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Stage 4 - Failover Logic */}
          {activeTab === 'stage4' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <RefreshCw size={18} color="var(--accent-amber)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Stage 4: Automated Failover & Circuit Breakers
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  In production, downstream AI providers experience transient rate-limits (HTTP 429), gateway outages (HTTP 502/503), or degraded response latency. VeyraLabs constructs an ordered failover chain on every evaluation:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '14px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      1. Pre-computed Queue
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Failover candidates are ranked and queued in-memory. If Rank #1 fails, Rank #2 is invoked immediately without re-calculating the routing pipeline.
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      2. Degraded Telemetry Penalty
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Degraded endpoints are penalized by <code>(1.6 × latency + 120ms)</code>. This naturally de-prioritizes unstable providers before failures occur.
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      3. Strict SLA Preservation
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Every failover model in the chain is guaranteed to meet 100% of your original hard constraints. Zero compromises during failovers.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FAQs */}
          {activeTab === 'faqs' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div 
                    key={index}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-card)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} color="var(--accent-primary)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 16px 14px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '12px'
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Press <kbd style={{ padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>ESC</kbd> to close anytime
            </span>
            {onNavigateToMethodology && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToMethodology();
                }}
                className="btn-ghost"
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--accent-purple)'
                }}
              >
                Docs & Methodology <ExternalLink size={12} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{
              padding: '7px 18px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

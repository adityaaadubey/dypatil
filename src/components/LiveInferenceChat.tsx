import React, { useState, useMemo, useRef } from 'react';
import { 
  Send, 
  Play, 
  Sparkles, 
  Clock, 
  Coins, 
  Cpu, 
  AlertCircle, 
  ShieldAlert, 
  Copy, 
  Check,
  ChevronDown,
  RotateCcw,
  Zap,
  Square,
  Award
} from 'lucide-react';
import type { Model, ChatMessage, InferenceResult } from '../types';
import type { TrialAllowance } from '../types/billing';
import { executeStreamingInference } from '../services/inferenceService';

export interface TopRankedModel {
  model: Model;
  rank: 1 | 2 | 3;
  rankLabel: string;
  score: number;
  creditsCost: number;
  badgeClass: string;
  latencyMs: number;
  estimatedCost: number;
}

interface LiveInferenceChatProps {
  primaryModel: Model;
  initialPrompt: string;
  failoverChain?: Model[];
  allEligibleModels?: Model[];
  topRankedModels?: TopRankedModel[];
  trialAllowance?: TrialAllowance;
  onTrialAllowanceUpdated?: (updated: TrialAllowance) => void;
}

// Filter out models that require agentic harnesses or are not standard chat completion models
const isUnsupportedChatModel = (id: string) => {
  const lower = id.toLowerCase();
  return lower.includes('inkling') || lower.includes('lyria');
};

export const LiveInferenceChat: React.FC<LiveInferenceChatProps> = ({
  primaryModel,
  initialPrompt,
  failoverChain = [],
  allEligibleModels = [],
  topRankedModels = [],
  trialAllowance,
  onTrialAllowanceUpdated
}) => {
  // Mode: 'auto' (routing engine chooses) or 'manual' (user explicitly chose a model)
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [manualModelId, setManualModelId] = useState<string | null>(null);
  const [actualExecutedModelId, setActualExecutedModelId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<InferenceResult | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  // Clean eligible models list strictly constrained to topRankedModels when present
  const cleanEligibleModels = useMemo(() => {
    if (topRankedModels && topRankedModels.length > 0) {
      return topRankedModels.map((t) => t.model);
    }
    const map = new Map<string, Model>();
    if (!isUnsupportedChatModel(primaryModel.id)) {
      map.set(primaryModel.id, primaryModel);
    }
    failoverChain.forEach((m) => {
      if (!isUnsupportedChatModel(m.id) && !map.has(m.id)) {
        map.set(m.id, m);
      }
    });
    allEligibleModels.forEach((m) => {
      if (!isUnsupportedChatModel(m.id) && !map.has(m.id)) {
        map.set(m.id, m);
      }
    });
    return Array.from(map.values()).slice(0, 3);
  }, [topRankedModels, primaryModel, failoverChain, allEligibleModels]);

  // Clean failover chain excluding unsupported models
  const cleanFailovers = useMemo(() => {
    return failoverChain.filter((m) => !isUnsupportedChatModel(m.id));
  }, [failoverChain]);

  // Determine effective target model ID
  const effectiveTargetId = mode === 'auto' ? primaryModel.id : (manualModelId || primaryModel.id);

  // Find the currently active model object for display
  const displayModelId = actualExecutedModelId || effectiveTargetId;
  const activeModel = cleanEligibleModels.find((m) => m.id === displayModelId) || 
                      cleanEligibleModels.find((m) => m.id === effectiveTargetId) || 
                      primaryModel;

  const activeTargetCredits = topRankedModels.find((t) => t.model.id === effectiveTargetId)?.creditsCost || 5;

  // Execute inference for a given prompt/message array with live token streaming
  const handleSend = async (textToSend: string, targetId = effectiveTargetId) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    // Deduct trial allowance / credits score based on target model's credit score
    const targetModelCredits = topRankedModels.find((t) => t.model.id === targetId)?.creditsCost || 5;
    const tokensToDeduct = targetModelCredits * 50; // 5 credits = 250 tokens
    if (trialAllowance && onTrialAllowanceUpdated) {
      onTrialAllowanceUpdated({
        ...trialAllowance,
        usedTrialTokens: trialAllowance.usedTrialTokens + tokensToDeduct,
        remainingTrialTokens: Math.max(0, trialAllowance.remainingTrialTokens - tokensToDeduct)
      });
    }

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    // Append assistant placeholder for streaming
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    setInputMessage('');
    setIsLoading(true);
    setErrorNotice(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // In Manual mode: strictly target chosen model, no silent failovers.
    // In Auto mode: allow fallback to verified eligible models in the failover chain.
    const fallbackIds = mode === 'auto'
      ? cleanFailovers.map((m) => m.id).filter((id) => id !== targetId)
      : [];

    const result = await executeStreamingInference({
      model: targetId,
      messages: newMessages,
      failoverModels: fallbackIds,
      mode,
      onChunk: (delta) => {
        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1].role === 'assistant') {
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: next[next.length - 1].content + delta
            };
          }
          return next;
        });
      },
      signal: abortController.signal
    });

    setIsLoading(false);
    abortControllerRef.current = null;
    setLastResult(result);

    if (result.error && !result.content) {
      setMessages(newMessages);
      const failedModelName = result.failedModel || targetId;
      if (result.requestedModel && result.failedModel && result.requestedModel !== result.failedModel) {
        setErrorNotice(`Primary model "${result.requestedModel}" failed, and failover model "${result.failedModel}" also failed: ${result.error}`);
      } else {
        setErrorNotice(`Model "${failedModelName}" failed: ${result.error}`);
      }
    } else {
      if (result.model) {
        setActualExecutedModelId(result.model);
      }
      setMessages([...newMessages, { role: 'assistant', content: result.content }]);
      if (result.error) {
        setErrorNotice(result.error);
      }
    }
  };

  // Quick run of initial recommended prompt
  const handleRunInitialPrompt = () => {
    handleSend(initialPrompt, effectiveTargetId);
  };

  // Quick fallback execution
  const handleExecuteFailover = (fallbackModelId: string) => {
    setMode('manual');
    setManualModelId(fallbackModelId);
    setActualExecutedModelId(null);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || initialPrompt;
    handleSend(lastUserMsg, fallbackModelId);
  };

  // Reset to auto recommendation
  const handleResetToAuto = () => {
    setMode('auto');
    setManualModelId(null);
    setActualExecutedModelId(null);
    setErrorNotice(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div style={{
      marginTop: '20px',
      backgroundColor: 'var(--bg-panel)',
      border: '1.5px solid var(--border-accent)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '12px 18px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent-purple-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={14} color="var(--accent-purple)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Model Inference & Interactive Execution
              </span>
              <span className={`badge ${mode === 'auto' ? 'badge-mint' : 'badge-purple'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                {mode === 'auto' ? 'AUTO ROUTED' : 'MANUAL OVERRIDE'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Direct server-side execution • Free-only verified tier • Real token telemetry
            </div>
          </div>
        </div>

        {/* Model Selector / Override */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {mode === 'manual' && (
            <button
              type="button"
              onClick={handleResetToAuto}
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Reset to recommended model"
            >
              <RotateCcw size={11} />
              <span>Reset to Auto</span>
            </button>
          )}

          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Target Model:
          </span>

          <div style={{ position: 'relative' }}>
            <select
              value={mode === 'auto' ? '__AUTO__' : (manualModelId || primaryModel.id)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__AUTO__') {
                  setMode('auto');
                  setManualModelId(null);
                } else {
                  setMode('manual');
                  setManualModelId(val);
                }
                setActualExecutedModelId(null);
                setErrorNotice(null);
              }}
              style={{
                backgroundColor: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 28px 4px 10px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                appearance: 'none',
                maxWidth: '310px'
              }}
            >
              <optgroup label="Auto-Routed (Top Recommendation)">
                <option value="__AUTO__">
                  ★ Rank #1 Auto: {primaryModel.name}
                </option>
              </optgroup>
              <optgroup label="Top 3 Accessible Models (Credits Score)">
                {cleanEligibleModels.map((m) => {
                  const rankObj = topRankedModels.find((t) => t.model.id === m.id);
                  const label = rankObj 
                    ? `${rankObj.rankLabel} • ${m.name} (${rankObj.creditsCost} Credits)` 
                    : m.name;
                  return (
                    <option key={m.id} value={m.id}>
                      {label}
                    </option>
                  );
                })}
              </optgroup>
            </select>
            <ChevronDown 
              size={12} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
          </div>
        </div>
      </div>

      {/* Top 3 Interactive Model Selection Cards with Credits Score */}
      {topRankedModels.length > 0 && (
        <div style={{
          padding: '16px 18px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} color="var(--accent-purple)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Select Active Model (Top 3 Recommendations)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                • Interactive Real Model Execution
              </span>
            </div>

            {trialAllowance && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                padding: '4px 10px',
                backgroundColor: 'var(--bg-panel)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)'
              }}>
                <Coins size={13} color="var(--accent-mint)" />
                <span style={{ color: 'var(--text-secondary)' }}>Credits Score Balance:</span>
                <strong style={{ color: 'var(--accent-mint)' }}>
                  {trialAllowance.remainingTrialTokens.toLocaleString()} tokens
                </strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  (~{Math.floor(trialAllowance.remainingTrialTokens / 250)} queries left)
                </span>
              </div>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px'
          }}>
            {topRankedModels.map((t) => {
              const isSelected = activeModel.id === t.model.id;
              const rankEmoji = t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : '🥉';
              const rankColor = t.rank === 1 ? 'var(--accent-amber)' : t.rank === 2 ? 'var(--accent-mint)' : 'var(--accent-purple)';
              const borderHighlight = isSelected ? `2px solid ${rankColor}` : '1px solid var(--border-subtle)';
              const bgHighlight = isSelected ? 'var(--bg-input)' : 'var(--bg-panel)';

              return (
                <div
                  key={t.model.id}
                  onClick={() => {
                    setMode('manual');
                    setManualModelId(t.model.id);
                    setActualExecutedModelId(null);
                    setErrorNotice(null);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: bgHighlight,
                    border: borderHighlight,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span className={`badge ${t.badgeClass}`} style={{ fontSize: '10px' }}>
                        {rankEmoji} {t.rankLabel}
                      </span>
                      <span className="badge badge-mint" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Coins size={10} />
                        {t.creditsCost} Credits
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t.model.name}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {t.model.provider} • {t.latencyMs}ms • ${t.estimatedCost.toFixed(5)}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    marginTop: '4px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Score: <strong style={{ color: rankColor }}>{(t.score || 95).toFixed(1)}/100</strong>
                    </div>

                    {isSelected ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: rankColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Selected
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Click to Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Action: Run Initial Prompt Banner (if no messages sent yet) */}
      {messages.length === 0 && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: 'var(--bg-input)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Evaluated Studio Prompt:
            </span>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-primary)',
              fontStyle: 'italic',
              marginTop: '2px',
              maxWidth: '650px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              "{initialPrompt}"
            </div>
          </div>

          {isLoading ? (
            <button
              type="button"
              onClick={handleStopGenerating}
              className="btn-secondary"
              style={{ 
                fontSize: '12px', 
                padding: '6px 14px', 
                borderColor: 'var(--accent-danger)', 
                color: 'var(--accent-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Square size={12} fill="currentColor" />
              <span>Stop Generating</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRunInitialPrompt}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={13} />
              <span>Execute on {activeModel.name.split(' ')[0]} ({activeTargetCredits} Credits)</span>
            </button>
          )}
        </div>
      )}

      {/* Messages Conversation Log */}
      {messages.length > 0 && (
        <div style={{
          padding: '16px 18px',
          maxHeight: '380px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg-card)'
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {msg.role === 'user' ? 'Prompt (User)' : `${activeModel.name} (Assistant)`}
              </div>
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: msg.role === 'user' ? 'var(--accent-purple-dim)' : 'var(--bg-panel)',
                border: msg.role === 'user' ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                position: 'relative',
                minHeight: msg.role === 'assistant' && !msg.content ? '36px' : 'auto'
              }}>
                {msg.content || (msg.role === 'assistant' && isLoading && idx === messages.length - 1 ? (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      border: '2px solid var(--accent-purple)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Streaming first token...
                  </span>
                ) : null)}

                {msg.role === 'assistant' && msg.content && (
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="btn-ghost"
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      padding: '3px 6px',
                      fontSize: '10px',
                      color: 'var(--text-muted)'
                    }}
                    title="Copy response"
                  >
                    {copiedResponse ? <Check size={12} color="var(--accent-mint)" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid var(--accent-purple)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span>Streaming response from <strong style={{ color: 'var(--accent-purple)' }}>{effectiveTargetId}</strong>...</span>
              </div>
              <button
                type="button"
                onClick={handleStopGenerating}
                className="btn-ghost"
                style={{ fontSize: '11px', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Square size={10} fill="currentColor" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Callout with Specific Model Failure Attribution */}
      {errorNotice && (
        <div style={{
          padding: '12px 18px',
          backgroundColor: 'var(--accent-danger-dim)',
          borderTop: '1px solid var(--border-danger)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '650px' }}>
            <AlertCircle size={16} color="var(--accent-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-danger)' }}>
                Provider / Model Execution Notice
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.5 }}>
                {errorNotice}
              </div>
            </div>
          </div>

          {cleanFailovers.length > 0 && (
            <button
              type="button"
              onClick={() => handleExecuteFailover(cleanFailovers[0].id)}
              disabled={isLoading}
              className="btn-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: 'var(--accent-amber)',
                color: 'var(--accent-amber)'
              }}
            >
              <ShieldAlert size={12} />
              <span>Retry on Failover: {cleanFailovers[0].name.split(' ')[0]}</span>
            </button>
          )}
        </div>
      )}

      {/* Telemetry Strip: Returned Model, TTFT, Total Latency, Tokens, Cost */}
      {lastResult && !lastResult.error && (
        <div style={{
          padding: '8px 18px',
          backgroundColor: 'var(--bg-input)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Returned Model */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Cpu size={13} color="var(--accent-purple)" />
              <span style={{ color: 'var(--text-muted)' }}>Executed Model:</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {lastResult.model}
              </span>
            </div>

            {/* TTFT (Time to First Token) */}
            {typeof lastResult.ttftMs === 'number' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={13} color="var(--accent-amber)" />
                <span style={{ color: 'var(--text-muted)' }}>TTFT:</span>
                <span className="font-mono" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                  {lastResult.ttftMs} ms
                </span>
              </div>
            )}

            {/* Total Latency */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} color="var(--accent-purple)" />
              <span style={{ color: 'var(--text-muted)' }}>Total Latency:</span>
              <span className="font-mono" style={{ color: 'var(--accent-mint)', fontWeight: 600 }}>
                {lastResult.latencyMs} ms
              </span>
            </div>

            {/* Tokens */}
            {lastResult.usage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tokens:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {lastResult.usage.promptTokens} in / {lastResult.usage.completionTokens} out ({lastResult.usage.totalTokens} total)
                </span>
              </div>
            )}

            {/* Cost */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Coins size={13} color="var(--accent-mint)" />
              <span style={{ color: 'var(--text-muted)' }}>Cost:</span>
              <span className="font-mono" style={{ color: 'var(--accent-mint)', fontWeight: 600 }}>
                $0.00000 (Free Tier)
              </span>
            </div>
          </div>

          {lastResult.failoverUsed && (
            <span className="badge badge-amber" style={{ fontSize: '10px', padding: '1px 6px' }}>
              <ShieldAlert size={10} /> Failover Model Engaged (from {lastResult.failedPrimaryModel || 'primary'})
            </span>
          )}
        </div>
      )}

      {/* Interactive Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputMessage);
        }}
        style={{
          padding: '12px 18px',
          backgroundColor: 'var(--bg-panel)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={messages.length === 0 ? `Ask a question or test prompt with ${activeModel.name.split(' ')[0]} (${activeTargetCredits} credits)...` : "Type follow-up message to continue conversation..."}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '9px 12px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: 'var(--text-primary)'
          }}
        />

        {isLoading ? (
          <button
            type="button"
            onClick={handleStopGenerating}
            className="btn-secondary"
            style={{ 
              padding: '8px 16px', 
              fontSize: '12px',
              borderColor: 'var(--accent-danger)',
              color: 'var(--accent-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Square size={13} fill="currentColor" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={13} />
            <span>Send ({activeTargetCredits} cr)</span>
          </button>
        )}
      </form>
    </div>
  );
};

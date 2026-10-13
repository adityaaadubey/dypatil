import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  Database
} from 'lucide-react';
import type { EnrichedModelCatalogItem, ModelComparisonResult } from '../types/modelExplorer';
import { compareMetadata, executeModelComparison } from '../services/comparisonService';
import { PromptLibraryModal } from './PromptLibraryModal';
import {
  gsap,
  prefersReducedMotion,
  triggerGlitchBurst,
  attachMagneticInteraction,
  attachCyberCardPhysics,
} from '../utils/gsapMotion';

interface ModelComparisonStudioProps {
  allModels: EnrichedModelCatalogItem[];
  initialModelA?: EnrichedModelCatalogItem | null;
  initialModelB?: EnrichedModelCatalogItem | null;
  onNavigateToExplorer?: () => void;
}

export const ModelComparisonStudio: React.FC<ModelComparisonStudioProps> = ({
  allModels,
  initialModelA,
  initialModelB
}) => {
  // Selected Models
  const [modelA, setModelA] = useState<EnrichedModelCatalogItem>(() => {
    return initialModelA || allModels[0] || {} as EnrichedModelCatalogItem;
  });
  const [modelB, setModelB] = useState<EnrichedModelCatalogItem>(() => {
    return initialModelB || allModels[1] || allModels[0] || {} as EnrichedModelCatalogItem;
  });

  // Mode toggle: 'metadata' (Mode A) vs 'prompt' (Mode B)
  const [activeMode, setActiveMode] = useState<'metadata' | 'prompt'>('metadata');
  const compRootRef = useRef<HTMLDivElement | null>(null);

  // Mode B Settings
  const [promptText, setPromptText] = useState<string>(
    'Implement binary search in Python for a sorted array. Explain the loop invariant that prevents off-by-one errors.'
  );
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(512);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [bypassCache, setBypassCache] = useState<boolean>(false);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ModelComparisonResult | null>(null);

  // User Evaluation Voting State
  const [userVote, setUserVote] = useState<'modelA' | 'modelB' | 'tie' | 'both_bad' | null>(null);
  const [copiedA, setCopiedA] = useState<boolean>(false);
  const [copiedB, setCopiedB] = useState<boolean>(false);

  // Prompt Library modal state
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState<boolean>(false);

  // Sync initial selections if props change
  useEffect(() => {
    if (initialModelA) {
      setModelA((prev) => (prev.id !== initialModelA.id ? initialModelA : prev));
    }
  }, [initialModelA]);

  useEffect(() => {
    if (initialModelB) {
      setModelB((prev) => (prev.id !== initialModelB.id ? initialModelB : prev));
    }
  }, [initialModelB]);

  // GSAP entrance & transition choreography on mode / model / result changes
  useEffect(() => {
    const rootEl = compRootRef.current;
    if (!rootEl) return;

    const cleanupMagnetic = attachMagneticInteraction(rootEl);
    const cleanupCards = attachCyberCardPhysics(rootEl);

    if (prefersReducedMotion()) {
      return () => {
        cleanupMagnetic();
        cleanupCards();
      };
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.mr-card',
        { opacity: 0, y: 16, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          stagger: 0.06,
          ease: 'expo.out',
          clearProps: 'transform',
        }
      );
    }, rootEl);

    return () => {
      cleanupMagnetic();
      cleanupCards();
      ctx.revert();
    };
  }, [activeMode, modelA.id, modelB.id, comparisonResult]);

  // Mode A: Metadata comparison matrix
  const metadataDiff = React.useMemo(() => {
    if (!modelA.id || !modelB.id) return null;
    return compareMetadata(modelA, modelB);
  }, [modelA, modelB]);

  // Handle run prompt comparison
  const handleExecuteComparison = async (executeOnly?: 'A' | 'B' | 'both') => {
    if (!promptText.trim()) return;

    setIsRunning(true);
    try {
      const res = await executeModelComparison(modelA, modelB, promptText, {
        systemInstruction: systemInstruction.trim() || undefined,
        temperature,
        maxOutputTokens,
        bypassCache,
        executeOnlyModel: executeOnly || 'both'
      });
      setComparisonResult(res);
      setUserVote(null);
    } catch (err) {
      console.error('Failed to execute comparison:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyText = (side: 'A' | 'B', text: string) => {
    navigator.clipboard.writeText(text);
    if (side === 'A') {
      setCopiedA(true);
      setTimeout(() => setCopiedA(false), 2000);
    } else {
      setCopiedB(true);
      setTimeout(() => setCopiedB(false), 2000);
    }
  };

  const handleExportComparison = () => {
    if (!comparisonResult) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(comparisonResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `comparison_${modelA.modelKey}_vs_${modelB.modelKey}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div ref={compRootRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
              TWO-MODEL COMPARISON STUDIO
            </span>
            <span className="badge badge-mint" style={{ fontSize: '11px', padding: '2px 8px' }}>
              MODE A & MODE B
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Head-to-Head Model Evaluation
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Inspect specifications side by side without API calls (Mode A) or test identical prompts with independent response caching (Mode B).
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div style={{
          display: 'flex',
          padding: '4px',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            data-magnetic="true"
            onClick={(e) => {
              setActiveMode('metadata');
              triggerGlitchBurst(e.currentTarget);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: activeMode === 'metadata' ? 700 : 500,
              backgroundColor: activeMode === 'metadata' ? 'var(--accent-purple)' : 'transparent',
              color: activeMode === 'metadata' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={13} />
            <span>Mode A: Compare Specs (No Prompt)</span>
          </button>

          <button
            onClick={() => setActiveMode('prompt')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: activeMode === 'prompt' ? 700 : 500,
              backgroundColor: activeMode === 'prompt' ? 'var(--accent-purple)' : 'transparent',
              color: activeMode === 'prompt' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Play size={13} />
            <span>Mode B: Test with Prompt</span>
          </button>
        </div>
      </div>

      {/* Model Selectors Bar */}
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Model A Selector */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--accent-purple)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
            Model Candidate A
          </div>
          <select
            value={modelA.id}
            onChange={(e) => {
              const selected = allModels.find((m) => m.id === e.target.value);
              if (selected) setModelA(selected);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {allModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider}) • Elo {m.benchmarks.arenaElo || 'N/A'}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {modelA.provider} • {modelA.accessTier.toUpperCase()} • {modelA.contextWindow ? `${(modelA.contextWindow / 1000).toFixed(0)}k ctx` : 'Unknown'}
          </div>
        </div>

        {/* VS Badge */}
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 800,
          color: 'var(--accent-purple)'
        }}>
          VS
        </div>

        {/* Model B Selector */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--accent-mint)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
            Model Candidate B
          </div>
          <select
            value={modelB.id}
            onChange={(e) => {
              const selected = allModels.find((m) => m.id === e.target.value);
              if (selected) setModelB(selected);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {allModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider}) • Elo {m.benchmarks.arenaElo || 'N/A'}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {modelB.provider} • {modelB.accessTier.toUpperCase()} • {modelB.contextWindow ? `${(modelB.contextWindow / 1000).toFixed(0)}k ctx` : 'Unknown'}
          </div>
        </div>
      </div>

      {/* ==================== MODE A: METADATA COMPARISON ==================== */}
      {activeMode === 'metadata' && metadataDiff && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Highlights Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid rgba(145, 132, 255, 0.4)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '8px' }}>
                Key Advantages: {modelA.name}
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {metadataDiff.highlights.modelAStrengths.length > 0 ? (
                  metadataDiff.highlights.modelAStrengths.map((s, idx) => <li key={idx}>{s}</li>)
                ) : (
                  <li style={{ color: 'var(--text-muted)' }}>Balanced specification profile with no decisive isolated advantage.</li>
                )}
              </ul>
            </div>

            <div style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid rgba(53, 214, 165, 0.4)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-mint)', marginBottom: '8px' }}>
                Key Advantages: {modelB.name}
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {metadataDiff.highlights.modelBStrengths.length > 0 ? (
                  metadataDiff.highlights.modelBStrengths.map((s, idx) => <li key={idx}>{s}</li>)
                ) : (
                  <li style={{ color: 'var(--text-muted)' }}>Balanced specification profile with no decisive isolated advantage.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Two-Column Specification Matrix Table */}
          <div style={{
            backgroundColor: 'var(--bg-panel)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              padding: '14px 20px',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }}>
              <div>Specification Property</div>
              <div style={{ color: 'var(--accent-purple)' }}>{modelA.name}</div>
              <div style={{ color: 'var(--accent-mint)' }}>{modelB.name}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {metadataDiff.rows.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr',
                    padding: '12px 20px',
                    borderBottom: idx < metadataDiff.rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    backgroundColor: idx % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-card)',
                    fontSize: '12px',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.field}</span>
                    {row.note && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                        {row.note}
                      </span>
                    )}
                  </div>

                  <div style={{
                    color: row.winnerLabel === 'modelA' ? 'var(--accent-mint)' : 'var(--text-primary)',
                    fontWeight: row.winnerLabel === 'modelA' ? 700 : 500
                  }}>
                    {row.valueA ?? 'Unknown'}
                    {row.winnerLabel === 'modelA' && (
                      <span className="badge badge-mint" style={{ marginLeft: '6px', fontSize: '9px' }}>Advantage</span>
                    )}
                  </div>

                  <div style={{
                    color: row.winnerLabel === 'modelB' ? 'var(--accent-mint)' : 'var(--text-primary)',
                    fontWeight: row.winnerLabel === 'modelB' ? 700 : 500
                  }}>
                    {row.valueB ?? 'Unknown'}
                    {row.winnerLabel === 'modelB' && (
                      <span className="badge badge-mint" style={{ marginLeft: '6px', fontSize: '9px' }}>Advantage</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODE B: PROMPT TESTING ==================== */}
      {activeMode === 'prompt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Prompt Configuration Panel */}
          <div style={{
            backgroundColor: 'var(--bg-panel)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Test Prompt Payload
              </div>
              <button
                type="button"
                onClick={() => setIsPromptLibraryOpen(true)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <BookOpen size={13} color="var(--accent-purple)" />
                <span>Browse Prompt Library</span>
              </button>
            </div>

            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={3}
              placeholder="Enter exact test prompt to send to both models..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: 1.5
              }}
            />

            {/* Advanced Options Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Max Output Limit:</span>
                  <strong>{maxOutputTokens} tokens</strong>
                </div>
                <input
                  type="range"
                  min="128"
                  max="2048"
                  step="64"
                  value={maxOutputTokens}
                  onChange={(e) => setMaxOutputTokens(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Temperature:</span>
                  <strong>{temperature.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bypassCache}
                    onChange={(e) => setBypassCache(e.target.checked)}
                  />
                  <span>Bypass Cache (Force Fresh Run)</span>
                </label>
              </div>
            </div>

            {/* Run Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '14px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Exact same payload will be dispatched to {modelA.name} and {modelB.name}.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleExecuteComparison('A')}
                  disabled={isRunning}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Run {modelA.name.split(' ')[0]} Only
                </button>

                <button
                  onClick={() => handleExecuteComparison('B')}
                  disabled={isRunning}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Run {modelB.name.split(' ')[0]} Only
                </button>

                <button
                  onClick={() => handleExecuteComparison('both')}
                  disabled={isRunning}
                  className="btn-primary"
                  style={{ padding: '8px 22px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Play size={13} />
                  <span>{isRunning ? 'Evaluating...' : 'Run Both Models Side-by-Side'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Side-by-Side Responses Comparison View */}
          {comparisonResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                {/* Model A Response Panel */}
                <div style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(145, 132, 255, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {/* Panel Header */}
                  <div style={{
                    padding: '12px 18px',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-purple)' }}>
                        {comparisonResult.modelA.modelName}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {comparisonResult.modelA.provider}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {comparisonResult.modelA.isCacheHit ? (
                        <span className="badge badge-mint" style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Database size={10} />
                          Cached Response
                        </span>
                      ) : (
                        <span className="badge badge-purple" style={{ fontSize: '9px' }}>
                          Fresh Run
                        </span>
                      )}

                      <button
                        onClick={() => handleCopyText('A', comparisonResult.modelA.response)}
                        className="btn-ghost"
                        style={{ padding: '4px' }}
                        title="Copy Model A response"
                      >
                        {copiedA ? <Check size={13} color="var(--accent-mint)" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Panel Content */}
                  <div style={{
                    padding: '18px',
                    flex: 1,
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {comparisonResult.modelA.response}
                  </div>

                  {/* Metrics Bar */}
                  <div style={{
                    padding: '10px 18px',
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-secondary)'
                  }}>
                    <span>Latency: <strong>{comparisonResult.modelA.latencyMs} ms</strong></span>
                    <span>Tokens: <strong>{comparisonResult.modelA.tokensUsed}</strong></span>
                    <span>Cost: <strong>${comparisonResult.modelA.costUSD.toFixed(5)}</strong></span>
                  </div>
                </div>

                {/* Model B Response Panel */}
                <div style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(53, 214, 165, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {/* Panel Header */}
                  <div style={{
                    padding: '12px 18px',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-mint)' }}>
                        {comparisonResult.modelB.modelName}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {comparisonResult.modelB.provider}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {comparisonResult.modelB.isCacheHit ? (
                        <span className="badge badge-mint" style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Database size={10} />
                          Cached Response
                        </span>
                      ) : (
                        <span className="badge badge-purple" style={{ fontSize: '9px' }}>
                          Fresh Run
                        </span>
                      )}

                      <button
                        onClick={() => handleCopyText('B', comparisonResult.modelB.response)}
                        className="btn-ghost"
                        style={{ padding: '4px' }}
                        title="Copy Model B response"
                      >
                        {copiedB ? <Check size={13} color="var(--accent-mint)" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Panel Content */}
                  <div style={{
                    padding: '18px',
                    flex: 1,
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {comparisonResult.modelB.response}
                  </div>

                  {/* Metrics Bar */}
                  <div style={{
                    padding: '10px 18px',
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-secondary)'
                  }}>
                    <span>Latency: <strong>{comparisonResult.modelB.latencyMs} ms</strong></span>
                    <span>Tokens: <strong>{comparisonResult.modelB.tokensUsed}</strong></span>
                    <span>Cost: <strong>${comparisonResult.modelB.costUSD.toFixed(5)}</strong></span>
                  </div>
                </div>
              </div>

              {/* User Evaluation & Voting Card */}
              <div style={{
                backgroundColor: 'var(--bg-panel)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Human Evaluation & Preference Vote
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Which model produced the superior response according to correctness, clarity, and instruction following?
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setUserVote('modelA')}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: userVote === 'modelA' ? 'var(--accent-purple)' : 'var(--bg-card)',
                      color: userVote === 'modelA' ? '#FFFFFF' : 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    👍 Prefer {modelA.name.split(' ')[0]}
                  </button>

                  <button
                    onClick={() => setUserVote('tie')}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: userVote === 'tie' ? 'var(--accent-purple)' : 'var(--bg-card)',
                      color: userVote === 'tie' ? '#FFFFFF' : 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    🤝 Both Equal (Tie)
                  </button>

                  <button
                    onClick={() => setUserVote('modelB')}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: userVote === 'modelB' ? 'var(--accent-mint)' : 'var(--bg-card)',
                      color: userVote === 'modelB' ? '#0B1020' : 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    👍 Prefer {modelB.name.split(' ')[0]}
                  </button>

                  <button
                    onClick={handleExportComparison}
                    className="btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Export JSON comparison report"
                  >
                    <Download size={13} />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prompt Library Modal */}
      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={(sample) => {
          setPromptText(sample.prompt);
          if (sample.systemInstruction) setSystemInstruction(sample.systemInstruction);
          if (sample.suggestedMaxTokens) setMaxOutputTokens(sample.suggestedMaxTokens);
        }}
      />
    </div>
  );
};

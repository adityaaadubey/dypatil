import React, { useState } from 'react';
import { X, Play, Zap, Clock, Coins, CheckCircle, AlertCircle, Copy, Sparkles } from 'lucide-react';
import { authService, type ExecutionResponse } from '../services/authService';

interface LiveExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModelId?: string;
  defaultPrompt?: string;
  onExecuted?: () => void;
}

export const LiveExecutionModal: React.FC<LiveExecutionModalProps> = ({
  isOpen,
  onClose,
  defaultModelId = 'gemini-flash-latest',
  defaultPrompt = 'Summarize how mathematical routing selects optimal AI models based on cost, latency, and quality trade-offs.',
  onExecuted
}) => {
  const [modelId, setModelId] = useState(defaultModelId);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await authService.executePrompt(modelId, prompt);
      setResult(data);
      onExecuted?.();
    } catch (err: any) {
      setError(err.message || 'Execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 7, 49, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 60px rgba(4, 18, 88, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #041258 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Model Execution Console
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Google Gemini Real Inference · Automatic Ledger Recording · Cryptographic Response Cache
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleExecute}>
            {/* Model Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Select Executable Model Route
              </label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="gemini-flash-latest">Gemini 2.5 Flash Latest (Fast, Multimodal, 1M Context)</option>
                <option value="gemini-flash-lite-latest">Gemini 2.5 Flash Lite Latest (Ultra Low Latency, Cost-Optimized)</option>
                <option value="gemini-pro-latest">Gemini 2.5 Pro Latest (Deep Reasoning & Complex Code)</option>
              </select>
            </div>

            {/* Prompt Textarea */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Inference Prompt
              </label>
              <textarea
                rows={4}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter prompt to execute on real provider..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Execute Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #041258 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(101, 60, 161, 0.4)'
              }}
            >
              {loading ? (
                <>
                  <Sparkles size={16} />
                  Calling Google Gemini API...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Execute Live Inference (Deducts 5-10 Credits)
                </>
              )}
            </button>
          </form>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#F87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              {/* Telemetry Metrics Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '10px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Latency
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {result.latencyMs} ms
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Tokens (In / Out)
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {result.tokens.promptTokens} / {result.tokens.candidateTokens}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={12} /> Credits Deducted
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: result.cacheHit ? '#35D6A5' : '#F59E0B' }}>
                    {result.cacheHit ? '0 (Cache Hit)' : `-${result.creditsDeducted}`}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Remaining Credits
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#35D6A5' }}>
                    {result.remainingCredits.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Provider Response Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Actual Output from {result.provider}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copied ? '#35D6A5' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy Output'}
                </button>
              </div>

              {/* Output Content */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}
              >
                {result.text}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

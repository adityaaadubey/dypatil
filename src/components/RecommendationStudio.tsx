import React from 'react';
import { 
  Sparkles, 
  Clock, 
  DollarSign, 
  Gauge, 
  Layers, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';
import type { 
  Constraints, 
  RoutingPreference, 
  TaskCategory 
} from '../types';
import { SAMPLE_PROMPTS } from '../data/models';
import { estimateComplexity } from '../services/routerEngine';

interface RecommendationStudioProps {
  prompt: string;
  setPrompt: (p: string) => void;
  category: TaskCategory;
  setCategory: (c: TaskCategory) => void;
  constraints: Constraints;
  setConstraints: React.Dispatch<React.SetStateAction<Constraints>>;
  preference: RoutingPreference;
  setPreference: (pref: RoutingPreference) => void;
  onRecommend: () => void;
  isLoading: boolean;
}

export const RecommendationStudio: React.FC<RecommendationStudioProps> = ({
  prompt,
  setPrompt,
  category,
  setCategory,
  constraints,
  setConstraints,
  preference,
  setPreference,
  onRecommend,
  isLoading
}) => {
  const complexity = estimateComplexity(prompt, category);

  const handleApplyPreset = (index: number) => {
    const sample = SAMPLE_PROMPTS[index];
    setPrompt(sample.prompt);
    setCategory(sample.category);
    setConstraints(sample.constraints);
    setPreference(sample.preference);
  };

  const updateConstraint = <K extends keyof Constraints>(key: K, value: Constraints[K]) => {
    setConstraints((prev) => ({ ...prev, [key]: value }));
  };

  const categories: { key: TaskCategory; label: string }[] = [
    { key: 'general_chat', label: 'General Chat / Q&A' },
    { key: 'code_generation', label: 'Code Generation' },
    { key: 'complex_reasoning', label: 'Complex Reasoning' },
    { key: 'data_extraction', label: 'Data Extraction' },
    { key: 'summarization', label: 'Summarization' },
    { key: 'creative_writing', label: 'Creative Writing' }
  ];

  const preferences: { key: RoutingPreference; label: string; desc: string }[] = [
    { key: 'lowest_cost', label: 'Lowest Cost', desc: 'Minimizes estimated token expenditure' },
    { key: 'lowest_latency', label: 'Lowest Latency', desc: 'Prioritizes p95 roundtrip turnaround' },
    { key: 'highest_capability', label: 'Highest Capability', desc: 'Maximizes benchmark & reasoning quality' },
    { key: 'balanced', label: 'Balanced', desc: 'Optimized Pareto balance across all dimensions' }
  ];

  const contextOptions = [
    { label: '8K tokens', value: 8000 },
    { label: '16K tokens', value: 16000 },
    { label: '32K tokens', value: 32000 },
    { label: '64K tokens', value: 64000 },
    { label: '128K tokens', value: 128000 },
    { label: '200K tokens', value: 200000 },
    { label: '1M tokens', value: 1000000 }
  ];

  return (
    <div className="mr-card" style={{ marginBottom: '28px' }}>
      {/* Studio Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recommendation Studio
            </h2>
            <span className="badge badge-purple">
              Dynamic Constraint Engine
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Configure explicit SLA budgets, context requirements, and optimization preferences.
          </p>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Presets:
          </span>
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(idx)}
              className="btn-ghost"
              style={{
                fontSize: '11px',
                padding: '4px 9px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Prompt Input on Left, Constraints on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Prompt & Category */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Request Prompt
            </label>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Est. ~{complexity.estimatedInputTokens} in / ~{complexity.estimatedOutputTokens} out tokens
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt or instruction here to evaluate..."
              rows={5}
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                lineHeight: 1.6,
                resize: 'vertical'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-purple)';
                e.target.style.boxShadow = '0 0 0 1px var(--accent-purple)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-subtle)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Complexity Telemetry Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            marginTop: '8px',
            backgroundColor: 'var(--bg-pill)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={14} color="var(--accent-purple)" />
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Complexity:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {complexity.complexityScore} / 10.0
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              Safe Capability Floor: <strong style={{ color: 'var(--accent-purple)' }}>{complexity.suggestedCapabilityFloor}</strong>
            </div>
          </div>

          {/* Task Category Selection */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Task Category
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '8px'
            }}>
              {categories.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--accent-purple-dim)' : 'var(--bg-pill)',
                      color: isSelected ? 'var(--accent-purple)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 500,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Hard Constraints & Preference */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--accent-mint)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Hard Constraints (Strict Filters)
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--accent-mint)', fontWeight: 500 }}>
              Zero SLA Compromise
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            {/* Max Latency */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="var(--accent-purple)" /> Max Latency
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {constraints.maxLatency} ms
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="1200"
                step="20"
                value={constraints.maxLatency}
                onChange={(e) => updateConstraint('maxLatency', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
            </div>

            {/* Max Cost */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={13} color="var(--accent-mint)" /> Max Cost Budget
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ${constraints.maxCost.toFixed(4)}
                </span>
              </div>
              <input
                type="range"
                min="0.0005"
                max="0.0600"
                step="0.0005"
                value={constraints.maxCost}
                onChange={(e) => updateConstraint('maxCost', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-mint)', cursor: 'pointer' }}
              />
            </div>

            {/* Min Capability */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Gauge size={13} color="#F59E0B" /> Min Capability
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {constraints.minCapability.toFixed(1)} / 10
                </span>
              </div>
              <input
                type="range"
                min="6.0"
                max="9.7"
                step="0.1"
                value={constraints.minCapability}
                onChange={(e) => updateConstraint('minCapability', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer' }}
              />
            </div>

            {/* Required Context */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={13} color="var(--accent-purple)" /> Required Context
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {(constraints.requiredContext / 1000).toFixed(0)}K
                </span>
              </div>
              <select
                value={constraints.requiredContext}
                onChange={(e) => updateConstraint('requiredContext', Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {contextOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preference Selector */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Optimization Preference (Ranking Objective)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}>
              {preferences.map((pref) => {
                const isSelected = preference === pref.key;
                return (
                  <button
                    key={pref.key}
                    type="button"
                    onClick={() => setPreference(pref.key)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--accent-purple-dim)' : 'var(--bg-pill)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isSelected ? 'var(--accent-purple)' : 'var(--text-primary)'
                    }}>
                      {pref.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {pref.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Row: Prominent Purple Button */}
      <div style={{
        marginTop: '24px',
        paddingTop: '18px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} color="var(--accent-mint)" />
          <span>Recommendation-Only Mode active (zero external API keys or prompt leakage)</span>
        </div>

        <button
          type="button"
          onClick={onRecommend}
          disabled={isLoading || !prompt.trim()}
          className="btn-primary"
          style={{ minWidth: '200px' }}
        >
          {isLoading ? (
            <>
              <span style={{
                width: '14px',
                height: '14px',
                border: '2px solid #FFFFFF',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>Evaluating Models...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Recommend a model</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

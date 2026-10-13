import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Clock, 
  DollarSign, 
  Gauge, 
  Layers, 
  CheckCircle2, 
  ShieldCheck,
  Info
} from 'lucide-react';
import type { 
  Constraints, 
  RoutingPreference, 
  TaskCategory,
  RecommendationResult
} from '../types';
import { SAMPLE_PROMPTS } from '../data/models';
import { estimateComplexity } from '../services/routerEngine';
import { RecommendationInfoModal } from './RecommendationInfoModal';
import {
  gsap,
  prefersReducedMotion,
  triggerGlitchBurst,
  attachMagneticInteraction,
} from '../utils/gsapMotion';

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
  result?: RecommendationResult | null;
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
  isLoading,
  result
}) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const studioRef = useRef<HTMLDivElement | null>(null);
  const complexityBarRef = useRef<HTMLDivElement | null>(null);
  const solverLaserRef = useRef<HTMLDivElement | null>(null);
  const complexity = estimateComplexity(prompt, category);

  useEffect(() => {
    const el = studioRef.current;
    if (!el) return;
    const cleanup = attachMagneticInteraction(el);
    return () => cleanup();
  }, []);

  // Animate complexity gauge bar whenever complexity score changes
  useEffect(() => {
    if (!complexityBarRef.current) return;
    const pct = Math.min(100, Math.max(8, (complexity.complexityScore / 10) * 100));
    if (prefersReducedMotion()) {
      complexityBarRef.current.style.width = `${pct}%`;
      return;
    }
    gsap.to(complexityBarRef.current, {
      width: `${pct}%`,
      duration: 0.45,
      ease: 'expo.out',
    });
  }, [complexity.complexityScore]);

  // Trigger dramatic solver laser sweep when routing calculation runs
  useEffect(() => {
    if (!isLoading || !solverLaserRef.current || prefersReducedMotion()) return;
    gsap.fromTo(
      solverLaserRef.current,
      { top: '0%', opacity: 1 },
      {
        top: '100%',
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
      }
    );
  }, [isLoading]);

  const handleApplyPreset = (index: number) => {
    const sample = SAMPLE_PROMPTS[index];
    setPrompt(sample.prompt);
    setCategory(sample.category);
    setConstraints(sample.constraints);
    setPreference(sample.preference);

    if (studioRef.current && !prefersReducedMotion()) {
      gsap.fromTo(
        studioRef.current.querySelectorAll('.studio-reactive-zone'),
        { borderColor: 'var(--accent-gold)', boxShadow: '0 0 14px rgba(242, 201, 125, 0.28)' },
        {
          borderColor: 'var(--border-subtle)',
          boxShadow: 'none',
          duration: 0.55,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'borderColor,boxShadow',
        }
      );
    }
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
    <div
      ref={studioRef}
      className="mr-card gsap-corner-reticle"
      style={{ marginBottom: '28px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Active Solver Laser Sweep Line */}
      <div
        ref={solverLaserRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '3px',
          background:
            'linear-gradient(90deg, transparent, var(--accent-purple), var(--accent-gold), var(--accent-coral), transparent)',
          boxShadow: '0 0 18px var(--accent-gold)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
      {/* Studio Header: Title on Left, Info ⓘ Button in Top Right Corner */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '14px'
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

        {/* Info ⓘ Button in Top Right Corner */}
        <button
          type="button"
          onClick={() => setIsInfoModalOpen(true)}
          title="How VeyraLabs Recommends a Model (Architecture & Math Pipeline)"
          aria-label="How VeyraLabs Recommends a Model"
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            padding: 0,
            borderRadius: '0px',
            backgroundColor: 'var(--bg-pill)',
            border: '2px solid var(--accent-gold)',
            color: 'var(--accent-gold)',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '3px 3px 0 var(--shadow-color)'
          }}
        >
          <Info size={17} strokeWidth={2.4} />
        </button>
      </div>

      {/* Quick Presets Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Presets:
        </span>
        {SAMPLE_PROMPTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            data-magnetic="true"
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
            <div className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Est. ~{complexity.estimatedInputTokens} in / ~{complexity.estimatedOutputTokens} out tokens
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              className="studio-reactive-zone"
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

          {/* Complexity Telemetry Pill + Live Animated Progress Bar */}
          <div
            className="studio-reactive-zone"
            style={{
              padding: '8px 12px',
              marginTop: '8px',
              backgroundColor: 'var(--bg-pill)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gauge size={14} color="var(--accent-purple)" />
                <span style={{ color: 'var(--text-secondary)' }}>Estimated Complexity:</span>
                <span className="tabular-nums" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {complexity.complexityScore} / 10.0
                </span>
              </div>
              <div className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Safe Capability Floor: <strong style={{ color: 'var(--accent-purple)' }}>{complexity.suggestedCapabilityFloor}</strong>
              </div>
            </div>
            <div
              style={{
                marginTop: '6px',
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--bg-primary)',
                overflow: 'hidden',
              }}
            >
              <div
                ref={complexityBarRef}
                style={{
                  height: '100%',
                  width: `${Math.min(100, (complexity.complexityScore / 10) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-gold))',
                }}
              />
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
                    data-magnetic="true"
                    onClick={(e) => {
                      setCategory(cat.key);
                      triggerGlitchBurst(e.currentTarget);
                    }}
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

          <div
            className="studio-reactive-zone"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px'
            }}
          >
            {/* Max Latency */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="var(--accent-purple)" /> Max Latency
                </span>
                <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                    data-magnetic="true"
                    onClick={(e) => {
                      setPreference(pref.key);
                      triggerGlitchBurst(e.currentTarget);
                    }}
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

      {/* How VeyraLabs Recommends a Model Modal */}
      <RecommendationInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        result={result}
      />
    </div>
  );
};

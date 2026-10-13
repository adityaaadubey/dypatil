import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  RotateCw, 
  Star, 
  ExternalLink, 
  Play, 
  GitCompare, 
  AlertCircle, 
  Sparkles,
  Code2,
  BrainCircuit
} from 'lucide-react';
import type { EnrichedModelCatalogItem } from '../types/modelExplorer';
import { gsap, prefersReducedMotion } from '../utils/gsapMotion';

interface FlippableModelCardProps {
  model: EnrichedModelCatalogItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectForCompare: (model: EnrichedModelCatalogItem) => void;
  onOpenTestPrompt: (model: EnrichedModelCatalogItem) => void;
  onOpenDetailsModal: (model: EnrichedModelCatalogItem) => void;
}

export const FlippableModelCard: React.FC<FlippableModelCardProps> = ({
  model,
  isFavorite,
  onToggleFavorite,
  onSelectForCompare,
  onOpenTestPrompt,
  onOpenDetailsModal
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const codingBarRef = useRef<HTMLDivElement | null>(null);
  const reasoningBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    if (prefersReducedMotion()) {
      gsap.set(inner, { rotationY: isFlipped ? 180 : 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(inner, {
        rotationY: isFlipped ? 180 : 0,
        duration: 0.62,
        ease: 'back.out(1.35)',
        overwrite: 'auto',
      });

      if (isFlipped) {
        if (codingBarRef.current) {
          gsap.fromTo(
            codingBarRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            { scaleX: 1, duration: 0.55, delay: 0.14, ease: 'expo.out' }
          );
        }
        if (reasoningBarRef.current) {
          gsap.fromTo(
            reasoningBarRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            { scaleX: 1, duration: 0.55, delay: 0.2, ease: 'expo.out' }
          );
        }
      }
    }, inner);

    return () => ctx.revert();
  }, [isFlipped]);

  const handleCardClick = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsFlipped((prev) => !prev);
    }
  };

  const getTierBadge = () => {
    switch (model.accessTier) {
      case 'free':
        return <span className="badge badge-mint" style={{ fontSize: '10px' }}>FREE ACCESS</span>;
      case 'paid':
        return <span className="badge badge-amber" style={{ fontSize: '10px' }}>PAID API</span>;
      case 'hybrid':
        return <span className="badge badge-purple" style={{ fontSize: '10px' }}>HYBRID / FREE TIER</span>;
      default:
        return <span className="badge" style={{ fontSize: '10px', backgroundColor: 'var(--bg-pill)' }}>UNVERIFIED TIER</span>;
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`${model.name} card, click to flip for detailed specs`}
      onKeyDown={handleKeyDown}
      style={{
        perspective: '1200px',
        minHeight: '390px',
        cursor: 'pointer',
        outline: 'none'
      }}
      className="flippable-card-container gsap-corner-reticle"
    >
      <div
        ref={innerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ==================== CARD FRONT ==================== */}
        <div
          onClick={handleCardClick}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            backgroundColor: 'var(--bg-panel)',
            border: '2px solid var(--border-subtle)',
            borderRadius: '0px',
            padding: '20px 22px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            boxSizing: 'border-box'
          }}
        >
          <div>
            {/* Top Row: Provider & Badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0px',
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cpu size={16} color="var(--accent-gold)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {model.provider}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {model.modelFamily}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {getTierBadge()}
                {(model.provider === 'Groq' || model.provider === 'OpenRouter' || model.provider === 'Google' || model.modelKey.startsWith('groq/') || model.modelKey.includes('gemini') || model.modelKey.includes('deepseek')) ? (
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '0px', backgroundColor: 'var(--accent-mint-dim)', color: 'var(--accent-mint)', border: '1.5px solid var(--border-success)', fontWeight: 700, letterSpacing: '0.06em' }}>
                    ⚡ EXECUTABLE
                  </span>
                ) : (
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '0px', backgroundColor: 'var(--bg-pill)', color: 'var(--text-muted)', border: '1.5px solid var(--border-subtle)', fontWeight: 600, letterSpacing: '0.06em' }}>
                    METADATA ONLY
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(model.id);
                  }}
                  className="btn-ghost"
                  style={{ padding: '4px', borderRadius: '0px' }}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={14} color={isFavorite ? '#f9c74f' : 'var(--text-muted)'} fill={isFavorite ? '#f9c74f' : 'none'} />
                </button>
              </div>
            </div>

            {/* Model Name & Key */}
            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {model.name}
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                {model.modelKey}
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '14px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {model.description}
            </p>

            {/* Tags: Best use cases */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
              {model.bestUseCases.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '10px',
                    padding: '2px 7px',
                    borderRadius: '0px',
                    backgroundColor: 'var(--bg-pill)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Specs Bar & Flip Affordance */}
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '0px',
              border: '2px solid var(--border-subtle)',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                  Context Window
                </div>
                <div className="tabular-nums" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {model.contextWindow ? `${(model.contextWindow / 1000).toLocaleString()}K TOKENS` : 'UNVERIFIED'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                  Token Pricing
                </div>
                <div className="tabular-nums" style={{ fontSize: '12px', fontWeight: 700, color: model.pricing.isPriceVerified ? 'var(--accent-mint)' : 'var(--text-muted)', marginTop: '2px' }}>
                  {model.pricing.isPriceVerified && model.pricing.inputPricePerMillionUSD !== null
                    ? `$${model.pricing.inputPricePerMillionUSD} / $${model.pricing.outputPricePerMillionUSD}`
                    : model.isOpenWeight ? 'SELF-HOSTED' : 'UNQUOTED'}
                </div>
              </div>
            </div>

            {/* Flip affordance button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent-gold)',
              padding: '7px 0',
              borderRadius: '0px',
              border: '1.5px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-pill)'
            }}>
              <RotateCw size={12} />
              <span>[FLIP] VERIFIED EVIDENCE & ACTIONS</span>
            </div>
          </div>
        </div>

        {/* ==================== CARD BACK ==================== */}
        <div
          onClick={handleCardClick}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: 'var(--bg-panel)',
            border: '2px solid var(--border-accent-strong)',
            borderRadius: '0px',
            padding: '20px 22px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-lg)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ overflowY: 'auto', paddingRight: '4px' }}>
            {/* Header: Back indication */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={14} />
                <span>SPECIFICATIONS & BENCHMARKS</span>
              </div>
              <span className="tabular-nums" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Elo: {model.benchmarks.arenaElo || 'Unranked'}
              </span>
            </div>

            {/* Capabilities ratings + GSAP animated telemetry bars */}
            <div className="tabular-nums" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '10px',
              fontSize: '11px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <Code2 size={13} color="var(--accent-mint)" />
                  <span>Coding: <strong style={{ color: 'var(--text-primary)' }}>{model.capabilities.codingRating}/10</strong></span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
                  <div
                    ref={codingBarRef}
                    style={{
                      height: '100%',
                      width: `${Math.min(100, ((model.capabilities.codingRating ?? 0) / 10) * 100)}%`,
                      backgroundColor: 'var(--accent-mint)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <BrainCircuit size={13} color="var(--accent-purple)" />
                  <span>Reasoning: <strong style={{ color: 'var(--text-primary)' }}>{model.capabilities.reasoningRating}/10</strong></span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
                  <div
                    ref={reasoningBarRef}
                    style={{
                      height: '100%',
                      width: `${Math.min(100, ((model.capabilities.reasoningRating ?? 0) / 10) * 100)}%`,
                      backgroundColor: 'var(--accent-purple)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Free Tier / Paid Access Conditions */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '10px',
              fontSize: '11px'
            }}>
              <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700 }}>
                Access Conditions:
              </div>
              <div style={{ color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.4 }}>
                {model.freeTierDetails ? model.freeTierDetails.freeTierLimitations : 'Available via commercial provider API tokens.'}
              </div>
            </div>

            {/* Known Limitations */}
            <div style={{ marginBottom: '10px', fontSize: '11px' }}>
              <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700, marginBottom: '4px' }}>
                Known Limitations:
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <AlertCircle size={12} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{model.knownLimitations[0] || 'Standard rate quotas apply.'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar on Card Back */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectForCompare(model);
                }}
                className="btn-secondary"
                style={{ padding: '6px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                title="Add to 2-Model Comparison Studio"
              >
                <GitCompare size={12} color="var(--accent-purple)" />
                <span>Compare</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTestPrompt(model);
                }}
                className="btn-secondary"
                style={{ padding: '6px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                title="Run a test prompt with this model"
              >
                <Play size={12} color="var(--accent-mint)" />
                <span>Test Prompt</span>
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetailsModal(model);
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '7px 0', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <span>Full Model Profile</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

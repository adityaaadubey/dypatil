import React, { useState } from 'react';
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
      className="flippable-card-container"
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
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
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
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
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cpu size={16} color="var(--accent-purple)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
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
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(53, 214, 165, 0.15)', color: '#35D6A5', border: '1px solid rgba(53, 214, 165, 0.3)', fontWeight: 600, letterSpacing: '0.3px' }}>
                    ⚡ EXECUTABLE
                  </span>
                ) : (
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(172, 145, 241, 0.08)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontWeight: 500, letterSpacing: '0.3px' }}>
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
                  style={{ padding: '4px', borderRadius: '50%' }}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={14} color={isFavorite ? '#F59E0B' : 'var(--text-muted)'} fill={isFavorite ? '#F59E0B' : 'none'} />
                </button>
              </div>
            </div>

            {/* Model Name & Key */}
            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {model.name}
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
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
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-pill)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
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
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Context Window
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {model.contextWindow ? `${(model.contextWindow / 1000).toLocaleString()}k tokens` : 'Unverified'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Token Pricing
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: model.pricing.isPriceVerified ? 'var(--accent-mint)' : 'var(--text-muted)', marginTop: '2px' }}>
                  {model.pricing.isPriceVerified && model.pricing.inputPricePerMillionUSD !== null
                    ? `$${model.pricing.inputPricePerMillionUSD} / $${model.pricing.outputPricePerMillionUSD}`
                    : model.isOpenWeight ? 'Self-Hosted' : 'Unquoted'}
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
              fontWeight: 600,
              color: 'var(--accent-purple)',
              padding: '6px 0',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-purple-dim)'
            }}>
              <RotateCw size={12} />
              <span>Click to Flip for Verified Evidence & Actions</span>
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
            border: '1px solid var(--accent-purple)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 12px 32px rgba(145, 132, 255, 0.15)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ overflowY: 'auto', paddingRight: '4px' }}>
            {/* Header: Back indication */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={14} />
                <span>SPECIFICATIONS & BENCHMARKS</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Elo: {model.benchmarks.arenaElo || 'Unranked'}
              </span>
            </div>

            {/* Capabilities ratings */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              marginBottom: '10px',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Code2 size={13} color="var(--accent-mint)" />
                <span>Coding: <strong style={{ color: 'var(--text-primary)' }}>{model.capabilities.codingRating}/10</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <BrainCircuit size={13} color="var(--accent-purple)" />
                <span>Reasoning: <strong style={{ color: 'var(--text-primary)' }}>{model.capabilities.reasoningRating}/10</strong></span>
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

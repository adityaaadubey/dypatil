import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  ExternalLink, 
  Play, 
  GitCompare, 
  Star, 
  ShieldCheck, 
  Calculator
} from 'lucide-react';
import type { EnrichedModelCatalogItem } from '../types/modelExplorer';
import { formatINR } from '../config/pricingPackages';

interface ModelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: EnrichedModelCatalogItem | null;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectForCompare: (model: EnrichedModelCatalogItem) => void;
  onOpenTestPrompt: (model: EnrichedModelCatalogItem) => void;
}

export const ModelDetailModal: React.FC<ModelDetailModalProps> = ({
  isOpen,
  onClose,
  model,
  isFavorite,
  onToggleFavorite,
  onSelectForCompare,
  onOpenTestPrompt
}) => {
  // Hypothetical calculator tokens
  const [calcInputTokens, setCalcInputTokens] = useState<number>(10000);
  const [calcOutputTokens, setCalcOutputTokens] = useState<number>(2000);

  if (!isOpen || !model) return null;

  // Compute hypothetical cost
  const inRate = model.pricing.inputPricePerMillionUSD || 0;
  const outRate = model.pricing.outputPricePerMillionUSD || 0;
  const hypotheticalCostUSD = (calcInputTokens / 1e6) * inRate + (calcOutputTokens / 1e6) * outRate;
  const hypotheticalCostINR = hypotheticalCostUSD * 88.0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 24, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 140,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-purple-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={20} color="var(--accent-purple)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {model.name}
                </h3>
                <span className={`badge ${
                  model.accessTier === 'free' ? 'badge-mint' : 
                  model.accessTier === 'paid' ? 'badge-amber' : 'badge-purple'
                }`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                  {model.accessTier}
                </span>
                <span className="badge" style={{ fontSize: '10px', backgroundColor: 'var(--bg-pill)' }}>
                  {model.status}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {model.provider} • Family: {model.modelFamily} • ID: <code style={{ fontFamily: 'monospace' }}>{model.modelKey}</code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onToggleFavorite(model.id)}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={14} color={isFavorite ? '#F59E0B' : 'var(--text-muted)'} fill={isFavorite ? '#F59E0B' : 'none'} />
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>
            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '6px', borderRadius: '50%' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backgroundColor: 'var(--bg-main)'
        }}>
          {/* Overview & Description */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Official Overview & Provenance
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {model.officialDescription}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--accent-mint)" />
              <span>Data Provenance: {model.dataProvenance} • Last verified: {model.lastVerified}</span>
            </div>
          </div>

          {/* Capabilities & Benchmark Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Arena Rating (Elo)</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-mint)', marginTop: '4px' }}>
                {model.benchmarks.arenaElo || 'Unranked'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Blind pairwise testbench</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Coding Ability</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {model.capabilities.codingRating} / 10
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Code synthesis & debugging</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Reasoning Score</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {model.capabilities.reasoningRating} / 10
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Multi-step logic & proofs</div>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Context Window</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '4px' }}>
                {model.contextWindow ? `${(model.contextWindow / 1000).toLocaleString()}k` : 'Unknown'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Max tokens per request</div>
            </div>
          </div>

          {/* Pricing & Hypothetical Request Cost Calculator */}
          <div style={{
            padding: '18px 20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={16} color="var(--accent-purple)" />
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pricing & Hypothetical Request Cost Calculator
                </h4>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {model.pricing.isPriceVerified ? 'Verified Provider Rates' : 'Unverified Token Rates'}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '14px'
            }}>
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Input Rate / 1M</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {model.pricing.inputPricePerMillionUSD !== null ? `$${model.pricing.inputPricePerMillionUSD}` : 'Not verified'}
                </div>
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Output Rate / 1M</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {model.pricing.outputPricePerMillionUSD !== null ? `$${model.pricing.outputPricePerMillionUSD}` : 'Not verified'}
                </div>
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cache Read / 1M</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {model.pricing.cacheReadPricePerMillionUSD !== null ? `$${model.pricing.cacheReadPricePerMillionUSD}` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Interactive Calculator Sliders */}
            {model.pricing.isPriceVerified && (
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-panel)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Simulate Hypothetical Query Cost:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Prompt Input:</span>
                      <strong>{calcInputTokens.toLocaleString()} tokens</strong>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="100000"
                      step="1000"
                      value={calcInputTokens}
                      onChange={(e) => setCalcInputTokens(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Completion Output:</span>
                      <strong>{calcOutputTokens.toLocaleString()} tokens</strong>
                    </div>
                    <input
                      type="range"
                      min="256"
                      max="8192"
                      step="256"
                      value={calcOutputTokens}
                      onChange={(e) => setCalcOutputTokens(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Estimated Total Query Cost:</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-mint)', fontSize: '14px' }}>
                      ${hypotheticalCostUSD.toFixed(5)} USD
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>
                      (~{formatINR(hypotheticalCostINR)})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Access Details & Known Limitations */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Access Conditions & Tier
              </h5>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {model.freeTierDetails ? model.freeTierDetails.freeTierLimitations : 'Available for commercial applications via pay-as-you-go provider API keys.'}
              </p>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                License: <strong style={{ color: 'var(--text-primary)' }}>{model.license}</strong>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--bg-panel)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Documented Constraints & Limitations
              </h5>
              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {model.knownLimitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
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
          <a
            href={model.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--accent-purple)',
              textDecoration: 'none'
            }}
          >
            <span>Official Documentation</span>
            <ExternalLink size={12} />
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                onSelectForCompare(model);
                onClose();
              }}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <GitCompare size={14} color="var(--accent-purple)" />
              <span>Compare Model</span>
            </button>

            <button
              onClick={() => {
                onOpenTestPrompt(model);
                onClose();
              }}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={14} />
              <span>Test with Prompt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

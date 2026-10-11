import React from 'react';
import { 
  Check, 
  Sliders, 
  Zap, 
  Layers, 
  Lock, 
  Coins, 
  ArrowRight,
  Info
} from 'lucide-react';
import { PRICING_PACKAGES, formatINR, formatTokens } from '../config/pricingPackages';
import type { PackageTierConfig } from '../types/billing';
import type { TrialAllowance } from '../types/billing';

interface PricingPageProps {
  onConfigurePackage: (tier: PackageTierConfig) => void;
  trialAllowance: TrialAllowance;
  onOpenCart: () => void;
  cartItemCount: number;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onConfigurePackage,
  trialAllowance,
  onOpenCart,
  cartItemCount
}) => {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Banner / Headline */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto', paddingTop: '10px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="badge badge-purple" style={{ fontSize: '11px', padding: '3px 10px' }}>
            TRANSPARENT INFERENCE ECONOMICS
          </span>
          <span className="badge badge-mint" style={{ fontSize: '11px', padding: '3px 10px' }}>
            PAYABLE IN INR (₹)
          </span>
        </div>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1.2
        }}>
          Tailored Inference Token Packages
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          marginTop: '12px',
          lineHeight: 1.6
        }}>
          Allocate tokens precisely to your preferred models without unwanted bundling. 
          Pool tokens across verified models or build a custom tier priced directly from real provider token economics.
        </p>
      </div>

      {/* Trial Allowance Notification Pill */}
      <div style={{
        maxWidth: '820px',
        margin: '0 auto',
        width: '100%',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-mint-dim)',
            border: '1px solid var(--accent-mint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Coins size={14} color="var(--accent-mint)" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Complimentary Platform Trial Allowance Active
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {trialAllowance.remainingTrialTokens.toLocaleString()} / {trialAllowance.totalTrialTokens.toLocaleString()} trial tokens available for recommendation prompt execution. Kept strictly separate from purchased packages.
            </div>
          </div>
        </div>

        {cartItemCount > 0 && (
          <button
            onClick={onOpenCart}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', borderColor: 'var(--accent-purple)' }}
          >
            <span>View Cart ({cartItemCount})</span>
            <ArrowRight size={13} color="var(--accent-purple)" />
          </button>
        )}
      </div>

      {/* Pricing Cards Grid (4 Tiers) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {PRICING_PACKAGES.map((tier) => {
          const isSilver = tier.id === 'silver';
          const isGold = tier.id === 'gold';
          const isBronze = tier.id === 'bronze';
          const isCustom = tier.id === 'custom';

          return (
            <div
              key={tier.id}
              style={{
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-panel)',
                border: isSilver 
                  ? `2px solid ${tier.accentColor}` 
                  : isCustom 
                  ? '1px solid var(--accent-purple)' 
                  : '1px solid var(--border-subtle)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isSilver ? '0 10px 30px rgba(148, 163, 184, 0.15)' : 'none',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
            >
              {/* Highlight badge if popular / recommended */}
              {tier.badgeText && (
                <div style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '24px',
                  backgroundColor: tier.accentColor,
                  color: isBronze || isGold ? '#000000' : isSilver ? '#0B1020' : '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {tier.badgeText}
                </div>
              )}

              <div>
                {/* Tier Name & Tagline */}
                <div style={{ marginTop: tier.badgeText ? '4px' : '0' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {tier.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', minHeight: '36px', lineHeight: 1.4 }}>
                    {tier.tagline}
                  </p>
                </div>

                {/* Price Display */}
                <div style={{ margin: '18px 0', padding: '14px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {isCustom ? (
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-purple)' }}>
                        Dynamic INR
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Calculated transparently from model token rates
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        {formatINR(tier.priceINR)}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        / package
                      </span>
                    </div>
                  )}

                  {/* Included token pool & model limit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: `${tier.accentColor}20`,
                      color: tier.accentColor,
                      border: `1px solid ${tier.accentColor}40`
                    }}>
                      {isCustom ? 'Custom Tokens' : formatTokens(tier.baseTokensIncluded)}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-pill)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      Up to {tier.maxModelsSelectable} models
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Included Capabilities
                  </div>
                  {tier.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                      <Check size={14} color="var(--accent-mint)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Restrictions */}
                {tier.restrictions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Package Scope & Limits
                    </div>
                    {tier.restrictions.map((res, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <Info size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onConfigurePackage(tier)}
                className={isSilver ? 'btn-primary' : 'btn-secondary'}
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderColor: isSilver ? undefined : tier.accentColor
                }}
              >
                <Sliders size={14} />
                <span>{isCustom ? 'Build Custom Package' : 'Configure Package'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Explanatory Architecture & Commercial Transparency Section */}
      <div style={{
        marginTop: '20px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Layers size={18} color="var(--accent-purple)" />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Independent Per-Model Allocations
            </h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Selecting one model inside a package never bundles unwanted sibling variants. You decide exactly which models receive an allocation and configure their token budgets individually.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={18} color="var(--accent-mint)" />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Real Provider Rate Provenance
            </h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            For custom packages, token estimates are derived from verified input and output pricing per million tokens in the ModelRouter registry, converted to Indian Rupees (INR) at commercial parity.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Lock size={18} color="var(--accent-amber)" />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              QR-Only Checkout Boundary
            </h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Checkout generates a pending order reference with a scan-to-pay UPI QR code. No automated payment verification, gateway integration, or automated token crediting is performed at this stage.
          </p>
        </div>
      </div>
    </div>
  );
};

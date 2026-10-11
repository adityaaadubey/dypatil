import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import type { 
  PackageTierConfig, 
  ModelTokenAllocation, 
  CartItem 
} from '../types/billing';
import type { ArenaModel } from '../types/arena';
import { 
  formatINR, 
  formatTokens, 
  BILLING_CONFIG 
} from '../config/pricingPackages';
import { 
  calculateModelTokenCostINR, 
  validatePackageConfiguration 
} from '../services/billingService';

interface PackageConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: PackageTierConfig;
  allModels: ArenaModel[];
  onAddToCart: (item: CartItem) => void;
  existingItemToEdit?: CartItem | null;
}

function generateCartItemId(): string {
  return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
}

export const PackageConfiguratorModal: React.FC<PackageConfiguratorModalProps> = ({
  isOpen,
  onClose,
  tier,
  allModels,
  onAddToCart,
  existingItemToEdit
}) => {
  // Existing allocations or start fresh
  const [allocations, setAllocations] = useState<ModelTokenAllocation[]>(() => {
    if (existingItemToEdit && existingItemToEdit.packageTierId === tier.id) {
      return existingItemToEdit.allocations;
    }
    return [];
  });

  // Model catalog search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [verifiedPricingOnly, setVerifiedPricingOnly] = useState(tier.id === 'custom');

  // Available unique providers from the dataset
  const providers = useMemo(() => {
    const set = new Set<string>();
    allModels.forEach((m) => {
      if (m.provider) set.add(m.provider);
    });
    return Array.from(set).sort();
  }, [allModels]);

  // Filter models for selection
  const filteredModels = useMemo(() => {
    return allModels.filter((m) => {
      const matchesSearch = 
        m.modelDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.modelKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProvider = 
        selectedProvider === 'all' || m.provider.toLowerCase() === selectedProvider.toLowerCase();

      const hasVerifiedPricing = 
        m.inputPricePerMillion !== null && m.outputPricePerMillion !== null;

      if (verifiedPricingOnly && !hasVerifiedPricing) return false;

      return matchesSearch && matchesProvider;
    }).slice(0, 50); // limit to top 50 matches for smooth performance
  }, [allModels, searchQuery, selectedProvider, verifiedPricingOnly]);

  // Total tokens currently allocated across models in this package
  const totalAllocatedTokens = allocations.reduce((sum, a) => sum + a.allocatedTokens, 0);

  // Available remaining tokens in pooled tiers (Bronze, Silver, Gold)
  const remainingPooledTokens = tier.id !== 'custom' 
    ? Math.max(0, tier.baseTokensIncluded - totalAllocatedTokens) 
    : 0;

  // Real-time server-style validation
  const validation = validatePackageConfiguration(tier.id, allocations);

  if (!isOpen) return null;

  // Handle adding a model to package
  const handleAddModel = (model: ArenaModel) => {
    // Check if already selected
    if (allocations.some((a) => a.modelId === model.id)) return;

    // Check maximum model count
    if (allocations.length >= tier.maxModelsSelectable) {
      alert(`Maximum model limit of ${tier.maxModelsSelectable} reached for the ${tier.name} package.`);
      return;
    }

    // Determine default token allocation
    let defaultTokens = 100_000;
    if (tier.id !== 'custom') {
      const currentCount = allocations.length;
      // Evenly divide remaining or set to an appropriate chunk
      defaultTokens = Math.max(10_000, Math.floor(remainingPooledTokens > 0 ? remainingPooledTokens : tier.baseTokensIncluded / (currentCount + 1)));
    }

    const { priceINR, isVerified } = calculateModelTokenCostINR(
      defaultTokens,
      model.inputPricePerMillion,
      model.outputPricePerMillion
    );

    const newAllocation: ModelTokenAllocation = {
      modelId: model.id,
      modelDisplayName: model.modelDisplayName,
      provider: model.provider,
      allocatedTokens: defaultTokens,
      estimatedInputTokens: Math.round(defaultTokens * BILLING_CONFIG.DEFAULT_INPUT_RATIO),
      estimatedOutputTokens: Math.round(defaultTokens * BILLING_CONFIG.DEFAULT_OUTPUT_RATIO),
      inputCostPerMillion: model.inputPricePerMillion,
      outputCostPerMillion: model.outputPricePerMillion,
      calculatedModelPriceINR: priceINR,
      isPriceVerified: isVerified
    };

    setAllocations([...allocations, newAllocation]);
  };

  // Handle removing a model
  const handleRemoveModel = (modelId: string) => {
    setAllocations(allocations.filter((a) => a.modelId !== modelId));
  };

  // Handle changing tokens for a specific model
  const handleUpdateAllocationTokens = (modelId: string, newTokens: number) => {
    const validTokens = Math.max(1_000, Math.round(newTokens));
    setAllocations((prev) => 
      prev.map((a) => {
        if (a.modelId !== modelId) return a;

        const { priceINR, isVerified } = calculateModelTokenCostINR(
          validTokens,
          a.inputCostPerMillion,
          a.outputCostPerMillion
        );

        return {
          ...a,
          allocatedTokens: validTokens,
          estimatedInputTokens: Math.round(validTokens * BILLING_CONFIG.DEFAULT_INPUT_RATIO),
          estimatedOutputTokens: Math.round(validTokens * BILLING_CONFIG.DEFAULT_OUTPUT_RATIO),
          calculatedModelPriceINR: priceINR,
          isPriceVerified: isVerified
        };
      })
    );
  };

  // Add to cart action
  const handleConfirmAddToCart = () => {
    if (!validation.isValid) return;

    const cartItemId = existingItemToEdit?.cartItemId || generateCartItemId();
    const createdAt = existingItemToEdit?.createdAt || new Date().toISOString();

    const cartItem: CartItem = {
      cartItemId,
      packageTierId: tier.id,
      packageName: tier.name,
      packageBasePriceINR: tier.priceINR,
      totalTokensAllocated: totalAllocatedTokens,
      allocations,
      finalItemPriceINR: validation.authoritativePriceINR,
      createdAt
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 24, 0.82)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
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
        maxWidth: '1020px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: `${tier.accentColor}20`,
              border: `1px solid ${tier.accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sliders size={18} color={tier.accentColor} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Configure {tier.name}
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: `${tier.accentColor}25`,
                  color: tier.accentColor,
                  border: `1px solid ${tier.accentColor}50`
                }}>
                  {tier.badgeText || tier.id.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {tier.id === 'custom' 
                  ? 'Select any verified models and configure independent token allocations.'
                  : `Includes ${formatTokens(tier.baseTokensIncluded)} pooled across up to ${tier.maxModelsSelectable} models.`
                }
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Close Configurator"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Split view (Selected allocations & Model picker) */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-main)'
        }}>
          {/* LEFT COLUMN: Selected Models & Allocation Sliders */}
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Status & Package Limit Bar */}
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Selected Models: {allocations.length} / {tier.maxModelsSelectable} max
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {tier.id === 'custom' 
                    ? `${formatTokens(totalAllocatedTokens)} Total`
                    : `${formatTokens(totalAllocatedTokens)} / ${formatTokens(tier.baseTokensIncluded)}`
                  }
                </span>
              </div>

              {/* Progress bar for pooled tiers */}
              {tier.id !== 'custom' && (
                <div style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--bg-pill)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, (totalAllocatedTokens / tier.baseTokensIncluded) * 100)}%`,
                    height: '100%',
                    backgroundColor: totalAllocatedTokens > tier.baseTokensIncluded ? 'var(--accent-red)' : tier.accentColor,
                    transition: 'width 0.2s ease'
                  }} />
                </div>
              )}

              {tier.id !== 'custom' && (
                <div style={{
                  fontSize: '11px',
                  color: totalAllocatedTokens > tier.baseTokensIncluded ? 'var(--accent-red)' : 'var(--text-muted)',
                  marginTop: '6px'
                }}>
                  {totalAllocatedTokens > tier.baseTokensIncluded 
                    ? `Over allocated by ${formatTokens(totalAllocatedTokens - tier.baseTokensIncluded)}!`
                    : `${formatTokens(remainingPooledTokens)} unallocated remaining in this package.`
                  }
                </div>
              )}
            </div>

            {/* Selected Allocations List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Model Allocations ({allocations.length})
                </h4>
                {allocations.length > 0 && (
                  <button 
                    onClick={() => setAllocations([])}
                    style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {allocations.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-panel)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}>
                  <Layers size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    No Models Added Yet
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Select eligible models from the catalogue on the right to assign token budgets.
                  </div>
                </div>
              ) : (
                allocations.map((alloc) => (
                  <div
                    key={alloc.modelId}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {alloc.modelDisplayName}
                          </span>
                          <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>
                            {alloc.provider}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                          {alloc.modelId}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveModel(alloc.modelId)}
                        className="btn-ghost"
                        style={{ padding: '4px', color: 'var(--accent-red)' }}
                        title="Remove model"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Per-model allocation slider & input */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Allocated Usage:
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {alloc.allocatedTokens.toLocaleString()} tokens ({formatTokens(alloc.allocatedTokens)})
                        </span>
                      </div>

                      <input
                        type="range"
                        min="10000"
                        max={tier.id === 'custom' ? 5000000 : tier.baseTokensIncluded}
                        step="10000"
                        value={alloc.allocatedTokens}
                        onChange={(e) => handleUpdateAllocationTokens(alloc.modelId, parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: tier.accentColor,
                          cursor: 'pointer'
                        }}
                      />
                    </div>

                    {/* Model pricing breakdown for Custom tier */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      padding: '6px 8px',
                      backgroundColor: 'var(--bg-pill)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {alloc.isPriceVerified ? (
                          <span>
                            Rates: ${alloc.inputCostPerMillion}/1M in • ${alloc.outputCostPerMillion}/1M out
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-amber)' }}>
                            Pricing unverified in provider registry
                          </span>
                        )}
                      </div>

                      <div style={{ fontWeight: 700, color: tier.id === 'custom' ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
                        {tier.id === 'custom' ? (
                          alloc.isPriceVerified ? formatINR(alloc.calculatedModelPriceINR) : 'Unquoted'
                        ) : (
                          'Included in package'
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Searchable Registry Model Selector */}
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Registry Model Selector
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Choose models to include. Selecting a model will never automatically add unwanted sibling variants.
              </p>
            </div>

            {/* Search and Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search model by name or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '11px'
                  }}
                >
                  <option value="all">All Providers ({providers.length})</option>
                  {providers.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={verifiedPricingOnly}
                    onChange={(e) => setVerifiedPricingOnly(e.target.checked)}
                  />
                  <span>Verified Rates Only</span>
                </label>
              </div>
            </div>

            {/* Models list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredModels.map((m) => {
                const isSelected = allocations.some((a) => a.modelId === m.id);
                const isPricingVerified = m.inputPricePerMillion !== null && m.outputPricePerMillion !== null;

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--accent-purple-dim)' : 'var(--bg-card)',
                      border: isSelected ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.modelDisplayName}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          • {m.provider}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <span>Elo {m.rating}</span>
                        {isPricingVerified ? (
                          <span style={{ color: 'var(--accent-mint)' }}>
                            ${m.inputPricePerMillion} / ${m.outputPricePerMillion}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unverified Rate</span>
                        )}
                        {m.contextLength && (
                          <span>{(m.contextLength / 1000).toFixed(0)}k ctx</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => isSelected ? handleRemoveModel(m.id) : handleAddModel(m)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: isSelected ? 'var(--accent-red)' : 'var(--accent-purple)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Select</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer / Checkout Trigger */}
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
          <div>
            {!validation.isValid ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)', fontSize: '12px' }}>
                <AlertCircle size={14} />
                <span>{validation.errorMessage}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-mint)', fontSize: '12px' }}>
                <CheckCircle2 size={14} />
                <span>Configuration valid ({allocations.length} models, {formatTokens(totalAllocatedTokens)})</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Package Price
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatINR(validation.authoritativePriceINR)}
              </div>
            </div>

            <button
              onClick={handleConfirmAddToCart}
              disabled={!validation.isValid}
              className="btn-primary"
              style={{
                padding: '10px 22px',
                fontSize: '13px',
                opacity: validation.isValid ? 1 : 0.5,
                cursor: validation.isValid ? 'pointer' : 'not-allowed'
              }}
            >
              {existingItemToEdit ? 'Update Cart Item' : 'Add Package to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  X, 
  Trash2, 
  Edit3, 
  ShoppingBag, 
  ArrowRight, 
  Coins
} from 'lucide-react';
import type { CartState, CartItem } from '../types/billing';
import { formatINR, formatTokens } from '../config/pricingPackages';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartState;
  onRemoveItem: (cartItemId: string) => void;
  onEditItem: (item: CartItem) => void;
  onProceedToCheckout: () => void;
  onNavigateToPricing: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onEditItem,
  onProceedToCheckout,
  onNavigateToPricing
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 24, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 110,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        height: '100%',
        backgroundColor: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        animation: 'slideInRight 0.25s ease-out'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-purple-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={16} color="var(--accent-purple)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Your Package Cart
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {cart.items.length} {cart.items.length === 1 ? 'package configuration' : 'package configurations'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {cart.items.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-secondary)'
            }}>
              <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Your cart is empty
              </h4>
              <p style={{ fontSize: '12px', maxWidth: '300px', lineHeight: 1.5, marginBottom: '24px' }}>
                Configure a Bronze, Silver, Gold, or Custom model package to allocate tokens and proceed to checkout.
              </p>
              <button
                onClick={() => { onClose(); onNavigateToPricing(); }}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '12px' }}
              >
                Browse Pricing Plans
              </button>
            </div>
          ) : (
            cart.items.map((item, idx) => (
              <div
                key={item.cartItemId}
                style={{
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Item header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${
                      item.packageTierId === 'gold' ? 'badge-amber' : 
                      item.packageTierId === 'bronze' ? 'badge-amber' : 
                      item.packageTierId === 'silver' ? 'badge-mint' : 'badge-purple'
                    }`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                      {item.packageName}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      #{idx + 1}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => onEditItem(item)}
                      className="btn-ghost"
                      style={{ padding: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-purple)' }}
                      title="Edit model allocations"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.cartItemId)}
                      className="btn-ghost"
                      style={{ padding: '4px', color: 'var(--accent-red)' }}
                      title="Remove package"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Allocated models summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Selected Models & Allocations ({item.allocations.length}):
                  </div>
                  {item.allocations.map((alloc) => (
                    <div
                      key={alloc.modelId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-panel)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {alloc.modelDisplayName}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          ({alloc.provider})
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-mint)' }}>
                        {formatTokens(alloc.allocatedTokens)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Package footer: tokens & INR price */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Total Tokens: <strong style={{ color: 'var(--text-primary)' }}>{formatTokens(item.totalTokensAllocated)}</strong>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatINR(item.finalItemPriceINR)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer / Proceed to Payment */}
        {cart.items.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal ({cart.items.length} packages, {cart.totalModelsSelected} models)</span>
                <span>{formatINR(cart.totalPriceINR)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Total Token Allocations</span>
                <span>{formatTokens(cart.totalTokens)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}>
                <span>Total Payable Amount</span>
                <span style={{ color: 'var(--accent-mint)' }}>{formatINR(cart.totalPriceINR)}</span>
              </div>
            </div>

            {/* Scope explanation notice */}
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Coins size={14} color="var(--accent-purple)" />
              <span>QR-Only Checkout: Payment proceeds via UPI QR scan. No card or gateway processing required.</span>
            </div>

            {/* Continue to Payment button */}
            <button
              onClick={onProceedToCheckout}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Continue to Payment (QR)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

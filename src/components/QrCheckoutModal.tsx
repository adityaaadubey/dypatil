import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle, 
  QrCode, 
  HelpCircle,
  Package
} from 'lucide-react';
import type { PendingOrder } from '../types/billing';
import { formatINR, formatTokens } from '../config/pricingPackages';

interface QrCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PendingOrder | null;
}

export const QrCheckoutModal: React.FC<QrCheckoutModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 24, 0.88)',
      backdropFilter: 'blur(10px)',
      zIndex: 120,
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
        maxWidth: '680px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 30px 70px rgba(0,0,0,0.7)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} color="var(--accent-amber)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Scan QR to Complete Payment
                </h3>
                <span className="badge badge-amber" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                  {order.status}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Order registered • Awaiting manual verification & settlement
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Close checkout screen"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          backgroundColor: 'var(--bg-main)'
        }}>
          {/* Order Reference & Amount Card */}
          <div style={{
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Order Reference Identifier
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {order.orderId}
                </span>
                <button
                  onClick={handleCopyOrderId}
                  className="btn-ghost"
                  style={{ padding: '4px 6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Copy Order ID to clipboard"
                >
                  {copiedId ? <Check size={12} color="var(--accent-mint)" /> : <Copy size={12} />}
                  <span style={{ color: copiedId ? 'var(--accent-mint)' : 'var(--text-secondary)' }}>
                    {copiedId ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Payable Amount
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-mint)', marginTop: '2px' }}>
                {formatINR(order.totalAmountINR)}
              </div>
            </div>
          </div>

          {/* Centered QR Code Container */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            width: '260px'
          }}>
            {/* Real QR image or Professional Project Owner Placeholder */}
            {!imgError ? (
              <img
                src={order.qrImagePath}
                alt="Payment QR Code"
                onError={() => setImgError(true)}
                style={{
                  width: '220px',
                  height: '220px',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }}
              />
            ) : (
              <div style={{
                width: '220px',
                height: '220px',
                border: '2px dashed #94A3B8',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                color: '#1E293B'
              }}>
                <QrCode size={48} color="#475569" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                  Merchant Payment QR
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>
                  Configured at <code style={{ fontSize: '9px', background: '#E2E8F0', padding: '1px 3px' }}>client/public/payment-qr.png</code>
                </div>
              </div>
            )}

            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '0.02em',
              textAlign: 'center'
            }}>
              Scan with Any UPI App
            </div>
            <div style={{ fontSize: '9px', color: '#64748B', textAlign: 'center' }}>
              Google Pay • PhonePe • Paytm • BHIM
            </div>
          </div>

          {/* Step-by-Step Payment Instructions */}
          <div style={{
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            fontSize: '12px'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={14} color="var(--accent-purple)" />
              Payment Instructions
            </h4>
            <ol style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <li>Open your UPI-compliant mobile application (GPay, PhonePe, Paytm, BHIM, etc.).</li>
              <li>Scan the QR code displayed above.</li>
              <li>Confirm the payable amount matches exactly <strong style={{ color: 'var(--text-primary)' }}>{formatINR(order.totalAmountINR)}</strong>.</li>
              <li>In the transaction remarks/notes field, enter your Order ID: <strong style={{ color: 'var(--accent-mint)', fontFamily: 'monospace' }}>{order.orderId}</strong>.</li>
            </ol>
          </div>

          {/* Locked Order Snapshot (Preserves package configuration & model allocations) */}
          <div style={{
            width: '100%',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} color="var(--accent-mint)" />
              Preserved Order Snapshot ({order.items.length} {order.items.length === 1 ? 'Package' : 'Packages'})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {order.items.map((item, idx) => (
                <div
                  key={item.cartItemId || idx}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.packageName}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-mint)' }}>
                      {formatINR(item.finalItemPriceINR)}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {item.allocations.map((a) => `${a.modelDisplayName} (${formatTokens(a.allocatedTokens)})`).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explicit Boundary Notice: Stop at this stage */}
          <div style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertCircle size={16} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Notice - Workflow Scope Boundary:</strong>
              <div style={{ marginTop: '2px', lineHeight: 1.5 }}>
                Payment verification, payment gateway integration, and automatic token crediting are currently not active. This order remains in <strong style={{ color: 'var(--accent-amber)' }}>PENDING_PAYMENT</strong> status. Opening this checkout does not modify your token balance.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Placed at {new Date(order.createdAt).toLocaleTimeString()}
          </span>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '8px 20px', fontSize: '12px' }}
          >
            Done / Close View
          </button>
        </div>
      </div>
    </div>
  );
};

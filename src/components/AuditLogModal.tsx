import React from 'react';
import { X, Trash2, ShieldCheck, Download, AlertTriangle } from 'lucide-react';
import type { AuditLogEntry } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
  onClearLogs: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs
}) => {
  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `modelrouter_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div 
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-panel)',
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-mint-dim)',
                color: 'var(--accent-mint)'
              }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Inference Telemetry & Audit Logs
              </h3>
              <span className="badge badge-subtle">
                {logs.length} Entries
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Historical ledger of routing requests, evaluated cost, latencies, and failover triggers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {logs.length > 0 && (
              <>
                <button
                  onClick={handleExportJSON}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <Download size={13} />
                  Export JSON
                </button>
                <button
                  onClick={onClearLogs}
                  className="btn-ghost"
                  style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-danger)' }}
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {logs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              No routing decisions logged in this session yet. Run a recommendation in the studio to generate audit records.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  fontSize: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-mono" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
                      {log.decisionId}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{log.timestamp}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="badge badge-subtle" style={{ fontSize: '10px' }}>
                      {log.preference.replace('_', ' ')}
                    </span>
                    {log.failoverOccurred && (
                      <span className="badge badge-amber" style={{ fontSize: '10px' }}>
                        <AlertTriangle size={11} />
                        Failover
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-primary)', marginTop: '4px', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{log.promptSnippet}"
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.selectedModelName || 'No Valid Match'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                    ${log.estimatedCost.toFixed(5)} • {log.latencyP95}ms
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 16px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

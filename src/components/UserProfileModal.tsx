import React, { useState, useEffect } from 'react';
import { X, Wallet, History, BarChart3, Settings, Download, Trash2, CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { authService, type User as UserType, type Profile, type Wallet as WalletType, type ExecutionRecord } from '../services/authService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onProfileUpdated?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'analytics' | 'history' | 'settings'>('wallet');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [history, setHistory] = useState<ExecutionRecord[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [historySearch, setHistorySearch] = useState('');

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTheme, setEditTheme] = useState<'dark' | 'light'>('dark');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadProfileData();
    }
  }, [isOpen, currentUser]);

  const loadProfileData = async () => {
    try {
      const pData = await authService.getProfile();
      setProfile(pData.profile);
      setWallet(pData.wallet);
      setEditName(pData.profile?.display_name || currentUser?.name || '');
      setEditBio(pData.profile?.bio || '');
      setEditPhone(pData.profile?.phone || currentUser?.phone || '');
      setEditTheme(pData.profile?.preferred_theme || 'dark');

      const hData = await authService.getHistory();
      setHistory(hData.history || []);

      const uData = await authService.getUsageAnalytics();
      setUsageData(uData);
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  };

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.updateProfile({
        display_name: editName,
        bio: editBio,
        phone: editPhone,
        preferred_theme: editTheme
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onProfileUpdated?.();
      loadProfileData();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await authService.deleteHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleExportHistory = (format: 'csv' | 'json') => {
    if (history.length === 0) return;
    let content = '';
    let filename = `veyralabs_history_${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(history, null, 2);
      filename += '.json';
    } else {
      const headers = ['ID', 'Model', 'Prompt', 'Response', 'InputTokens', 'OutputTokens', 'LatencyMs', 'CostUSD', 'CacheHit', 'Date'];
      const rows = history.map(h => [
        h.id,
        `"${h.model_id}"`,
        `"${h.prompt.replace(/"/g, '""')}"`,
        `"${(h.response_text || '').replace(/"/g, '""')}"`,
        h.input_tokens,
        h.output_tokens,
        h.latency_ms,
        h.cost_estimate,
        h.cache_hit,
        h.created_at
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename += '.csv';
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(h =>
    h.prompt.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.model_id.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 7, 49, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 60px rgba(4, 18, 88, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #041258 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '18px',
                boxShadow: '0 0 12px rgba(172, 145, 241, 0.4)'
              }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {profile?.display_name || currentUser.name}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: currentUser.role === 'admin' ? 'rgba(172, 145, 241, 0.2)' : 'rgba(53, 214, 165, 0.2)',
                    color: currentUser.role === 'admin' ? '#AC91F1' : '#35D6A5',
                    border: '1px solid currentColor'
                  }}
                >
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {currentUser.email} {currentUser.phone ? `· ${currentUser.phone}` : ''}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            padding: '0 24px',
            backgroundColor: 'var(--bg-primary)',
            gap: '8px'
          }}
        >
          {[
            { id: 'wallet', label: 'Token Wallet & Credits', icon: Wallet },
            { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
            { id: 'history', label: 'Execution History', icon: History },
            { id: 'settings', label: 'Profile Preferences', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: WALLET */}
          {activeTab === 'wallet' && (
            <div>
              {/* Credit Balance Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(172, 145, 241, 0.3)',
                    background: 'linear-gradient(135deg, rgba(101, 60, 161, 0.15) 0%, rgba(4, 18, 88, 0.3) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Available Platform Credits</span>
                    <Zap size={18} color="#AC91F1" />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {(wallet?.availableTrialCredits || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#35D6A5', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} />
                    Active balance ready for live model execution
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Used Platform Credits</span>
                    <History size={18} color="#F59E0B" />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {(wallet?.usedCredits || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Deducted strictly upon actual provider inference
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Reserved Credits</span>
                    <Shield size={18} color="#06B6D4" />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {(wallet?.reservedCredits || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Allocated during in-flight parallel batches
                  </div>
                </div>
              </div>

              {/* Policy & Conversion Transparency */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '24px'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Platform Credit & Provider Token Policy
                </h4>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>Zero Token Recommendations:</strong> Browsing models, analyzing prompts, opening the math explainer, and viewing rankings consumes 0 credits.</li>
                  <li><strong>Execution Deductions:</strong> Only live requests to real provider APIs deduct credits (1 platform credit = 100 provider tokens, minimum 5 credits per run).</li>
                  <li><strong>Cryptographic Response Caching:</strong> Exact duplicate prompts for the same account return verified cached responses with 0 credits deducted.</li>
                  <li><strong>Credit Separation:</strong> Fixed VeyraLabs credits are distinguishable from volatile external provider rates.</li>
                </ul>
              </div>

              {/* Recent Ledger Transactions */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Immutable Usage Ledger (Recent Transactions)
                </h4>
                {usageData?.recentLedger?.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 12px' }}>Transaction ID</th>
                          <th style={{ padding: '8px 12px' }}>Type</th>
                          <th style={{ padding: '8px 12px' }}>Target Route</th>
                          <th style={{ padding: '8px 12px' }}>Credits</th>
                          <th style={{ padding: '8px 12px' }}>Status</th>
                          <th style={{ padding: '8px 12px' }}>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageData.recentLedger.map((tx: any) => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{tx.id}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: tx.tx_type === 'INITIAL_GRANT' ? 'rgba(53, 214, 165, 0.15)' : 'rgba(101, 60, 161, 0.15)',
                                color: tx.tx_type === 'INITIAL_GRANT' ? '#35D6A5' : 'var(--accent-secondary)'
                              }}>
                                {tx.tx_type}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px' }}>{tx.model_id}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: tx.tx_type === 'INITIAL_GRANT' ? '#35D6A5' : 'var(--text-primary)' }}>
                              {tx.tx_type === 'INITIAL_GRANT' ? `+${tx.platform_credit_charge}` : `-${tx.platform_credit_charge}`}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#35D6A5' }}>{tx.status}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{tx.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No ledger transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Consumption per model */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Executions by Model Route
                  </h4>
                  {usageData?.modelBreakdown?.length > 0 ? (
                    <div style={{ height: '220px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usageData.modelBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.4} />
                          <XAxis dataKey="model" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => v.split('/')[1] || v} />
                          <YAxis stroke="var(--text-secondary)" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                          <Bar dataKey="requests" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      No execution data recorded yet.
                    </div>
                  )}
                </div>

                {/* Daily usage over time */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Daily Requests Over Time
                  </h4>
                  {usageData?.dailyHistory?.length > 0 ? (
                    <div style={{ height: '220px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usageData.dailyHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.4} />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                          <YAxis stroke="var(--text-secondary)" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                          <Bar dataKey="count" fill="#35D6A5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      No daily historical records yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search prompts or models..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleExportHistory('csv')}
                    disabled={history.length === 0}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExportHistory('json')}
                    disabled={history.length === 0}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} />
                    Export JSON
                  </button>
                </div>
              </div>

              {filteredHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredHistory.map(item => (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                            {item.model_id}
                          </span>
                          {item.cache_hit === 1 && (
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(53, 214, 165, 0.15)', color: '#35D6A5' }}>
                              ⚡ CACHE HIT (0 TOKENS)
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {item.latency_ms}ms · {item.input_tokens} in / {item.output_tokens} out · ${item.cost_estimate.toFixed(5)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Delete personal record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 500 }}>
                        <strong>Prompt:</strong> {item.prompt}
                      </div>

                      {item.response_text && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-primary)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '120px',
                            overflowY: 'auto'
                          }}
                        >
                          {item.response_text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No execution records found.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveProfile} style={{ maxWidth: '520px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Bio / Research Focus
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="e.g. LLM routing benchmarks & cost optimization"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Phone Number <span style={{ fontWeight: 400, opacity: 0.7 }}>(Saved for profile contact. No OTP required.)</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Preferred Theme
                </label>
                <select
                  value={editTheme}
                  onChange={(e) => setEditTheme(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="dark">Dark Theme (Midnight Navy)</option>
                  <option value="light">Light Theme (Lavender Mist)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Save Profile Changes
                </button>
                {saveSuccess && (
                  <span style={{ fontSize: '13px', color: '#35D6A5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={16} /> Preferences updated!
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

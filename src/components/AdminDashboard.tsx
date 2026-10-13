import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Activity, Zap, ShoppingCart, AlertCircle, CheckCircle, Ban } from 'lucide-react';
import { authService } from '../services/authService';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aData, uData] = await Promise.all([
        authService.getAdminAnalytics(),
        authService.getAdminUsers()
      ]);
      setAnalytics(aData);
      setUsers(uData.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await authService.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading platform administrator analytics from SQL database...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#F87171' }}>
        <AlertCircle size={20} style={{ marginBottom: '8px' }} />
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={24} color="#AC91F1" />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              VeyraLabs Platform Administrator Console
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time telemetry, user management, and token ledger analytics backed directly by SQLite / PostgreSQL.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Refresh Telemetry
        </button>
      </div>

      {/* Aggregate KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Registered Accounts</span>
            <Users size={18} color="#AC91F1" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics?.users?.total || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#35D6A5', marginTop: '4px' }}>
            {analytics?.users?.active || 0} Active · +{analytics?.users?.newThisWeek || 0} this week
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Model Inferences</span>
            <Activity size={18} color="#35D6A5" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics?.executions?.total || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {analytics?.executions?.success || 0} Success · {analytics?.executions?.cacheHits || 0} Cache Hits
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Platform Credits Consumed</span>
            <Zap size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {(analytics?.credits?.totalConsumed || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {(analytics?.credits?.totalAvailable || 0).toLocaleString()} Active Available
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pending QR Orders</span>
            <ShoppingCart size={18} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics?.pendingOrders || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Awaiting manual payment confirmation
          </div>
        </div>
      </div>

      {/* User Directory Table */}
      <div style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '20px', overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Registered Accounts Directory
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px 12px' }}>User ID</th>
              <th style={{ padding: '10px 12px' }}>Name & Email</th>
              <th style={{ padding: '10px 12px' }}>Role</th>
              <th style={{ padding: '10px 12px' }}>Phone (No OTP)</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
              <th style={{ padding: '10px 12px' }}>Credits Available</th>
              <th style={{ padding: '10px 12px' }}>Registered</th>
              <th style={{ padding: '10px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px' }}>{u.id}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: u.role === 'admin' ? 'rgba(172, 145, 241, 0.2)' : 'rgba(53, 214, 165, 0.2)',
                    color: u.role === 'admin' ? '#AC91F1' : '#35D6A5'
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{u.phone || '-'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: u.status === 'active' ? '#35D6A5' : '#F87171'
                  }}>
                    {u.status === 'active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                    {u.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {(u.available_trial_credits || 0).toLocaleString()}
                </td>
                <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: u.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(53, 214, 165, 0.15)',
                        color: u.status === 'active' ? '#F87171' : '#35D6A5',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

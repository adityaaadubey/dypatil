import React from 'react';
import { 
  SlidersHorizontal, 
  History, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Trophy, 
  BarChart3, 
  BookOpen, 
  Compass, 
  ShieldCheck,
  ShoppingBag,
  Coins,
  Layers,
  GitCompare
} from 'lucide-react';
import type { Model } from '../types';
import type { DataFreshnessInfo } from '../types/arena';
import { VeyraLabsLogo } from './VeyraLabsLogo';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  models: Model[];
  freshness: DataFreshnessInfo;
  onOpenJudgePanel: () => void;
  onOpenAuditLog: () => void;
  auditCount: number;
  onOpenCart: () => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  activeTab,
  onSelectTab,
  models,
  freshness,
  onOpenJudgePanel,
  onOpenAuditLog,
  auditCount,
  onOpenCart,
  cartCount
}) => {
  const downCount = models.filter((m) => m.endpointStatus === 'down').length;
  const degradedCount = models.filter((m) => m.endpointStatus === 'degraded').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Model Explorer', icon: Layers },
    { id: 'comparison', label: 'Comparison Studio', icon: GitCompare },
    { id: 'pricing', label: 'Pricing & Packages', icon: Coins },
    { id: 'leaderboard', label: 'Leaderboards', icon: Trophy },
    { id: 'analytics', label: 'Analytics & Charts', icon: BarChart3 },
    { id: 'rulebook', label: 'Model Rulebook', icon: BookOpen },
    { id: 'recommendation', label: 'Recommendation Studio', icon: Compass },
    { id: 'history', label: 'History & Cache', icon: History },
    { id: 'methodology', label: 'Methodology', icon: ShieldCheck }
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-panel)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)'
    }}>
      {/* Top Header Row */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '62px',
        gap: '16px'
      }}>
        {/* Brand / Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} 
          onClick={() => onSelectTab('overview')}
          title="veyralabs homepage"
        >
          <VeyraLabsLogo size={32} showText={true} />
          <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 6px', textTransform: 'uppercase' }}>
            AI GATEWAY
          </span>
        </div>

        {/* Global Toolbar / Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Freshness / Live Sync Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-pill)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-mint)',
              boxShadow: '0 0 6px var(--accent-mint)'
            }} />
            <span>{freshness.totalRecords} Models Live</span>
          </div>

          {/* Judge Simulator Trigger */}
          <button
            onClick={onOpenJudgePanel}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderColor: downCount > 0 || degradedCount > 0 ? 'var(--accent-amber)' : 'var(--border-subtle)'
            }}
            title="Open Judge Chaos & SLA Simulator"
          >
            <SlidersHorizontal size={13} color="var(--accent-purple)" />
            <span>Judge Testbench</span>
            {(downCount > 0 || degradedCount > 0) && (
              <span className="badge badge-amber" style={{ padding: '0 5px', fontSize: '9px' }}>
                !
              </span>
            )}
          </button>

          {/* Audit Log Trigger */}
          <button
            onClick={onOpenAuditLog}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Telemetry and routing audit ledger"
          >
            <History size={13} color="var(--accent-mint)" />
            <span>Logs</span>
            {auditCount > 0 && (
              <span style={{
                backgroundColor: 'var(--accent-purple-dim)',
                color: 'var(--accent-purple)',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600
              }}>
                {auditCount}
              </span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="btn-secondary"
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px',
              borderColor: cartCount > 0 ? 'var(--accent-purple)' : 'var(--border-subtle)'
            }}
            title="Open package shopping cart"
          >
            <ShoppingBag size={13} color="var(--accent-purple)" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span style={{
                backgroundColor: 'var(--accent-purple)',
                color: '#FFFFFF',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="btn-secondary"
            style={{ padding: '6px 10px' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="var(--accent-purple)" />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-input)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          paddingTop: '3px',
          paddingBottom: '3px'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-panel)' : 'transparent',
                  border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  borderBottom: isActive ? '2px solid var(--accent-purple)' : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={14} color={isActive ? 'var(--accent-purple)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
                {item.id === 'explorer' && (
                  <span className="badge badge-mint" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Flip Cards
                  </span>
                )}
                {item.id === 'comparison' && (
                  <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    2-Model
                  </span>
                )}
                {item.id === 'recommendation' && (
                  <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    SLA Gateway
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

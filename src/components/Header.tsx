import { 
  SlidersHorizontal, 
  History, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Trophy, 
  BookOpen, 
  Compass, 
  ShieldCheck, 
  ShoppingBag, 
  Coins, 
  Layers, 
  GitCompare, 
  Zap, 
  LogOut, 
  Sparkles, 
  ShieldAlert, 
  Play 
} from 'lucide-react';
import type { Model } from '../types';
import type { DataFreshnessInfo } from '../types/arena';
import type { User, Wallet } from '../services/authService';
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
  // Auth & Profile Integration
  currentUser: User | null;
  wallet: Wallet | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenProfile: () => void;
  onOpenLiveExec: () => void;
  onLogout: () => void;
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
  cartCount,
  currentUser,
  wallet,
  onOpenAuth,
  onOpenProfile,
  onOpenLiveExec,
  onLogout
}) => {
  const downCount = models.filter((m) => m.endpointStatus === 'down').length;
  const degradedCount = models.filter((m) => m.endpointStatus === 'degraded').length;

  // Navigation Items dynamic based on authentication state:
  // User requirement:
  // - Unauthenticated: Explore, Pricing, Docs, Arena, Compare, Analytics
  // - Authenticated: Recommendation Portal FIRST ("sabse phlaaaaaaaaaaaaaaaaaaa"), followed by Explorer, Compare, Pricing, Leaderboards, History, Docs, Admin
  const publicNavItems = [
    { id: 'explorer', label: 'Model Explorer', icon: Layers, badge: '656 Models' },
    { id: 'pricing', label: 'Pricing & Packages', icon: Coins },
    { id: 'methodology', label: 'Docs & Methodology', icon: ShieldCheck },
    { id: 'leaderboard', label: 'Arena Leaderboards', icon: Trophy },
    { id: 'comparison', label: 'Comparison Studio', icon: GitCompare },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'rulebook', label: 'Model Rulebook', icon: BookOpen }
  ];

  const authenticatedNavItems = [
    { id: 'recommendation', label: 'Recommendation Portal', icon: Compass, badge: 'SLA Gateway' },
    { id: 'explorer', label: 'Model Explorer', icon: Layers, badge: '656 Models' },
    { id: 'comparison', label: 'Comparison Studio', icon: GitCompare },
    { id: 'pricing', label: 'Pricing & Packages', icon: Coins },
    { id: 'leaderboard', label: 'Arena Leaderboards', icon: Trophy },
    { id: 'history', label: 'History & Cache', icon: History },
    { id: 'methodology', label: 'Docs & Methodology', icon: ShieldCheck },
    ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: 'Admin Console', icon: ShieldAlert, badge: 'Admin' }] : [])
  ];

  const navItems = currentUser ? authenticatedNavItems : publicNavItems;

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
        height: '64px',
        gap: '12px'
      }}>
        {/* Brand / Logo */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} 
          onClick={() => onSelectTab(currentUser ? 'recommendation' : 'explorer')}
          title="veyralabs homepage"
        >
          <VeyraLabsLogo size={34} showText={true} />
          <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 6px', textTransform: 'uppercase' }}>
            AI GATEWAY
          </span>
        </div>

        {/* Global Toolbar / Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Live Sync Pill */}
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

          {/* Live Execution Trigger Button */}
          <button
            onClick={onOpenLiveExec}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid rgba(172, 145, 241, 0.4)',
              backgroundColor: 'rgba(101, 60, 161, 0.2)',
              color: 'var(--accent-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Execute live inference prompt with Google Gemini API"
          >
            <Play size={13} fill="currentColor" />
            <span>Live Prompt API</span>
          </button>

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

          {/* Authentication & Profile Section */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Token Wallet Credit Badge */}
              <button
                onClick={onOpenProfile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(172, 145, 241, 0.4)',
                  backgroundColor: 'rgba(101, 60, 161, 0.2)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Open Token Wallet & Usage Ledger"
              >
                <Zap size={14} color="#AC91F1" />
                <span>{(wallet?.availableTrialCredits || 0).toLocaleString()} Credits</span>
              </button>

              {/* User Avatar / Profile Button */}
              <button
                onClick={onOpenProfile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Open user profile settings"
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span>{currentUser.name.split(' ')[0]}</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="btn-secondary"
                style={{ padding: '6px 10px', color: '#F87171' }}
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => onOpenAuth('login')}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, #041258 100%)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(101, 60, 161, 0.4)'
                }}
              >
                <Sparkles size={13} />
                Get 10k Credits
              </button>
            </div>
          )}

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
                {item.badge && (
                  <span className={item.id === 'recommendation' ? 'badge badge-purple' : 'badge badge-mint'} style={{ fontSize: '9px', padding: '1px 5px' }}>
                    {item.badge}
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

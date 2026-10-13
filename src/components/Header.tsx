import React, { useEffect, useRef } from 'react';
import { AnimatedTopDock } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";
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
import {
  gsap,
  prefersReducedMotion,
  animateMetricCounter,
  attachMagneticInteraction,
  triggerGlitchBurst,
   scrambleDecodeText,
} from '../utils/gsapMotion';

export function Scene() {
  return (
    <div className="shader-frame">
      <AnimatedTopDock
        variant="retro"
        pixelSize={4}
        levels={7}
        noise={1.00}
        scanlines={0.32}
        speed={1.00}
        proximity={132}
        widthGrowth={54}
      />
    </div>
  );
}

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
  const headerRef = useRef<HTMLElement | null>(null);
  const dockBridgeRef = useRef<HTMLDivElement | null>(null);
  const onlineCountRef = useRef<HTMLSpanElement | null>(null);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const downCount = models.filter((m) => m.endpointStatus === 'down').length;
  const degradedCount = models.filter((m) => m.endpointStatus === 'degraded').length;

  const publicNavItems = [
    { id: 'recommendation', code: '01', label: 'SLA Router', icon: Compass, badge: 'GATEWAY' },
    { id: 'explorer', code: '02', label: 'Model Explorer', icon: Layers, badge: '656' },
    { id: 'comparison', code: '03', label: 'Compare Studio', icon: GitCompare },
    { id: 'leaderboard', code: '04', label: 'Leaderboards', icon: Trophy },
    { id: 'analytics', code: '05', label: 'Pareto Charts', icon: SlidersHorizontal },
    { id: 'overview', code: '06', label: 'Overview', icon: LayoutDashboard },
    { id: 'pricing', code: '07', label: 'Pricing & API', icon: Coins },
    { id: 'methodology', code: '08', label: 'Docs & Math', icon: ShieldCheck },
    { id: 'rulebook', code: '09', label: 'Rulebook', icon: BookOpen },
    { id: 'history', code: '10', label: 'History & Cache', icon: History }
  ];

  const authenticatedNavItems = [
    { id: 'recommendation', code: '01', label: 'Recommendation Portal', icon: Compass, badge: 'SLA GATEWAY' },
    { id: 'explorer', code: '02', label: 'Model Explorer', icon: Layers, badge: '656' },
    { id: 'comparison', code: '03', label: 'Comparison Studio', icon: GitCompare },
    { id: 'pricing', code: '04', label: 'Pricing & Packages', icon: Coins },
    { id: 'leaderboard', code: '05', label: 'Leaderboards', icon: Trophy },
    { id: 'analytics', code: '06', label: 'Pareto Charts', icon: SlidersHorizontal },
    { id: 'overview', code: '07', label: 'Overview', icon: LayoutDashboard },
    { id: 'history', code: '08', label: 'History & Cache', icon: History },
    { id: 'methodology', code: '09', label: 'Docs & Methodology', icon: ShieldCheck },
    { id: 'rulebook', code: '10', label: 'Model Rulebook', icon: BookOpen },
    ...(currentUser?.role === 'admin' ? [{ id: 'admin', code: '11', label: 'Admin Console', icon: ShieldAlert, badge: 'ADMIN' }] : [])
  ];

  const navItems = currentUser ? authenticatedNavItems : publicNavItems;

  // Choreographed Initial Entrance Timeline for AnimatedTopDock + Command Bar + Sub-Dock
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const cleanupMagnetic = attachMagneticInteraction(headerEl);

    if (prefersReducedMotion()) {
      return () => {
        cleanupMagnetic();
      };
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      // 1. Animate ThreeUI AnimatedTopDock wrapper into view complementing its WebGL shader
      if (dockBridgeRef.current) {
        tl.fromTo(
          dockBridgeRef.current,
          {
            opacity: 0,
            y: -14,
            clipPath: 'inset(0 100% 0 0)',
          },
          {
            opacity: 1,
            y: 0,
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.72,
            clearProps: 'clipPath,transform',
          },
          0.1
        );
      }

      // 2. Brand identity & Pixel Terminal badge scramble
      tl.fromTo(
        '.header-brand-cluster',
        { opacity: 0, x: -18, filter: 'blur(4px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.55, clearProps: 'filter,transform' },
        0.22
      );

      if (badgeRef.current) {
        scrambleDecodeText(badgeRef.current, 'PIXEL TERMINAL // OS', {
          duration: 0.65,
          delay: 0.3,
        });
      }

      // 3. Command bar controls stagger with spring overshoot
      tl.fromTo(
        '.header-cmd-controls > *',
        { opacity: 0, y: -10, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          stagger: 0.045,
          ease: 'back.out(1.7)',
          clearProps: 'transform',
        },
        0.26
      );

      // 4. Sub-dock navigation cells staggered dimensional assembly
      tl.fromTo(
        '.veyra-retro-subdock__cell',
        { opacity: 0, y: 10, rotateX: -35 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.38,
          stagger: 0.03,
          ease: 'back.out(1.5)',
          clearProps: 'transform',
        },
        0.34
      );
    }, headerEl);

    return () => {
      cleanupMagnetic();
      ctx.revert();
    };
  }, [currentUser]);

  // Animate online model count telemetry whenever freshness.totalRecords updates
  useEffect(() => {
    if (onlineCountRef.current) {
      animateMetricCounter(onlineCountRef.current, freshness.totalRecords, {
        duration: 0.9,
        suffix: ' MODELS ONLINE',
      });
    }
  }, [freshness.totalRecords]);

  // Sync active state & tooltips onto the ThreeUI AnimatedTopDock (`retro`) cells + glitch pulse active subdock cell
  useEffect(() => {
    const root = dockBridgeRef.current;
    if (!root) return;

    const tabToDockIndex: Record<string, number> = {
      recommendation: 0,
      overview: 0,
      admin: 0,
      explorer: 1,
      leaderboard: 2,
      comparison: 2,
      analytics: 2,
      history: 3,
      pricing: 3,
      methodology: 4,
      rulebook: 4
    };
    const activeDockIdx = tabToDockIndex[activeTab] ?? 0;

    const dockTooltips = [
      '01 SYSTEM // SLA Router & System Intelligence',
      '02 FILES // 656+ Verified Model Catalogue',
      '03 NET // Global Arena Leaderboards & Comparison',
      '04 DISK // Request Telemetry History & API Packages',
      '05 HELP // Deterministic Math Pipeline & Rulebook'
    ];

    const items = root.querySelectorAll<HTMLButtonElement>('[data-dock-item]');
    items.forEach((btn, idx) => {
      btn.dataset.active = idx === activeDockIdx ? 'true' : 'false';
      if (dockTooltips[idx]) {
        btn.title = dockTooltips[idx];
      }
    });

    const ctaBtn = root.querySelector<HTMLButtonElement>('.atd-retro__cta');
    if (ctaBtn) {
      ctaBtn.title = 'Execute Live Multi-Provider Prompt (Gemini / Groq / OpenRouter)';
    }

    if (headerRef.current && !prefersReducedMotion()) {
      const activeSubCell = headerRef.current.querySelector<HTMLElement>(
        '.veyra-retro-subdock__cell[data-active="true"]'
      );
      if (activeSubCell) {
        triggerGlitchBurst(activeSubCell);
      }
    }
  }, [activeTab]);

  // Delegated click handler connecting ThreeUI AnimatedTopDock (`retro`) to VeyraLabs routes
  const handleRetroDockClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const cta = target.closest('.atd-retro__cta');
    if (cta) {
      onOpenLiveExec();
      return;
    }

    const brand = target.closest('.atd-retro__brand');
    if (brand) {
      onSelectTab(currentUser ? 'recommendation' : 'explorer');
      return;
    }

    const dockItem = target.closest<HTMLButtonElement>('[data-dock-item]');
    if (dockItem) {
      const label = dockItem.querySelector('.atd-retro__label')?.textContent?.trim().toUpperCase();
      if (label === 'SYSTEM') onSelectTab('recommendation');
      else if (label === 'FILES') onSelectTab('explorer');
      else if (label === 'NET') onSelectTab('leaderboard');
      else if (label === 'DISK') onSelectTab(currentUser ? 'history' : 'pricing');
      else if (label === 'HELP') onSelectTab('methodology');
    }
  };

  return (
    <header
      ref={headerRef}
      style={{
        borderBottom: '2px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        position: 'relative',
        zIndex: 50,
        boxShadow: 'var(--shadow-md)'
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ThreeUI AnimatedTopDock (`retro` / Pixel Terminal) WebGL Ordered-Dither Header Strip */}
      <div ref={dockBridgeRef} onClick={handleRetroDockClick}>
        <Scene />
      </div>

      {/* VeyraLabs Pixel Terminal System Command Bar */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '58px',
        paddingTop: '8px',
        paddingBottom: '8px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Brand / Terminal Identity */}
        <div 
          className="header-brand-cluster"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} 
          onClick={() => onSelectTab(currentUser ? 'recommendation' : 'explorer')}
          title="VEYRA//LABS Pixel Terminal Gateway"
        >
          <VeyraLabsLogo size={32} showText={true} />
          <span ref={badgeRef} className="badge badge-amber" style={{ fontSize: '9.5px', padding: '2px 7px' }}>
            PIXEL TERMINAL // OS
          </span>
        </div>

        {/* Global Hardware Terminal Controls */}
        <div className="header-cmd-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Live Telemetry Readout */}
          <div className="tabular-nums" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 10px',
            backgroundColor: 'var(--bg-input)',
            border: '2px solid var(--border-subtle)',
            boxShadow: '2px 2px 0 var(--shadow-color)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)'
          }}>
            <span className="animate-pulse-glow" style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--accent-mint)',
              boxShadow: '0 0 8px var(--accent-mint)'
            }} />
            <span ref={onlineCountRef}>{freshness.totalRecords} MODELS ONLINE</span>
          </div>

          {/* Live Execution Trigger Button */}
          <button
            type="button"
            onClick={onOpenLiveExec}
            className="btn-primary"
            style={{
              padding: '6px 13px',
              fontSize: '11px'
            }}
            title="Execute live inference prompt with Google Gemini, Groq LPU, or OpenRouter"
          >
            <Play size={11} fill="currentColor" />
            <span>LIVE PROMPT API</span>
          </button>

          {/* Judge Simulator Trigger */}
          <button
            type="button"
            onClick={onOpenJudgePanel}
            className="btn-secondary"
            style={{
              padding: '6px 11px',
              fontSize: '11px',
              borderColor: downCount > 0 || degradedCount > 0 ? 'var(--accent-amber)' : 'var(--border-subtle)'
            }}
            title="Open Judge Chaos & SLA Simulator"
          >
            <SlidersHorizontal size={12} color="var(--accent-gold)" />
            <span>JUDGE TESTBENCH</span>
            {(downCount > 0 || degradedCount > 0) && (
              <span className="badge badge-amber" style={{ padding: '0 5px', fontSize: '9px' }}>
                !
              </span>
            )}
          </button>

          {/* Audit Log Trigger */}
          <button
            type="button"
            onClick={onOpenAuditLog}
            className="btn-secondary tabular-nums"
            style={{ padding: '6px 11px', fontSize: '11px' }}
            title="Telemetry and routing audit ledger"
          >
            <History size={12} color="var(--accent-mint)" />
            <span>LOGS</span>
            {auditCount > 0 && (
              <span style={{
                backgroundColor: 'var(--dusk-3)',
                color: 'var(--accent-gold)',
                border: '1px solid var(--accent-gold)',
                padding: '0px 5px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {auditCount}
              </span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            className="btn-secondary tabular-nums"
            style={{ 
              padding: '6px 11px', 
              fontSize: '11px',
              borderColor: cartCount > 0 ? 'var(--accent-gold)' : 'var(--border-subtle)'
            }}
            title="Open package shopping cart"
          >
            <ShoppingBag size={12} color="var(--accent-coral)" />
            <span>CART</span>
            {cartCount > 0 && (
              <span style={{
                backgroundColor: 'var(--accent-coral)',
                color: '#150c28',
                padding: '0px 5px',
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
              <button
                type="button"
                onClick={onOpenProfile}
                className="btn-secondary tabular-nums"
                style={{
                  padding: '6px 11px',
                  fontSize: '11px',
                  borderColor: 'var(--accent-gold)'
                }}
                title="Open Token Wallet & Usage Ledger"
              >
                <Zap size={12} color="var(--accent-gold)" />
                <span>{(wallet?.availableTrialCredits || 0).toLocaleString()} CR</span>
              </button>

              <button
                type="button"
                onClick={onOpenProfile}
                className="btn-secondary"
                style={{
                  padding: '5px 10px',
                  fontSize: '11px'
                }}
                title="Open user profile settings"
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  backgroundColor: 'var(--accent-coral)',
                  border: '1px solid var(--border-accent-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#150c28',
                  fontSize: '10px',
                  fontWeight: 700
                }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span>{currentUser.name.split(' ')[0]}</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="btn-secondary"
                style={{ padding: '6px 9px', color: 'var(--state-danger)' }}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="btn-secondary"
                style={{ padding: '6px 11px', fontSize: '11px' }}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="btn-primary"
                style={{
                  padding: '6px 12px',
                  fontSize: '11px'
                }}
              >
                <Sparkles size={12} />
                <span>+10K CREDITS</span>
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn-secondary"
            style={{ padding: '6px 9px' }}
            title={`Switch to ${theme === 'dark' ? 'Light Paper' : 'Dark Dusk'} terminal mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={13} color="#f9c74f" /> : <Moon size={13} color="var(--accent-purple)" />}
          </button>
        </div>
      </div>

      {/* Fitted Pixel Terminal Workspace Sub-Dock */}
      <nav
        aria-label="Primary workspace navigation"
        style={{
          padding: '6px 0 12px',
          backgroundColor: 'var(--bg-primary)',
          borderTop: '2px solid var(--border-subtle)'
        }}
      >
        <div className="container">
          <div className="veyra-retro-subdock">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => onSelectTab(item.id)}
                  className="veyra-retro-subdock__cell"
                >
                  <span className="veyra-retro-subdock__index">{item.code}</span>
                  <Icon size={12} color={isActive ? 'var(--accent-gold)' : 'var(--text-secondary)'} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        backgroundColor: isActive ? '#f47b5c' : 'var(--bg-primary)',
                        color: isActive ? '#150c28' : 'var(--accent-mint)',
                        border: '1px solid currentColor',
                        fontWeight: 700
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
};

import React, { useEffect, useRef } from 'react';
import { 
  Database, 
  Building2, 
  Layers, 
  DollarSign, 
  RefreshCw, 
  Download, 
  Crown, 
  Sparkles, 
  Code, 
  Cpu, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import type { ArenaModel, DataFreshnessInfo } from '../types/arena';
import { exportToCSV, exportToJSON } from '../services/dataService';
import {
  gsap,
  prefersReducedMotion,
  animateMetricCounter,
  attachMagneticInteraction,
  attachCyberCardPhysics,
} from '../utils/gsapMotion';

interface OverviewDashboardProps {
  models: ArenaModel[];
  freshness: DataFreshnessInfo;
  onRefreshData: () => void;
  onSelectCategory?: (cat: string) => void;
  onViewModelProfile: (model: ArenaModel) => void;
  onNavigateToTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  models,
  freshness,
  onRefreshData,
  onViewModelProfile,
  onNavigateToTab
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const kpiModelsRef = useRef<HTMLDivElement | null>(null);
  const kpiProvidersRef = useRef<HTMLDivElement | null>(null);
  const kpiGroupsRef = useRef<HTMLDivElement | null>(null);
  const kpiPricingRef = useRef<HTMLDivElement | null>(null);
  const kpiOpenRef = useRef<HTMLDivElement | null>(null);

  // Compute leaders across discovered categories
  const overallLeader = models.find((m) => m.primaryCategory === 'Text / Overall' && m.rank === 1) || models[0];
  const agentLeader = models.find((m) => m.primaryCategory.includes('Agent') && m.rank === 1) || models.find((m) => m.primaryCategory.includes('Agent'));
  const webdevLeader = models.find((m) => m.primaryCategory.includes('WebDev') && m.rank === 1) || models.find((m) => m.primaryCategory.includes('WebDev'));
  const openWeightLeader = models.filter((m) => m.isOpenWeight).sort((a, b) => b.rating - a.rating)[0];

  // Top 8 Models
  const topModels = models.slice(0, 8);

  // Best Price-Performance Models (High score > 1350, cheap input price < $1.00)
  const pricePerformancePicks = models
    .filter((m) => m.inputPricePerMillion !== null && m.inputPricePerMillion <= 1.0 && m.rating >= 1340)
    .sort((a, b) => (b.rating / (b.inputPricePerMillion || 0.1)) - (a.rating / (a.inputPricePerMillion || 0.1)))
    .slice(0, 4);

  // Provider Distribution
  const providerCounts: Record<string, number> = {};
  models.forEach((m) => {
    providerCounts[m.provider] = (providerCounts[m.provider] || 0) + 1;
  });
  const topProviders = Object.entries(providerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const cleanupMagnetic = attachMagneticInteraction(el);
    const cleanupCards = attachCyberCardPhysics(el);

    animateMetricCounter(kpiModelsRef.current, freshness.totalRecords, { duration: 0.9 });
    animateMetricCounter(kpiProvidersRef.current, freshness.totalProviders, { duration: 0.85, delay: 0.05 });
    animateMetricCounter(kpiGroupsRef.current, freshness.totalCategories, { duration: 0.85, delay: 0.1 });
    animateMetricCounter(kpiPricingRef.current, freshness.recordsWithPricing, { duration: 0.9, delay: 0.15 });
    animateMetricCounter(kpiOpenRef.current, freshness.openWeightCount, { duration: 0.9, delay: 0.2 });

    if (prefersReducedMotion()) {
      return () => {
        cleanupMagnetic();
        cleanupCards();
      };
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.ov-kpi-card',
        { opacity: 0, y: 18, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.055,
          ease: 'back.out(1.7)',
          clearProps: 'transform',
        }
      );

      gsap.fromTo(
        '.ov-leader-card',
        { opacity: 0, y: 20, rotateX: -12 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.48,
          stagger: 0.065,
          delay: 0.12,
          ease: 'expo.out',
          clearProps: 'transform',
        }
      );

      gsap.fromTo(
        '.ov-top-row',
        { opacity: 0, x: -14 },
        {
          opacity: 1,
          x: 0,
          duration: 0.36,
          stagger: 0.04,
          delay: 0.18,
          ease: 'power2.out',
          clearProps: 'transform',
        }
      );
    }, el);

    return () => {
      cleanupMagnetic();
      cleanupCards();
      ctx.revert();
    };
  }, [freshness.lastSyncTimestamp, freshness.totalRecords]);

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Welcome / Hero Banner */}
      <div className="mr-card gsap-laser-sweep gsap-corner-reticle" style={{
        background: 'var(--hero-gradient)',
        borderColor: 'var(--border-accent)',
        boxShadow: 'var(--shadow-purple-glow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-purple">
                GLOBAL LEADERBOARD INTELLIGENCE
              </span>
              <span className="badge badge-mint tabular-nums">
                LIVE ARENA CATALOGUE ({freshness.totalRecords} MODELS)
              </span>
            </div>
            <h1 style={{ fontSize: '27px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              VeyraLabs AI Intelligence & Benchmark Platform
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '64ch', lineHeight: 1.6 }}>
              Multi-category AI model intelligence derived from official Arena evaluations, verified provider pricing, p95 latency telemetry, and deterministic SLA inference routing.
            </p>
          </div>

          {/* Refresh & Export Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={onRefreshData}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '7px 12px' }}
              title="Sync latest live snapshot from Arena directory"
            >
              <RefreshCw size={13} color="var(--accent-purple)" />
              Refresh Data
            </button>
            <button
              onClick={() => exportToCSV(models)}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '7px 12px' }}
              title="Export complete 650+ models catalogue to CSV"
            >
              <Download size={13} />
              Export CSV
            </button>
            <button
              onClick={() => exportToJSON(models)}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '7px 12px' }}
              title="Export complete catalogue to JSON"
            >
              <Download size={13} />
              JSON
            </button>
          </div>
        </div>

        {/* Data Freshness Indicator Strip */}
        <div style={{
          marginTop: '18px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="animate-pulse-glow" style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-mint)',
              boxShadow: '0 0 8px var(--accent-mint)'
            }} />
            <span className="tabular-nums">
              Snapshot Status: <strong style={{ color: 'var(--text-primary)' }}>{freshness.syncStatus.toUpperCase()}</strong> (Last synced: {freshness.lastSyncTimestamp})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Verified Sources: <strong style={{ color: 'var(--text-primary)' }}>Arena.ai SSR + Official Provider APIs</strong></span>
            <span>•</span>
            <span>Zero Merging of Distinct Configurations</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        <div className="mr-card ov-kpi-card" style={{ padding: '16px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Tracked Models
            </span>
            <Database size={15} color="var(--accent-purple)" />
          </div>
          <div ref={kpiModelsRef} className="tabular-nums" style={{ fontSize: '25px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {freshness.totalRecords.toLocaleString()}
          </div>
          <div className="tabular-nums" style={{ fontSize: '11.5px', color: 'var(--accent-mint)', marginTop: '2px' }}>
            656 Distinct Variants
          </div>
        </div>

        <div className="mr-card ov-kpi-card" style={{ padding: '16px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Providers
            </span>
            <Building2 size={15} color="var(--accent-mint)" />
          </div>
          <div ref={kpiProvidersRef} className="tabular-nums" style={{ fontSize: '25px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {freshness.totalProviders}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Google, Groq, OpenAI, Anthropic...
          </div>
        </div>

        <div className="mr-card ov-kpi-card" style={{ padding: '16px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Leaderboard Groups
            </span>
            <Layers size={15} color="var(--accent-amber)" />
          </div>
          <div ref={kpiGroupsRef} className="tabular-nums" style={{ fontSize: '25px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {freshness.totalCategories}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Text, Agent, Code, Vision, Media
          </div>
        </div>

        <div className="mr-card ov-kpi-card" style={{ padding: '16px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Verified Pricing
            </span>
            <DollarSign size={15} color="var(--accent-mint)" />
          </div>
          <div ref={kpiPricingRef} className="tabular-nums" style={{ fontSize: '25px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {freshness.recordsWithPricing}
          </div>
          <div className="tabular-nums" style={{ fontSize: '11.5px', color: 'var(--accent-mint)', marginTop: '2px' }}>
            {((freshness.recordsWithPricing / freshness.totalRecords) * 100).toFixed(1)}% Coverage
          </div>
        </div>

        <div className="mr-card ov-kpi-card" style={{ padding: '16px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Open-Weights
            </span>
            <Cpu size={15} color="var(--accent-purple)" />
          </div>
          <div ref={kpiOpenRef} className="tabular-nums" style={{ fontSize: '25px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {freshness.openWeightCount}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Llama, Qwen, Gemma, DeepSeek
          </div>
        </div>
      </div>

      {/* Category Leaders Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Current Category Leaders
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Highest-ranked verified models across discovered leaderboard domains.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('leaderboard')}
            className="btn-ghost"
            style={{ fontSize: '12px', color: 'var(--accent-purple)' }}
          >
            Explore Full Leaderboards <ArrowRight size={13} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {/* Leader 1: Overall Text */}
          {overallLeader && (
            <div 
              className="mr-card ov-leader-card gsap-corner-reticle" 
              onClick={() => onViewModelProfile(overallLeader)}
              style={{
                cursor: 'pointer',
                borderColor: 'var(--border-accent)',
                backgroundColor: 'var(--bg-recommended)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                  <Crown size={12} /> #1 Overall Text
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{overallLeader.provider}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {overallLeader.modelDisplayName}
              </h3>
              <div className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--accent-mint)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {overallLeader.rating} Elo
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {overallLeader.votes.toLocaleString()} votes
                </span>
              </div>
              <div className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                ${overallLeader.inputPricePerMillion}/M in • {overallLeader.variant}
              </div>
            </div>
          )}

          {/* Leader 2: Agent Leader */}
          {agentLeader && (
            <div 
              className="mr-card ov-leader-card gsap-corner-reticle" 
              onClick={() => onViewModelProfile(agentLeader)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-mint" style={{ fontSize: '10px' }}>
                  <Sparkles size={12} /> #1 Autonomous Agent
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{agentLeader.provider}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {agentLeader.modelDisplayName}
              </h3>
              <div className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--accent-mint)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {agentLeader.rating} Elo
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {agentLeader.votes.toLocaleString()} votes
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {agentLeader.variant} • Tool Use Verified
              </div>
            </div>
          )}

          {/* Leader 3: WebDev Leader */}
          {webdevLeader && (
            <div 
              className="mr-card ov-leader-card gsap-corner-reticle" 
              onClick={() => onViewModelProfile(webdevLeader)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-amber" style={{ fontSize: '10px' }}>
                  <Code size={12} /> #1 WebDev & Full-Stack
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{webdevLeader.provider}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {webdevLeader.modelDisplayName}
              </h3>
              <div className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--accent-mint)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {webdevLeader.rating} Elo
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {webdevLeader.votes.toLocaleString()} votes
                </span>
              </div>
              <div className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                ${webdevLeader.inputPricePerMillion}/M in • {webdevLeader.variant}
              </div>
            </div>
          )}

          {/* Leader 4: Best Open Weight */}
          {openWeightLeader && (
            <div 
              className="mr-card ov-leader-card gsap-corner-reticle" 
              onClick={() => onViewModelProfile(openWeightLeader)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                  <Cpu size={12} /> #1 Open-Weights
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{openWeightLeader.provider}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {openWeightLeader.modelDisplayName}
              </h3>
              <div className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--accent-mint)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {openWeightLeader.rating} Elo
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {openWeightLeader.license}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Commodity Inference • {openWeightLeader.variant}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Top 8 Leaderboard Table + Price-Performance Highlights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left: Top Models Quick Overview */}
        <div className="mr-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Top Evaluated Models (Leaderboard)
            </h3>
            <button
              onClick={() => onNavigateToTab('leaderboard')}
              className="btn-ghost"
              style={{ fontSize: '11px', color: 'var(--accent-purple)' }}
            >
              View All 656 <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topModels.map((m, idx) => (
              <div
                key={m.id}
                className="ov-top-row"
                onClick={() => onViewModelProfile(m)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '0px',
                    backgroundColor: idx === 0 ? 'var(--accent-mint-dim)' : 'var(--bg-pill)',
                    color: idx === 0 ? 'var(--accent-mint)' : 'var(--accent-gold)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: idx === 0 ? '2px solid var(--accent-mint)' : '2px solid var(--border-subtle)'
                  }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {m.modelDisplayName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {m.provider} // {m.primaryCategory}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-mint)', fontFamily: 'var(--font-mono)' }}>
                    {m.rating} ELO
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {m.votes.toLocaleString()} votes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Price-Performance & Most Evaluated Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Price-Performance Picks */}
          <div className="mr-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <TrendingUp size={16} color="var(--accent-mint)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pareto Price-Performance Highlights
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              High-tier score (&gt;1340 Elo) at commodity pricing (&lt;$1.00 / 1M input tokens):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pricePerformancePicks.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onViewModelProfile(m)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '0px',
                    backgroundColor: 'var(--bg-input)',
                    border: '2px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {m.modelDisplayName}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {m.provider} // {m.license}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-mint)' }}>
                      ${m.inputPricePerMillion}/M in
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                      {m.rating} ELO
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Representation Breakdown (Pixel Terminal Segmented Readout) */}
          <div className="mr-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Provider Representation in Catalogue
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topProviders.map(([provider, count], idx) => {
                const sharePct = ((count / models.length) * 100).toFixed(1);
                return (
                  <div
                    key={provider}
                    className="tabular-nums"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1.5px solid var(--border-subtle)',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                        0{idx + 1}
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {provider}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>
                        {count} MODELS
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        [{sharePct}%]
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

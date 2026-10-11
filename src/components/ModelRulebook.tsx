import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Download, 
  ExternalLink, 
  Eye, 
  X
} from 'lucide-react';
import type { ArenaModel } from '../types/arena';
import { exportToCSV, exportToJSON } from '../services/dataService';

interface ModelRulebookProps {
  models: ArenaModel[];
  selectedModel: ArenaModel | null;
  onSelectModel: (m: ArenaModel | null) => void;
}

export const ModelRulebook: React.FC<ModelRulebookProps> = ({
  models,
  selectedModel,
  onSelectModel
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');
  const [licenseFilter, setLicenseFilter] = useState<'All' | 'Open-Weights' | 'Proprietary'>('All');

  // Providers and families lists
  const providers = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => set.add(m.provider));
    return ['All', ...Array.from(set).sort()];
  }, [models]);

  const families = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => set.add(m.modelFamily));
    return ['All', ...Array.from(set).sort()];
  }, [models]);

  // Filter models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (selectedProvider !== 'All' && m.provider !== selectedProvider) return false;
      if (selectedFamily !== 'All' && m.modelFamily !== selectedFamily) return false;
      if (licenseFilter === 'Open-Weights' && !m.isOpenWeight) return false;
      if (licenseFilter === 'Proprietary' && m.isOpenWeight) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = m.modelDisplayName.toLowerCase().includes(q);
        const mKey = m.modelKey.toLowerCase().includes(q);
        const mProv = m.provider.toLowerCase().includes(q);
        const mFam = m.modelFamily.toLowerCase().includes(q);
        if (!mName && !mKey && !mProv && !mFam) return false;
      }
      return true;
    });
  }, [models, selectedProvider, selectedFamily, licenseFilter, searchQuery]);

  const handleDownloadRulebookMD = () => {
    let md = `# MODELROUTER OFFICIAL AI MODEL RULEBOOK\n`;
    md += `*Generated: ${new Date().toISOString()} | Total Normalized Models: ${models.length}*\n\n`;
    md += `## Governance Policy & Provenance\n`;
    md += `This Rulebook defines the canonical schema, capability boundaries, empirical rating evidence, and pricing provenance for all models tracked in the ModelRouter gateway.\n\n`;
    md += `| Rank | Model Name | Provider | Family | Variant | Elo Rating | Uncertainty | Price / 1M In | Context | License |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|\n`;
    models.slice(0, 100).forEach((m) => {
      md += `| ${m.rank} | ${m.modelDisplayName} | ${m.provider} | ${m.modelFamily} | ${m.variant} | ${m.rating} | ±${m.uncertainty} | ${m.inputPricePerMillion !== null ? `$${m.inputPricePerMillion}` : 'N/A'} | ${m.contextLength ? `${m.contextLength / 1000}K` : 'N/A'} | ${m.license} |\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MODEL-RULEBOOK.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Rulebook Header Card */}
      <div className="mr-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <BookOpen size={20} color="var(--accent-purple)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Official Model Rulebook & Registry
              </h2>
              <span className="badge badge-purple">{models.length} Normalized Models</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '750px', lineHeight: 1.6 }}>
              Comprehensive encyclopedia specifying model identity variants, crowd-preference rankings, statistical uncertainty, verified token economics, context lengths, and data limitations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadRulebookMD}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              <Download size={13} />
              Download Rulebook (MD)
            </button>
            <button
              onClick={() => exportToCSV(models, 'model_rulebook.csv')}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '7px 12px' }}
            >
              Export CSV
            </button>
            <button
              onClick={() => exportToJSON(models, 'model_rulebook.json')}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '7px 12px' }}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rulebook..."
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Provider */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            style={{
              padding: '7px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            {providers.map((p) => (
              <option key={p} value={p}>Provider: {p}</option>
            ))}
          </select>

          {/* Family */}
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            style={{
              padding: '7px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            {families.map((f) => (
              <option key={f} value={f}>Family: {f}</option>
            ))}
          </select>

          {/* License */}
          <select
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value as any)}
            style={{
              padding: '7px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
          >
            <option value="All">All Licenses</option>
            <option value="Open-Weights">Open-Weights</option>
            <option value="Proprietary">Proprietary</option>
          </select>
        </div>
      </div>

      {/* Models Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {filteredModels.slice(0, 60).map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectModel(m)}
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-purple)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                #{m.rank} {m.primaryCategory}
              </span>
              <span className={m.isOpenWeight ? 'badge badge-mint' : 'badge badge-subtle'} style={{ fontSize: '10px' }}>
                {m.license}
              </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {m.modelDisplayName}
            </h3>

            <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              slug: {m.modelKey}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              padding: '10px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              marginBottom: '12px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Score (Elo):</span>
                <div style={{ fontWeight: 700, color: 'var(--accent-mint)', fontFamily: 'var(--font-mono)' }}>
                  {m.rating} (±{m.uncertainty})
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Input Cost:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {m.inputPricePerMillion !== null ? `$${m.inputPricePerMillion}/M` : 'Unknown'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Context:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {m.contextLength ? `${m.contextLength / 1000}K tokens` : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Provider:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {m.provider}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Family: <strong>{m.modelFamily}</strong></span>
              <span style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                Rulebook Profile <Eye size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Profile Drawer / Modal */}
      {selectedModel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '20px'
        }}>
          <div 
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              backgroundColor: 'var(--bg-panel)',
              border: '1.5px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-purple">RULEBOOK PROFILE</span>
                  <span className="badge badge-mint">{selectedModel.provider}</span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {selectedModel.modelDisplayName}
                </h2>
              </div>
              <button onClick={() => onSelectModel(null)} className="btn-ghost" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Identity & Slugs Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                padding: '14px',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Exact Arena Slug:</span>
                  <div className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                    {selectedModel.modelKey}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Internal Database ID:</span>
                  <div className="font-mono" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedModel.id}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Model Family & Variant:</span>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                    {selectedModel.modelFamily} • {selectedModel.variant}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Release Lifecycle:</span>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px', textTransform: 'capitalize' }}>
                    {selectedModel.status}
                  </div>
                </div>
              </div>

              {/* Benchmarking & Ranking Evidence */}
              <div style={{
                padding: '14px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Ranking Evidence & Human Evaluations
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Overall Arena Rank:</span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-mint)' }}>
                      #{selectedModel.rank}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Elo Rating:</span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedModel.rating}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Uncertainty Spread:</span>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                      ±{selectedModel.uncertainty} CI
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Human Battles:</span>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedModel.votes.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Context */}
              <div style={{
                padding: '14px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Verified Token Economics & Attention
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Input Cost / 1M:</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedModel.inputPricePerMillion !== null ? `$${selectedModel.inputPricePerMillion.toFixed(2)}` : 'Unknown / Non-API'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Output Cost / 1M:</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedModel.outputPricePerMillion !== null ? `$${selectedModel.outputPricePerMillion.toFixed(2)}` : 'Unknown / Non-API'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Context Length:</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedModel.contextLength ? `${(selectedModel.contextLength / 1000).toLocaleString()}K tokens` : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>License:</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: selectedModel.isOpenWeight ? 'var(--accent-mint)' : 'var(--text-primary)' }}>
                      {selectedModel.license}
                    </div>
                  </div>
                </div>
              </div>

              {/* Provenance & Methodology Statement */}
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'var(--accent-purple-dim)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-primary)'
              }}>
                <strong>Provenance Audit:</strong> Sourced directly from {selectedModel.provenance.source} ({selectedModel.provenance.methodology}) recorded at {selectedModel.provenance.snapshotTimestamp}. Last verified: {selectedModel.lastVerified}.
              </div>

              {/* External Links */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <a
                  href={selectedModel.modelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ fontSize: '12px', textDecoration: 'none', padding: '8px 16px' }}
                >
                  Official Provider Documentation <ExternalLink size={13} />
                </a>
                <a
                  href={selectedModel.arenaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '12px', textDecoration: 'none', padding: '8px 16px' }}
                >
                  Arena Benchmark Page <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { ShieldCheck, Download } from 'lucide-react';
import { METHODOLOGY_DOCUMENT } from '../data/methodologyContent';

export const MethodologyView: React.FC = () => {
  const handleDownloadDoc = () => {
    let md = `# ${METHODOLOGY_DOCUMENT.title}\n`;
    md += `Version: ${METHODOLOGY_DOCUMENT.version} | Last Updated: ${METHODOLOGY_DOCUMENT.lastUpdated}\n\n`;
    METHODOLOGY_DOCUMENT.sections.forEach((sec) => {
      md += `## ${sec.title}\n\n${sec.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LEADERBOARD-METHODOLOGY.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="mr-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={20} color="var(--accent-mint)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Benchmarking Methodology & Rulebook Standards
              </h2>
              <span className="badge badge-mint">{METHODOLOGY_DOCUMENT.version}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: 1.6 }}>
              Rigorous governance principles separating crowd-sourced human preference Elo ratings from provider marketing claims, hard constraint gateways, and local latency measurements.
            </p>
          </div>

          <button
            onClick={handleDownloadDoc}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            <Download size={14} />
            Download Methodology Document (MD)
          </button>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {METHODOLOGY_DOCUMENT.sections.map((section) => (
          <div key={section.id} className="mr-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              {section.title}
            </h3>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              whiteSpace: 'pre-line'
            }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

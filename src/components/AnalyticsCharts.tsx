import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from 'recharts';
import type { ArenaModel } from '../types/arena';
import { HISTORICAL_SNAPSHOTS } from '../data/historicalSnapshots';
import { BarChart3 } from 'lucide-react';

interface AnalyticsChartsProps {
  models: ArenaModel[];
  onViewModelProfile?: (model: ArenaModel) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  models
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [displayCount, setDisplayCount] = useState<number>(10);

  // Filter models for category
  const categoryModels = useMemo(() => {
    return models
      .filter((m) => selectedCategory === 'All' || m.allCategories.includes(selectedCategory))
      .slice(0, displayCount);
  }, [models, selectedCategory, displayCount]);

  // Chart 1: Model Score Bar Chart
  const scoreBarData = useMemo(() => {
    return categoryModels.map((m) => ({
      name: m.modelDisplayName.length > 18 ? m.modelDisplayName.slice(0, 16) + '...' : m.modelDisplayName,
      fullName: m.modelDisplayName,
      rating: m.rating,
      uncertainty: m.uncertainty,
      provider: m.provider,
      raw: m
    }));
  }, [categoryModels]);

  // Chart 2: Score vs Price Scatter Plot
  const scatterData = useMemo(() => {
    return models
      .filter((m) => m.inputPricePerMillion !== null && m.rating > 1000)
      .slice(0, 45)
      .map((m) => ({
        name: m.modelDisplayName,
        price: m.inputPricePerMillion,
        rating: m.rating,
        votes: m.votes,
        provider: m.provider,
        raw: m
      }));
  }, [models]);

  // Chart 3: Price-Performance Pareto Frontier
  const paretoData = useMemo(() => {
    const valid = models.filter((m) => m.inputPricePerMillion !== null && m.rating > 1100);
    valid.sort((a, b) => (a.inputPricePerMillion || 0) - (b.inputPricePerMillion || 0));
    let maxRating = 0;
    const frontier: any[] = [];
    valid.forEach((m) => {
      if (m.rating > maxRating) {
        maxRating = m.rating;
        frontier.push({
          name: m.modelDisplayName,
          price: m.inputPricePerMillion,
          rating: m.rating,
          provider: m.provider,
          efficiency: Number((m.rating / (m.inputPricePerMillion || 0.1)).toFixed(1))
        });
      }
    });
    return frontier;
  }, [models]);

  // Chart 4: Context Window vs Price
  const contextPriceData = useMemo(() => {
    return models
      .filter((m) => m.contextLength !== null && m.inputPricePerMillion !== null)
      .slice(0, 30)
      .map((m) => ({
        name: m.modelDisplayName,
        contextK: Math.round((m.contextLength || 0) / 1000),
        price: m.inputPricePerMillion,
        provider: m.provider
      }));
  }, [models]);

  // Chart 5: Provider Distribution
  const providerDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    models.forEach((m) => {
      counts[m.provider] = (counts[m.provider] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [models]);

  // Chart 8: Historical Ranking Time-Series
  const historicalData = useMemo(() => {
    const dates = ['2026-07-01', '2026-08-15', '2026-10-11'];
    return dates.map((date) => {
      const point: any = { date };
      HISTORICAL_SNAPSHOTS.forEach((rec) => {
        const found = rec.history.find((h) => h.date === date);
        if (found) {
          point[rec.modelDisplayName] = found.rating;
        }
      });
      return point;
    });
  }, []);

  // Chart 9: Rank Movement
  const rankMovementData = useMemo(() => {
    return HISTORICAL_SNAPSHOTS.map((rec) => {
      const prev = rec.history[1]?.rank || rec.history[0]?.rank;
      const current = rec.history[2]?.rank;
      const change = prev - current; // positive = gained ranks
      return {
        name: rec.modelDisplayName,
        change,
        currentRank: current,
        prevRank: prev
      };
    });
  }, []);

  // Chart 10: Score Uncertainty
  const uncertaintyData = useMemo(() => {
    return categoryModels.slice(0, 10).map((m) => ({
      name: m.modelDisplayName.slice(0, 16),
      uncertainty: m.uncertainty,
      votes: m.votes
    }));
  }, [categoryModels]);

  // Chart 11: Open-Weight vs Proprietary Breakdown
  const licenseBreakdown = useMemo(() => {
    let openCount = 0;
    let propCount = 0;
    let openRatingSum = 0;
    let propRatingSum = 0;
    models.forEach((m) => {
      if (m.isOpenWeight) {
        openCount++;
        openRatingSum += m.rating;
      } else {
        propCount++;
        propRatingSum += m.rating;
      }
    });
    return [
      { name: 'Open-Weights', count: openCount, avgElo: Number((openRatingSum / (openCount || 1)).toFixed(1)) },
      { name: 'Proprietary', count: propCount, avgElo: Number((propRatingSum / (propCount || 1)).toFixed(1)) }
    ];
  }, [models]);

  // Chart 12: Data Quality & Completeness
  const dataQualityData = useMemo(() => {
    let withPrice = 0;
    let withContext = 0;
    let withUrl = 0;
    models.forEach((m) => {
      if (m.inputPricePerMillion !== null) withPrice++;
      if (m.contextLength !== null) withContext++;
      if (m.modelUrl) withUrl++;
    });
    return [
      { metric: 'Verified Pricing', count: withPrice, total: models.length },
      { metric: 'Context Windows', count: withContext, total: models.length },
      { metric: 'Official Documentation', count: withUrl, total: models.length }
    ];
  }, [models]);

  const COLORS = ['#653CA1', '#AC91F1', '#35D6A5', '#F59E0B', '#06B6D4', '#E879F9'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Controls */}
      <div className="mr-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="var(--accent-purple)" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Arena Benchmarking & Analytics Studio
              </h2>
              <span className="badge badge-purple">12 Deep-Dive Visualizations</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Interactive Pareto frontiers, time-series historical movements, rating distributions, and data provenance audits.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '6px 10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            >
              <option value="All">All Categories</option>
              <option value="Text / Overall">Text / Overall</option>
              <option value="Agent / Specialized">Agentic & Specialized</option>
              <option value="WebDev">WebDev</option>
              <option value="Image Generation">Image Generation</option>
              <option value="Video Generation">Video Generation</option>
            </select>

            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top:</span>
            <select
              value={displayCount}
              onChange={(e) => setDisplayCount(Number(e.target.value))}
              style={{
                padding: '6px 10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            >
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Visualizations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '24px'
      }}>
        {/* Chart 1: Model Score Bar Chart */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              1. Leaderboard Ranking Elo Bar Chart
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Highest-ranked models in {selectedCategory} with Bradley-Terry human preference Elo ratings.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBarData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" stroke="#64748B" fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(val: any) => [`${val} Elo`, 'Rating']}
                  labelFormatter={(name) => `Model: ${name}`}
                />
                <Bar dataKey="rating" fill="#9184FF" radius={[4, 4, 0, 0]}>
                  {scoreBarData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#35D6A5' : '#9184FF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Score vs Price Scatter Plot */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              2. Score vs Input Token Price Scatter Plot
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              X-axis: Verified USD Price / 1M Input Tokens • Y-axis: Arena Rating Score
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis dataKey="price" name="Price ($/1M in)" unit="$" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="rating" name="Rating" stroke="#64748B" fontSize={11} domain={['auto', 'auto']} />
                <ZAxis dataKey="votes" range={[50, 400]} name="Votes" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Scatter name="Models" data={scatterData} fill="#35D6A5" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Price-Performance Pareto Frontier */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              3. Price-Performance Pareto Efficient Frontier
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Identifies models offering non-dominated combinations of high score and minimal token cost.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paretoData} margin={{ top: 10, right: 20, bottom: 35, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(val: any) => [`${val} Elo`, 'Frontier Rating']}
                />
                <Line type="monotone" dataKey="rating" stroke="#35D6A5" strokeWidth={2.5} dot={{ r: 5, fill: '#35D6A5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Context Window vs Price */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              4. Context Window Capacity vs Price
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Compare token context limits (in thousands of tokens) against input token pricing.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contextPriceData.slice(0, 10)} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Legend />
                <Bar dataKey="contextK" name="Context (K tokens)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="price" name="Price ($/1M in)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Historical Time-Series Tracking */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              5. Longitudinal Ranking Snapshots (Time-Series)
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Historical Elo rating trajectories captured across recorded monthly snapshots.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Legend />
                {HISTORICAL_SNAPSHOTS.slice(0, 4).map((rec, idx) => (
                  <Line
                    key={rec.modelKey}
                    type="monotone"
                    dataKey={rec.modelDisplayName}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Rank Movement */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              6. Position Movements Between Comparable Snapshots
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Net rank positions gained (+) or dropped (-) since the previous comparable baseline.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankMovementData} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(val: any) => [`${val > 0 ? `+${val}` : val} positions`, 'Movement']}
                />
                <Bar dataKey="change" fill="#35D6A5" radius={[4, 4, 0, 0]}>
                  {rankMovementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.change >= 0 ? '#35D6A5' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: Provider Representation */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              7. Organization & Provider Representation
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Number of distinct evaluated model variants tracked per developing laboratory.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="count" fill="#9184FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 8: Score Uncertainty Spreads */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              8. Rating Uncertainty & Confidence Intervals
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Smaller error intervals indicate higher battle counts and stable voter consensus.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uncertaintyData} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(val: any) => [`±${val} Elo`, 'Uncertainty Interval']}
                />
                <Bar dataKey="uncertainty" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 9: Open-Weights vs Proprietary */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              9. Open-Weights vs Proprietary Elo Averages
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Mean Elo benchmark rating comparison between open-source weights and closed-weights.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={licenseBreakdown} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(val: any) => [`${val} Elo`, 'Mean Elo Rating']}
                />
                <Bar dataKey="avgElo" fill="#35D6A5" radius={[4, 4, 0, 0]}>
                  <Cell fill="#9184FF" />
                  <Cell fill="#35D6A5" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 10: Data Quality & Completeness Audit */}
        <div className="mr-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              10. Ingestion Quality & Completeness Audit
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Records with verified pricing, context lengths, and official developer endpoints.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataQualityData} layout="vertical" margin={{ top: 10, right: 20, left: 50, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider-color)" />
                <XAxis type="number" stroke="#64748B" fontSize={11} domain={[0, models.length]} />
                <YAxis type="category" dataKey="metric" stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(val: any) => [`${val} of ${models.length} (${((val / models.length) * 100).toFixed(0)}%)`, 'Coverage']}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

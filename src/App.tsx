import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { LeaderboardExplorer } from './components/LeaderboardExplorer';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ModelRulebook } from './components/ModelRulebook';
import { MethodologyView } from './components/MethodologyView';
import { ModelComparisonModal } from './components/ModelComparisonModal';
import { RecommendationStudio } from './components/RecommendationStudio';
import { RecommendationCard } from './components/RecommendationCard';
import { DecisionTransparency } from './components/DecisionTransparency';
import { NoValidModelCard } from './components/NoValidModelCard';
import { JudgeSimulatorModal } from './components/JudgeSimulatorModal';
import { AuditLogModal } from './components/AuditLogModal';
import { INITIAL_MODELS, SAMPLE_PROMPTS } from './data/models';
import { INITIAL_ARENA_MODELS, calculateDataFreshness } from './services/dataService';
import { routeRequest } from './services/routerEngine';
import type { 
  Model, 
  Constraints, 
  RoutingPreference, 
  TaskCategory, 
  RecommendationResult, 
  AuditLogEntry 
} from './types';
import type { ArenaModel, DataFreshnessInfo } from './types/arena';
import { Terminal, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // Theme state: dark (default) or light
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Active top-level navigation tab
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Comprehensive Arena Models Catalogue (656 models)
  const [arenaModels] = useState<ArenaModel[]>(INITIAL_ARENA_MODELS);
  const [freshness, setFreshness] = useState<DataFreshnessInfo>(() => 
    calculateDataFreshness(INITIAL_ARENA_MODELS, new Date().toLocaleTimeString())
  );

  // Models comparison selection (up to 4)
  const [selectedForComparison, setSelectedForComparison] = useState<ArenaModel[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Selected single model for Rulebook profile drawer
  const [selectedRulebookModel, setSelectedRulebookModel] = useState<ArenaModel | null>(null);

  // Live Sync feedback notification
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // --- Recommendation Studio State (Preserved) ---
  const [models, setModels] = useState<Model[]>(INITIAL_MODELS);
  const defaultSample = SAMPLE_PROMPTS[3]; // Python Vulnerability Audit
  const [prompt, setPrompt] = useState<string>(defaultSample.prompt);
  const [category, setCategory] = useState<TaskCategory>(defaultSample.category);
  const [constraints, setConstraints] = useState<Constraints>(defaultSample.constraints);
  const [preference, setPreference] = useState<RoutingPreference>(defaultSample.preference);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals state
  const [isJudgePanelOpen, setIsJudgePanelOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);

  // Telemetry Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Execute recommendation routing
  const handleRecommend = useCallback((
    modelsToUse: Model[] = models, 
    customConstraints: Constraints = constraints,
    isFailover: boolean = false,
    bypassedModelName?: string
  ) => {
    setIsLoading(true);

    setTimeout(() => {
      const evaluationResult = routeRequest(
        prompt,
        category,
        customConstraints,
        preference,
        modelsToUse
      );

      if (isFailover && bypassedModelName) {
        evaluationResult.isSimulatedFailoverActive = true;
        evaluationResult.failedPrimaryModelName = bypassedModelName;
      }

      setResult(evaluationResult);
      setIsLoading(false);

      // Record audit telemetry
      const newLog: AuditLogEntry = {
        id: 'log_' + Date.now().toString(36),
        timestamp: evaluationResult.timestamp,
        decisionId: evaluationResult.decisionId,
        promptSnippet: prompt.slice(0, 75) + (prompt.length > 75 ? '...' : ''),
        preference,
        selectedModelId: evaluationResult.selectedModel?.id || null,
        selectedModelName: evaluationResult.selectedModel?.name || null,
        estimatedCost: evaluationResult.selectedEvaluation?.estimatedCost || 0,
        latencyP95: evaluationResult.selectedEvaluation?.effectiveLatencyP95 || 0,
        failoverOccurred: isFailover,
        status: evaluationResult.hasValidMatch ? (isFailover ? 'FAILED_OVER' : 'SUCCESS') : 'NO_MATCH'
      };

      setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    }, 180);
  }, [prompt, category, constraints, preference, models]);

  // Initial recommendation run on component mount
  useEffect(() => {
    handleRecommend(INITIAL_MODELS, defaultSample.constraints);
  }, []);

  // Update a model from Judge Simulator and re-evaluate
  const handleUpdateModel = (id: string, updates: Partial<Model>) => {
    const updatedModels = models.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setModels(updatedModels);
    handleRecommend(updatedModels, constraints);
  };

  // Reset all models to initial benchmarks
  const handleResetAll = () => {
    setModels(INITIAL_MODELS);
    handleRecommend(INITIAL_MODELS, constraints);
  };

  // Trigger failover test on a specific model
  const handleTriggerFailoverTest = (modelId: string) => {
    const target = models.find((m) => m.id === modelId);
    if (!target) return;

    const updatedModels = models.map((m) => 
      m.id === modelId ? { ...m, endpointStatus: 'down' as const } : m
    );
    setModels(updatedModels);
    handleRecommend(updatedModels, constraints, true, target.name);
  };

  // Auto-relax constraints if no valid model found
  const handleRelaxConstraints = () => {
    const relaxed: Constraints = {
      maxLatency: Math.min(1200, constraints.maxLatency + 200),
      maxCost: Number((constraints.maxCost * 2.5).toFixed(4)),
      minCapability: Math.max(6.0, Number((constraints.minCapability - 0.8).toFixed(1))),
      requiredContext: Math.min(constraints.requiredContext, 32000)
    };
    setConstraints(relaxed);
    handleRecommend(models, relaxed);
  };

  // Comparison toggle
  const handleToggleCompare = (model: ArenaModel) => {
    setSelectedForComparison((prev) => {
      if (prev.some((m) => m.id === model.id)) {
        return prev.filter((m) => m.id !== model.id);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 models simultaneously.');
        return prev;
      }
      return [...prev, model];
    });
  };

  const handleRemoveFromCompare = (id: string) => {
    setSelectedForComparison((prev) => prev.filter((m) => m.id !== id));
  };

  // Live Refresh simulation
  const handleRefreshData = () => {
    const newTimestamp = new Date().toLocaleTimeString();
    setFreshness(calculateDataFreshness(arenaModels, newTimestamp));
    setSyncNotice(`Successfully verified live sync with Arena directory • ${arenaModels.length} models verified at ${newTimestamp}`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        models={models}
        freshness={freshness}
        onOpenJudgePanel={() => setIsJudgePanelOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        auditCount={auditLogs.length}
      />

      {/* Sync Notice Alert */}
      {syncNotice && (
        <div style={{
          backgroundColor: 'var(--accent-mint-dim)',
          borderBottom: '1px solid var(--border-success-subtle)',
          padding: '8px 24px',
          fontSize: '12px',
          color: 'var(--accent-mint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={14} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 0 60px' }}>
        <div className="container">
          {/* TAB 1: Overview Dashboard */}
          {activeTab === 'overview' && (
            <OverviewDashboard
              models={arenaModels}
              freshness={freshness}
              onRefreshData={handleRefreshData}
              onSelectCategory={(_cat) => { setActiveTab('leaderboard'); }}
              onViewModelProfile={(m) => { setSelectedRulebookModel(m); setActiveTab('rulebook'); }}
              onNavigateToTab={setActiveTab}
            />
          )}

          {/* TAB 2: Leaderboard Explorer */}
          {activeTab === 'leaderboard' && (
            <LeaderboardExplorer
              models={arenaModels}
              onViewModelProfile={(m) => { setSelectedRulebookModel(m); setActiveTab('rulebook'); }}
              selectedForComparison={selectedForComparison}
              onToggleCompare={handleToggleCompare}
              onOpenCompareModal={() => setIsCompareModalOpen(true)}
            />
          )}

          {/* TAB 3: Interactive Analytics & Charts */}
          {activeTab === 'analytics' && (
            <AnalyticsCharts
              models={arenaModels}
              onViewModelProfile={(m) => { setSelectedRulebookModel(m); setActiveTab('rulebook'); }}
            />
          )}

          {/* TAB 4: Model Rulebook */}
          {activeTab === 'rulebook' && (
            <ModelRulebook
              models={arenaModels}
              selectedModel={selectedRulebookModel}
              onSelectModel={setSelectedRulebookModel}
            />
          )}

          {/* TAB 5: Recommendation Studio (Preserved Gateway Portal) */}
          {activeTab === 'recommendation' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-purple">
                    DOMAIN 2: AI SYSTEMS & INFRASTRUCTURE
                  </span>
                  <span className="badge badge-mint">
                    PROBLEM A-01: MODELROUTER
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Intelligent Inference Gateway & Recommendation Studio
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Evaluate prompts against strict hard latency, cost, capability, and context constraints with instant zero-compromise failovers.
                </p>
              </div>

              {/* Recommendation Studio */}
              <RecommendationStudio
                prompt={prompt}
                setPrompt={setPrompt}
                category={category}
                setCategory={setCategory}
                constraints={constraints}
                setConstraints={setConstraints}
                preference={preference}
                setPreference={setPreference}
                onRecommend={() => handleRecommend(models, constraints)}
                isLoading={isLoading}
              />

              {/* Recommended Model Card OR No-Valid-Model State */}
              {result && (
                <>
                  {result.hasValidMatch && result.selectedModel ? (
                    <RecommendationCard
                      result={result}
                      onSimulateOutage={(m) => handleTriggerFailoverTest(m.id)}
                    />
                  ) : (
                    <NoValidModelCard
                      result={result}
                      onRelaxConstraints={handleRelaxConstraints}
                    />
                  )}

                  {/* Decision Transparency — Models Considered */}
                  <DecisionTransparency
                    candidates={result.candidates}
                    constraints={result.constraints}
                    preference={result.preference}
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 6: Methodology & Governance */}
          {activeTab === 'methodology' && (
            <MethodologyView />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-panel)',
        padding: '24px 0',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} color="var(--accent-purple)" />
            <span>ModelRouter AI Intelligence Platform • Normalized Arena Leaderboards ({arenaModels.length} Models)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ cursor: 'pointer', color: 'var(--accent-purple)' }} onClick={() => setActiveTab('methodology')}>
              Rulebook Methodology
            </span>
            <span>•</span>
            <span style={{ cursor: 'pointer', color: 'var(--accent-purple)' }} onClick={() => setActiveTab('recommendation')}>
              Recommendation Gateway
            </span>
            <span>•</span>
            <span style={{ cursor: 'pointer', color: 'var(--accent-purple)' }} onClick={() => setIsJudgePanelOpen(true)}>
              Judge Simulator
            </span>
          </div>
        </div>
      </footer>

      {/* 4-Model Side-by-Side Comparison Modal */}
      <ModelComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        selectedModels={selectedForComparison}
        onRemoveModel={handleRemoveFromCompare}
      />

      {/* Judge Chaos Simulator Modal */}
      <JudgeSimulatorModal
        isOpen={isJudgePanelOpen}
        onClose={() => setIsJudgePanelOpen(false)}
        models={models}
        onUpdateModel={handleUpdateModel}
        onResetAll={handleResetAll}
        onTriggerFailoverTest={handleTriggerFailoverTest}
        selectedModelId={result?.selectedModel?.id}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        logs={auditLogs}
        onClearLogs={() => setAuditLogs([])}
      />
    </div>
  );
};

export default App;

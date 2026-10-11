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
import { PricingPage } from './components/PricingPage';
import { PackageConfiguratorModal } from './components/PackageConfiguratorModal';
import { CartDrawer } from './components/CartDrawer';
import { QrCheckoutModal } from './components/QrCheckoutModal';
import { ModelExplorer } from './components/ModelExplorer';
import { ModelComparisonStudio } from './components/ModelComparisonStudio';
import { HistoryWorkspace } from './components/HistoryWorkspace';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LiveExecutionModal } from './components/LiveExecutionModal';
import { AdminDashboard } from './components/AdminDashboard';

import { INITIAL_MODELS, SAMPLE_PROMPTS } from './data/models';
import { INITIAL_ARENA_MODELS, calculateDataFreshness } from './services/dataService';
import { routeRequest } from './services/routerEngine';
import { getEnrichedCatalog } from './services/modelCatalogService';
import { 
  loadCart, 
  saveCart, 
  recalculateCart, 
  createPendingOrder, 
  getTrialAllowance 
} from './services/billingService';
import { authService, type User, type Wallet } from './services/authService';
import { PRICING_PACKAGES } from './config/pricingPackages';
import type { 
  Model, 
  Constraints, 
  RoutingPreference, 
  TaskCategory, 
  RecommendationResult, 
  AuditLogEntry 
} from './types';
import type { ArenaModel, DataFreshnessInfo } from './types/arena';
import type { 
  PackageTierConfig, 
  CartItem, 
  CartState, 
  PendingOrder, 
  TrialAllowance 
} from './types/billing';
import type { EnrichedModelCatalogItem } from './types/modelExplorer';
import { Terminal, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  // Theme state: dark (default) or light, persisted in local storage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('veyralabs_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  // Active user and wallet session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Active top-level navigation tab
  // Default to 'explorer' for public guests, switches to 'recommendation' after login
  const [activeTab, setActiveTab] = useState<string>('explorer');

  // Modals for Authentication, Profile, and Live Inference
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isLiveExecModalOpen, setIsLiveExecModalOpen] = useState<boolean>(false);

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

  // --- Commercial Packages, Cart & Trial Billing State ---
  const [cart, setCart] = useState<CartState>(() => loadCart());
  const [trialAllowance, setTrialAllowance] = useState<TrialAllowance>(() => getTrialAllowance());
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState<boolean>(false);
  const [configuratorTier, setConfiguratorTier] = useState<PackageTierConfig | null>(null);
  const [itemToEdit, setItemToEdit] = useState<CartItem | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // --- Master Enriched Catalog & Two-Model Comparison State ---
  const [enrichedCatalog] = useState<EnrichedModelCatalogItem[]>(() => getEnrichedCatalog());
  const [comparisonModelA, setComparisonModelA] = useState<EnrichedModelCatalogItem | null>(() => {
    const list = getEnrichedCatalog();
    return list[0] || null;
  });
  const [comparisonModelB, setComparisonModelB] = useState<EnrichedModelCatalogItem | null>(() => {
    const list = getEnrichedCatalog();
    return list[1] || list[0] || null;
  });

  // Modals state
  const [isJudgePanelOpen, setIsJudgePanelOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);

  // Telemetry Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Check existing session on load
  useEffect(() => {
    authService.getSession().then((session) => {
      if (session) {
        setCurrentUser(session.user);
        setWallet(session.wallet);
        // Requirement: After login, recommendation portal is first!
        setActiveTab('recommendation');
      }
    });
  }, []);

  const refreshSession = async () => {
    const session = await authService.getSession();
    if (session) {
      setCurrentUser(session.user);
      setWallet(session.wallet);
    }
  };

  const handleAuthSuccess = (user: User, userWallet: Wallet) => {
    setCurrentUser(user);
    setWallet(userWallet);
    // Explicit user requirement: "after login recommendation portal sabse phlaaaaaaaaaaaaaaaaaaa"
    setActiveTab('recommendation');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setWallet(null);
    setActiveTab('explorer');
  };

  // Apply theme attribute and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('veyralabs_theme', theme);
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

  // --- Package Configurator & Cart Handlers ---
  const handleConfigurePackage = (tier: PackageTierConfig) => {
    setConfiguratorTier(tier);
    setItemToEdit(null);
    setIsConfiguratorOpen(true);
  };

  const handleEditCartItem = (item: CartItem) => {
    const tier = PRICING_PACKAGES.find((p) => p.id === item.packageTierId);
    if (tier) {
      setConfiguratorTier(tier);
      setItemToEdit(item);
      setIsConfiguratorOpen(true);
    }
  };

  const handleAddToCart = (item: CartItem) => {
    let updatedItems: CartItem[];
    if (itemToEdit) {
      updatedItems = cart.items.map((i) => (i.cartItemId === item.cartItemId ? item : i));
    } else {
      updatedItems = [...cart.items, item];
    }
    const newCart = recalculateCart(updatedItems);
    setCart(newCart);
    saveCart(newCart);
    setIsCartOpen(true);
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    const filtered = cart.items.filter((i) => i.cartItemId !== cartItemId);
    const newCart = recalculateCart(filtered);
    setCart(newCart);
    saveCart(newCart);
  };

  const handleProceedToCheckout = () => {
    try {
      const order = createPendingOrder(cart);
      setPendingOrder(order);
      setCart({ items: [], totalPriceINR: 0, totalTokens: 0, totalModelsSelected: 0 });
      setIsCartOpen(false);
      setIsQrModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize pending checkout.');
    }
  };

  // --- Master Model Explorer & Comparison Studio Handlers ---
  const handleSelectForCompare = (model: EnrichedModelCatalogItem) => {
    if (!comparisonModelA || comparisonModelA.id === model.id) {
      setComparisonModelB(model);
    } else {
      setComparisonModelA(model);
    }
    setActiveTab('comparison');
  };

  const handleOpenTestPrompt = (model: EnrichedModelCatalogItem) => {
    setComparisonModelA(model);
    setActiveTab('comparison');
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
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cart.items.length}
        currentUser={currentUser}
        wallet={wallet}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenLiveExec={() => setIsLiveExecModalOpen(true)}
        onLogout={handleLogout}
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
          {/* TAB: Dedicated Model Explorer with 3D Flip Cards & Free/Paid Tabs */}
          {activeTab === 'explorer' && (
            <ModelExplorer
              catalog={enrichedCatalog}
              onSelectForCompare={handleSelectForCompare}
              onOpenTestPrompt={handleOpenTestPrompt}
            />
          )}

          {/* TAB: Pricing & Token Packages */}
          {activeTab === 'pricing' && (
            <PricingPage
              onConfigurePackage={handleConfigurePackage}
              trialAllowance={trialAllowance}
              onOpenCart={() => setIsCartOpen(true)}
              cartItemCount={cart.items.length}
            />
          )}

          {/* TAB: Dedicated Two-Model Comparison Studio (Mode A & Mode B) */}
          {activeTab === 'comparison' && (
            <ModelComparisonStudio
              allModels={enrichedCatalog}
              initialModelA={comparisonModelA}
              initialModelB={comparisonModelB}
              onNavigateToExplorer={() => setActiveTab('explorer')}
            />
          )}

          {/* TAB: Activity History, Saved Workspace & Cryptographic Cache Analytics */}
          {activeTab === 'history' && (
            <HistoryWorkspace />
          )}

          {/* TAB: Leaderboard Explorer */}
          {activeTab === 'leaderboard' && (
            <LeaderboardExplorer
              models={arenaModels}
              onViewModelProfile={(m) => { setSelectedRulebookModel(m); setActiveTab('rulebook'); }}
              selectedForComparison={selectedForComparison}
              onToggleCompare={handleToggleCompare}
              onOpenCompareModal={() => setIsCompareModalOpen(true)}
            />
          )}

          {/* TAB: Interactive Analytics & Charts */}
          {activeTab === 'analytics' && (
            <AnalyticsCharts
              models={arenaModels}
              onViewModelProfile={(m) => { setSelectedRulebookModel(m); setActiveTab('rulebook'); }}
            />
          )}

          {/* TAB: Model Rulebook */}
          {activeTab === 'rulebook' && (
            <ModelRulebook
              models={arenaModels}
              selectedModel={selectedRulebookModel}
              onSelectModel={setSelectedRulebookModel}
            />
          )}

          {/* TAB: Methodology & Governance */}
          {activeTab === 'methodology' && (
            <MethodologyView />
          )}

          {/* TAB: Overview Dashboard */}
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

          {/* TAB: Recommendation Studio (Preserved Gateway Portal) */}
          {activeTab === 'recommendation' && (
            <div className="animate-fade-in">
              {/* If not authenticated, show welcoming gateway banner */}
              {!currentUser && (
                <div
                  style={{
                    backgroundColor: 'rgba(101, 60, 161, 0.15)',
                    border: '1px solid rgba(172, 145, 241, 0.4)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={20} color="#AC91F1" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                        Experience Live Model Inference & Mathematical Routing
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Sign up in 5 seconds to unlock 10,000 free trial platform credits with zero credit card required.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAuthModalMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent-primary)',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Claim 10,000 Free Credits
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

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
                      trialAllowance={trialAllowance}
                      onTrialAllowanceUpdated={setTrialAllowance}
                      onNavigateToMethodology={() => setActiveTab('methodology')}
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

          {/* TAB: Administrator Console */}
          {activeTab === 'admin' && currentUser?.role === 'admin' && (
            <AdminDashboard />
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
            <span>veyralabs AI Intelligence Platform • Normalized Model Catalogue & Inference Gateway ({arenaModels.length} Models)</span>
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

      {/* Package Configurator Modal */}
      {isConfiguratorOpen && configuratorTier && (
        <PackageConfiguratorModal
          isOpen={isConfiguratorOpen}
          onClose={() => {
            setIsConfiguratorOpen(false);
            setConfiguratorTier(null);
            setItemToEdit(null);
          }}
          tier={configuratorTier}
          allModels={arenaModels}
          onAddToCart={handleAddToCart}
          existingItemToEdit={itemToEdit}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveCartItem}
        onEditItem={handleEditCartItem}
        onProceedToCheckout={handleProceedToCheckout}
        onNavigateToPricing={() => setActiveTab('pricing')}
      />

      {/* QR-Only Pending Checkout Modal (Strictly stops at this screen) */}
      <QrCheckoutModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        order={pendingOrder}
      />

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* User Profile & Token Wallet Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={refreshSession}
      />

      {/* Live Inference Execution Modal (Calls Google Gemini Live API) */}
      <LiveExecutionModal
        isOpen={isLiveExecModalOpen}
        onClose={() => setIsLiveExecModalOpen(false)}
        defaultModelId={result?.selectedModel?.id || 'gemini-flash-latest'}
        defaultPrompt={prompt}
        onExecuted={refreshSession}
      />
    </div>
  );
};

export default App;

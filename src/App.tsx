import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header, Scene } from './components/Header';
export { Scene };
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
import { ModelDetailModal } from './components/ModelDetailModal';
import { ModelComparisonStudio } from './components/ModelComparisonStudio';
import { HistoryWorkspace } from './components/HistoryWorkspace';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LiveExecutionModal } from './components/LiveExecutionModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TerminalBootSequence } from './components/TerminalBootSequence';
import {
  gsap,
  ScrollTrigger,
  prefersReducedMotion,
  splitAndAnimateHeading,
  attachMagneticInteraction,
  attachCyberCardPhysics,
} from './utils/gsapMotion';

import { INITIAL_MODELS, SAMPLE_PROMPTS } from './data/models';
import { INITIAL_ARENA_MODELS, calculateDataFreshness } from './services/dataService';
import { routeRequest } from './services/routerEngine';
import { fetchLiveCatalogue } from './services/inferenceService';
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
  const mainWorkspaceRef = useRef<HTMLElement | null>(null);
  const transitionLaserRef = useRef<HTMLDivElement | null>(null);
  // Theme state: dark Pixel Terminal (default) or light paper terminal, persisted in local storage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('veyralabs_theme');
    if (saved === 'light' || saved === 'dark') return saved;
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

  // Initial recommendation run on component mount + sync live Gemini & Groq models into candidate pool
  useEffect(() => {
    handleRecommend(INITIAL_MODELS, defaultSample.constraints);
    fetchLiveCatalogue().then((liveModels) => {
      if (Array.isArray(liveModels) && liveModels.length > 0) {
        setModels(liveModels);
        handleRecommend(liveModels, defaultSample.constraints);
      }
    });
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

  // Global Model Detail Profile Modal State (Leaderboard, Overview, Analytics, Explorer)
  const [selectedDetailModel, setSelectedDetailModel] = useState<EnrichedModelCatalogItem | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('veyralabs_favs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleOpenModelDetail = (m: ArenaModel | EnrichedModelCatalogItem) => {
    if ('accessTier' in m && 'capabilities' in m) {
      setSelectedDetailModel(m as EnrichedModelCatalogItem);
      return;
    }
    const match = enrichedCatalog.find((em) => 
      em.id === m.id || 
      em.modelKey === (m as ArenaModel).modelKey || 
      em.name.toLowerCase() === (m as ArenaModel).modelDisplayName.toLowerCase()
    );
    if (match) {
      setSelectedDetailModel(match);
    } else {
      setSelectedDetailModel(enrichedCatalog[0] || null);
    }
  };

  // Coordinated GSAP View Transition, Kinetic Headings, ScrollTrigger Reveals & Interactive Physics
  useEffect(() => {
    const mainEl = mainWorkspaceRef.current;
    if (!mainEl) return;

    const cleanupMagnetic = attachMagneticInteraction(mainEl);
    const cleanupCards = attachCyberCardPhysics(mainEl);

    if (prefersReducedMotion()) {
      return () => {
        cleanupMagnetic();
        cleanupCards();
      };
    }

    const ctx = gsap.context(() => {
      // 1. Horizontal laser scanline flash across top of active workspace
      if (transitionLaserRef.current) {
        gsap.fromTo(
          transitionLaserRef.current,
          { scaleX: 0, opacity: 1, transformOrigin: 'left center' },
          {
            scaleX: 1,
            opacity: 0,
            duration: 0.55,
            ease: 'expo.out',
          }
        );
      }

      // 2. Primary view heading character-level kinetic reveal
      const primaryHeading = mainEl.querySelector<HTMLElement>('h1, h2');
      if (primaryHeading) {
        splitAndAnimateHeading(primaryHeading, {
          duration: 0.38,
          stagger: 0.012,
          y: 12,
        });
      }

      // 3. Staggered badge / status pill entrance
      const badges = mainEl.querySelectorAll<HTMLElement>('.badge');
      if (badges.length > 0) {
        gsap.fromTo(
          Array.from(badges).slice(0, 12),
          { opacity: 0, scale: 0.86, y: -6 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.32,
            stagger: 0.03,
            ease: 'back.out(1.9)',
            clearProps: 'transform',
          }
        );
      }

      // 4. Viewport panels (.mr-card) dimensional entrance with clip-path & blur-to-sharp
      const allPanels = Array.from(mainEl.querySelectorAll<HTMLElement>('.mr-card'));
      const aboveFoldPanels = allPanels.slice(0, 6);
      const belowFoldPanels = allPanels.slice(6);

      if (aboveFoldPanels.length > 0) {
        gsap.fromTo(
          aboveFoldPanels,
          {
            opacity: 0,
            y: 22,
            scale: 0.985,
            filter: 'blur(5px)',
            clipPath: 'inset(0 0 18% 0)',
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            clipPath: 'inset(0 0 0% 0)',
            duration: 0.52,
            stagger: 0.065,
            ease: 'expo.out',
            clearProps: 'filter,clipPath,transform',
          }
        );
      }

      // 5. ScrollTrigger batch choreography for lower panels & sections
      if (belowFoldPanels.length > 0) {
        ScrollTrigger.batch(belowFoldPanels, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 26, scale: 0.98, filter: 'blur(4px)' },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.5,
                stagger: 0.06,
                ease: 'expo.out',
                clearProps: 'filter,transform',
              }
            );
          },
        });
      }

      ScrollTrigger.refresh();
    }, mainEl);

    return () => {
      cleanupMagnetic();
      cleanupCards();
      ctx.revert();
    };
  }, [activeTab]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Cinematic First-Load Pixel Terminal Boot Sequence (Fast & Skippable) */}
      <TerminalBootSequence totalModelsCount={freshness.totalRecords} />

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
      <main
        id="main-content"
        ref={mainWorkspaceRef}
        style={{ flex: 1, padding: '32px 0 68px', position: 'relative' }}
      >
        {/* Route Transition Laser Indicator */}
        <div
          ref={transitionLaserRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background:
              'linear-gradient(90deg, var(--accent-purple), var(--accent-gold), var(--accent-coral))',
            boxShadow: '0 0 16px var(--accent-gold)',
            pointerEvents: 'none',
            opacity: 0,
            zIndex: 20,
          }}
        />
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
              onViewModelProfile={handleOpenModelDetail}
              selectedForComparison={selectedForComparison}
              onToggleCompare={handleToggleCompare}
              onOpenCompareModal={() => setIsCompareModalOpen(true)}
            />
          )}

          {/* TAB: Interactive Analytics & Charts */}
          {activeTab === 'analytics' && (
            <AnalyticsCharts
              models={arenaModels}
              onViewModelProfile={handleOpenModelDetail}
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
              onViewModelProfile={handleOpenModelDetail}
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
                    backgroundColor: 'var(--accent-purple-dim)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    marginBottom: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={20} color="var(--accent-purple)" />
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
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    className="btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px'
                    }}
                  >
                    <span>Claim 10,000 Free Credits</span>
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
                result={result}
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

                  {/* Decision Transparency // Models Considered */}
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

      {/* Pixel Terminal Status Footer */}
      <footer style={{
        borderTop: '2px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        padding: '18px 0 22px',
        fontSize: '11.5px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} color="var(--accent-gold)" />
            <span className="tabular-nums" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              VEYRA//LABS PIXEL TERMINAL • ORDERED-DITHER SLA ROUTER & GATEWAY ({arenaModels.length} MODELS)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setActiveTab('methodology')}>
              Rulebook Methodology
            </button>
            <span style={{ color: 'var(--text-muted)' }}>//</span>
            <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setActiveTab('recommendation')}>
              Recommendation Gateway
            </button>
            <span style={{ color: 'var(--text-muted)' }}>//</span>
            <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setIsJudgePanelOpen(true)}>
              Judge Simulator
            </button>
            <span style={{ color: 'var(--text-muted)' }}>//</span>
            <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setActiveTab('methodology')} title="Data Governance & Privacy Policy">
              Privacy Policy
            </button>
            <span style={{ color: 'var(--text-muted)' }}>//</span>
            <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setActiveTab('rulebook')} title="Platform SLA & Terms of Service">
              Terms of Service
            </button>
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

      {/* Global Model Detail Modal (Available across Leaderboards, Overview, Analytics, Explorer) */}
      <ModelDetailModal
        isOpen={Boolean(selectedDetailModel)}
        onClose={() => setSelectedDetailModel(null)}
        model={selectedDetailModel}
        isFavorite={selectedDetailModel ? favouriteIds.includes(selectedDetailModel.id) : false}
        onToggleFavorite={(id) => {
          setFavouriteIds((prev) => {
            const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
            try {
              localStorage.setItem('veyralabs_favs', JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }}
        onSelectForCompare={handleSelectForCompare}
        onOpenTestPrompt={handleOpenTestPrompt}
      />
    </div>
  );
};

export default App;

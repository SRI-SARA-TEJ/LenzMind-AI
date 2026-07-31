/**
 * analytics/context/AnalyticsContext.jsx
 *
 * All Creator Analytics Intelligence state in one place.
 *
 * State:
 *   loadState         — 'idle' | 'loading' | 'loaded' | 'error'
 *   sessions          — all AnalyticsSession records
 *   qualityHistory    — QualityMetric[]  (one per editing session)
 *   weeklyPerformance — PerformanceMetric[] (weekly aggregates)
 *   monthlyPerformance— PerformanceMetric[] (monthly aggregates)
 *   recommendationHistory — RecommendationMetric[]
 *   workflowMetrics   — WorkflowMetric[]
 *   platformMetrics   — PlatformMetric[]
 *   editingMetrics    — EditingMetric[]
 *   growthHistory     — GrowthMetric[]
 *   insights          — AnalyticsInsight[]
 *   statistics        — AnalyticsStatistics
 *   activeView        — which tab is shown
 *
 * Actions:
 *   LOAD_ANALYTICS    — hydrate all data (simulates async)
 *   ADD_SESSION       — append a new AnalyticsSession
 *   UPDATE_METRICS    — patch statistics object
 *   ADD_INSIGHT       — push a new AI insight
 *   DISMISS_INSIGHT   — mark an insight dismissed by id
 *   SET_ACTIVE_VIEW   — switch the dashboard tab
 *   RESET_ANALYTICS   — reset to initial state
 *   SET_LOADING       — set loadState = 'loading'
 *   SET_ERROR         — set loadState = 'error' with message
 *
 * Derived values (memoised):
 *   avgQualityScore         totalAIAccepted
 *   avgImprovementDelta     overallAcceptanceRate
 *   mostUsedWorkflow        bestPerformingPlatform
 *   recentSessions          weeklyTrend / monthlyTrend
 *   creatorScore / growthScore
 *   activeInsights          latestGrowth
 *
 * [AI_FUTURE] — IBM watsonx.ai will populate insights and scores via real API.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';

import {
  MOCK_ANALYTICS_SESSIONS,
  MOCK_QUALITY_HISTORY,
  MOCK_WEEKLY_PERFORMANCE,
  MOCK_MONTHLY_PERFORMANCE,
  MOCK_RECOMMENDATION_HISTORY,
  MOCK_WORKFLOW_METRICS,
  MOCK_PLATFORM_METRICS,
  MOCK_EDITING_METRICS,
  MOCK_GROWTH_HISTORY,
  MOCK_ANALYTICS_INSIGHTS,
  MOCK_ANALYTICS_STATISTICS,
} from '../data/mockAnalyticsData';

import {
  createBlankAnalyticsSession,
  createBlankAnalyticsInsight,
} from '../models/analyticsModel';

// ── Action type constants ─────────────────────────────────────────────────────
const A = {
  LOAD_ANALYTICS:  'LOAD_ANALYTICS',
  ADD_SESSION:     'ADD_SESSION',
  UPDATE_METRICS:  'UPDATE_METRICS',
  ADD_INSIGHT:     'ADD_INSIGHT',
  DISMISS_INSIGHT: 'DISMISS_INSIGHT',
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  RESET_ANALYTICS: 'RESET_ANALYTICS',
  SET_LOADING:     'SET_LOADING',
  SET_ERROR:       'SET_ERROR',
};

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  loadState:             'idle',   // 'idle' | 'loading' | 'loaded' | 'error'
  errorMessage:          null,

  sessions:              [],
  qualityHistory:        [],
  weeklyPerformance:     [],
  monthlyPerformance:    [],
  recommendationHistory: [],
  workflowMetrics:       [],
  platformMetrics:       [],
  editingMetrics:        [],
  growthHistory:         [],
  insights:              [],
  statistics:            null,

  activeView:            'dashboard', // 'dashboard' | 'performance' | 'insights' | 'workflows' | 'platforms'
};

// ── Priority sort order ───────────────────────────────────────────────────────
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Hydrate all analytics data ────────────────────────────────────────────
    case A.LOAD_ANALYTICS: {
      const p = action.payload;
      return {
        ...state,
        loadState:             'loaded',
        errorMessage:          null,
        sessions:              p.sessions              ?? state.sessions,
        qualityHistory:        p.qualityHistory        ?? state.qualityHistory,
        weeklyPerformance:     p.weeklyPerformance     ?? state.weeklyPerformance,
        monthlyPerformance:    p.monthlyPerformance    ?? state.monthlyPerformance,
        recommendationHistory: p.recommendationHistory ?? state.recommendationHistory,
        workflowMetrics:       p.workflowMetrics       ?? state.workflowMetrics,
        platformMetrics:       p.platformMetrics       ?? state.platformMetrics,
        editingMetrics:        p.editingMetrics        ?? state.editingMetrics,
        growthHistory:         p.growthHistory         ?? state.growthHistory,
        insights:              p.insights              ?? state.insights,
        statistics:            p.statistics            ?? state.statistics,
      };
    }

    // ── Prepend a new session ─────────────────────────────────────────────────
    case A.ADD_SESSION: {
      const newSession = { ...createBlankAnalyticsSession(), ...action.payload };
      return {
        ...state,
        sessions: [newSession, ...state.sessions],
      };
    }

    // ── Patch statistics ──────────────────────────────────────────────────────
    case A.UPDATE_METRICS: {
      return {
        ...state,
        statistics: state.statistics
          ? { ...state.statistics, ...action.payload }
          : action.payload,
      };
    }

    // ── Push a new insight ────────────────────────────────────────────────────
    case A.ADD_INSIGHT: {
      const insight = { ...createBlankAnalyticsInsight(), ...action.payload };
      return { ...state, insights: [insight, ...state.insights] };
    }

    // ── Dismiss insight by id ─────────────────────────────────────────────────
    case A.DISMISS_INSIGHT: {
      const updated = state.insights.map(ins =>
        ins.id === action.payload ? { ...ins, dismissed: true } : ins
      );
      return { ...state, insights: updated };
    }

    // ── Switch active view ────────────────────────────────────────────────────
    case A.SET_ACTIVE_VIEW:
      return { ...state, activeView: action.payload };

    // ── Reset to blank slate ──────────────────────────────────────────────────
    case A.RESET_ANALYTICS:
      return { ...initialState };

    // ── Loading ───────────────────────────────────────────────────────────────
    case A.SET_LOADING:
      return { ...state, loadState: 'loading', errorMessage: null };

    // ── Error ─────────────────────────────────────────────────────────────────
    case A.SET_ERROR:
      return { ...state, loadState: 'error', errorMessage: action.payload ?? 'Unknown error.' };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived value helpers
// ─────────────────────────────────────────────────────────────────────────────

function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function mostCommon(arr) {
  if (!arr || arr.length === 0) return null;
  const freq = {};
  arr.forEach(v => { if (v) freq[v] = (freq[v] ?? 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const AnalyticsContext = createContext(null);

export function AnalyticsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Derived values ────────────────────────────────────────────────────────

  const avgQualityScore = useMemo(() => {
    const scores = state.sessions
      .map(s => s.qualityScoreAfter)
      .filter(n => n != null);
    return avg(scores);
  }, [state.sessions]);

  const avgImprovementDelta = useMemo(() => {
    const deltas = state.sessions
      .filter(s => s.improvementDelta > 0)
      .map(s => s.improvementDelta);
    return avg(deltas);
  }, [state.sessions]);

  const overallAcceptanceRate = useMemo(() => {
    const totalRecs = state.sessions.reduce((sum, s) => sum + (s.aiRecommendations ?? 0), 0);
    const totalAcc  = state.sessions.reduce((sum, s) => sum + (s.aiAccepted ?? 0), 0);
    return totalRecs > 0 ? Math.round((totalAcc / totalRecs) * 100) : 0;
  }, [state.sessions]);

  const totalAIAccepted = useMemo(
    () => state.sessions.reduce((sum, s) => sum + (s.aiAccepted ?? 0), 0),
    [state.sessions]
  );

  const mostUsedWorkflow = useMemo(() => {
    if (!state.workflowMetrics.length) return null;
    return [...state.workflowMetrics].sort((a, b) => b.usageCount - a.usageCount)[0];
  }, [state.workflowMetrics]);

  const bestPerformingPlatform = useMemo(() => {
    const active = state.platformMetrics.filter(p => p.exportCount > 0);
    if (!active.length) return null;
    return [...active].sort((a, b) => b.avgQualityScore - a.avgQualityScore)[0];
  }, [state.platformMetrics]);

  const recentSessions = useMemo(
    () => [...state.sessions]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10),
    [state.sessions]
  );

  const weeklyTrend = useMemo(
    () => state.statistics?.weeklyTrend ?? 'flat',
    [state.statistics]
  );

  const monthlyTrend = useMemo(
    () => state.statistics?.monthlyTrend ?? 'flat',
    [state.statistics]
  );

  const creatorScore = useMemo(() => {
    if (state.growthHistory.length === 0) return 0;
    return [...state.growthHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.creatorScore ?? 0;
  }, [state.growthHistory]);

  const growthScore = useMemo(() => {
    if (state.growthHistory.length < 2) return 0;
    const sorted = [...state.growthHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0].creatorScore - sorted[sorted.length - 1].creatorScore;
  }, [state.growthHistory]);

  const latestGrowth = useMemo(() => {
    if (!state.growthHistory.length) return null;
    return [...state.growthHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }, [state.growthHistory]);

  const activeInsights = useMemo(
    () => state.insights
      .filter(i => !i.dismissed)
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)),
    [state.insights]
  );

  // ── Action creators ───────────────────────────────────────────────────────

  /** Simulate async load — hydrates all mock data. [AI_FUTURE] replace with real API. */
  const loadAnalytics = useCallback(() => {
    dispatch({ type: A.SET_LOADING });
    setTimeout(() => {
      dispatch({
        type:    A.LOAD_ANALYTICS,
        payload: {
          sessions:              MOCK_ANALYTICS_SESSIONS,
          qualityHistory:        MOCK_QUALITY_HISTORY,
          weeklyPerformance:     MOCK_WEEKLY_PERFORMANCE,
          monthlyPerformance:    MOCK_MONTHLY_PERFORMANCE,
          recommendationHistory: MOCK_RECOMMENDATION_HISTORY,
          workflowMetrics:       MOCK_WORKFLOW_METRICS,
          platformMetrics:       MOCK_PLATFORM_METRICS,
          editingMetrics:        MOCK_EDITING_METRICS,
          growthHistory:         MOCK_GROWTH_HISTORY,
          insights:              MOCK_ANALYTICS_INSIGHTS,
          statistics:            MOCK_ANALYTICS_STATISTICS,
        },
      });
    }, 600);
  }, []);

  const addSession = useCallback(
    (data) => dispatch({ type: A.ADD_SESSION, payload: data }),
    []
  );

  const updateMetrics = useCallback(
    (patch) => dispatch({ type: A.UPDATE_METRICS, payload: patch }),
    []
  );

  const addInsight = useCallback(
    (data) => dispatch({ type: A.ADD_INSIGHT, payload: data }),
    []
  );

  const dismissInsight = useCallback(
    (id) => dispatch({ type: A.DISMISS_INSIGHT, payload: id }),
    []
  );

  const setActiveView = useCallback(
    (view) => dispatch({ type: A.SET_ACTIVE_VIEW, payload: view }),
    []
  );

  const resetAnalytics = useCallback(
    () => dispatch({ type: A.RESET_ANALYTICS }),
    []
  );

  const setError = useCallback(
    (msg) => dispatch({ type: A.SET_ERROR, payload: msg }),
    []
  );

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    // Raw state
    state,

    // Derived values
    avgQualityScore,
    avgImprovementDelta,
    overallAcceptanceRate,
    totalAIAccepted,
    mostUsedWorkflow,
    bestPerformingPlatform,
    recentSessions,
    weeklyTrend,
    monthlyTrend,
    creatorScore,
    growthScore,
    latestGrowth,
    activeInsights,

    // Action creators
    loadAnalytics,
    addSession,
    updateMetrics,
    addInsight,
    dismissInsight,
    setActiveView,
    resetAnalytics,
    setError,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return ctx;
}

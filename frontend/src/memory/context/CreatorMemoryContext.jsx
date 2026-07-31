/**
 * memory/context/CreatorMemoryContext.jsx
 *
 * All Creator Memory Intelligence state in one place.
 *
 * This context holds everything IBM watsonx.ai knows about the creator:
 *   - Profile & statistics
 *   - Session history (20+ sessions)
 *   - Learned preferences
 *   - Detected behavioural patterns
 *   - AI-generated insights
 *   - Creator milestones
 *   - Favourite workflows, editing styles, camera styles
 *
 * Actions handled by the reducer:
 *   LOAD_MEMORY       — hydrate state from mock data (simulates async load)
 *   ADD_SESSION       — append a completed session to history
 *   UPDATE_PROFILE    — patch the creator profile
 *   UPDATE_PREFERENCES — patch one or more learned preferences
 *   ADD_INSIGHT       — push a new AI-generated insight
 *   MARK_MILESTONE    — mark a milestone as achieved
 *   CLEAR_MEMORY      — wipe all data (opt-out support)
 *   RESET_MEMORY      — reset to initial state (dev helper)
 *   SET_LOADING       — toggle loading state
 *   SET_ERROR         — record a load/save error
 *
 * Derived values computed in the provider (memoised):
 *   creatorStats       — aggregate statistics across all sessions
 *   mostUsedWorkflow   — top workflow by usageCount
 *   favoriteExportFormat — most frequent export format
 *   favoriteEditingType  — most frequently applied edit type
 *   favoriteShootingStyle — most common shooting style
 *   averageQualityImprovement — mean improvementDelta across editing sessions
 *   totalSessions      — count of all sessions
 *   totalAIAccepted    — sum of aiAccepted across all sessions
 *   activeInsights     — non-dismissed insights sorted by priority
 *   achievedMilestones — milestones where achieved === true
 *
 * Future AI integration points are marked with // [AI_FUTURE]
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';

import {
  MOCK_CREATOR_PROFILE,
  MOCK_MEMORY_SESSIONS,
  MOCK_PREFERENCES,
  MOCK_PATTERNS,
  MOCK_INSIGHTS,
  MOCK_MILESTONES,
  MOCK_FAVORITE_WORKFLOWS,
  MOCK_FAVORITE_EDITING,
  MOCK_FAVORITE_CAMERA,
  STYLE_EVOLUTION,
} from '../data/mockCreatorMemoryData';

import { createBlankMemorySession, createBlankInsight } from '../models/creatorMemoryModel';

// ── Action type constants ─────────────────────────────────────────────────────
const A = {
  LOAD_MEMORY:         'LOAD_MEMORY',
  ADD_SESSION:         'ADD_SESSION',
  UPDATE_PROFILE:      'UPDATE_PROFILE',
  UPDATE_PREFERENCES:  'UPDATE_PREFERENCES',
  ADD_INSIGHT:         'ADD_INSIGHT',
  DISMISS_INSIGHT:     'DISMISS_INSIGHT',
  MARK_MILESTONE:      'MARK_MILESTONE',
  CLEAR_MEMORY:        'CLEAR_MEMORY',
  RESET_MEMORY:        'RESET_MEMORY',
  SET_LOADING:         'SET_LOADING',
  SET_ERROR:           'SET_ERROR',
  SET_ACTIVE_VIEW:     'SET_ACTIVE_VIEW',
};

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  // Load state
  loadState:         'idle',     // 'idle' | 'loading' | 'loaded' | 'error'
  errorMessage:      null,

  // Core data
  profile:           null,
  sessions:          [],
  preferences:       [],
  patterns:          [],
  insights:          [],
  milestones:        [],
  favoriteWorkflows: [],
  favoriteEditing:   [],
  favoriteCamera:    [],
  styleEvolution:    [],

  // UI state
  activeView:        'dashboard', // 'dashboard' | 'timeline' | 'insights' | 'milestones' | 'preferences'
};

// ── Priority sort order ───────────────────────────────────────────────────────
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Hydrate all memory data (e.g. from mock or future API) ────────────────
    case A.LOAD_MEMORY: {
      const {
        profile, sessions, preferences, patterns, insights,
        milestones, favoriteWorkflows, favoriteEditing,
        favoriteCamera, styleEvolution,
      } = action.payload;
      return {
        ...state,
        loadState:         'loaded',
        errorMessage:      null,
        profile:           profile           ?? state.profile,
        sessions:          sessions          ?? state.sessions,
        preferences:       preferences       ?? state.preferences,
        patterns:          patterns          ?? state.patterns,
        insights:          insights          ?? state.insights,
        milestones:        milestones        ?? state.milestones,
        favoriteWorkflows: favoriteWorkflows ?? state.favoriteWorkflows,
        favoriteEditing:   favoriteEditing   ?? state.favoriteEditing,
        favoriteCamera:    favoriteCamera    ?? state.favoriteCamera,
        styleEvolution:    styleEvolution    ?? state.styleEvolution,
      };
    }

    // ── Prepend a new completed session ───────────────────────────────────────
    case A.ADD_SESSION: {
      const newSession = { ...createBlankMemorySession(), ...action.payload };
      return {
        ...state,
        sessions: [newSession, ...state.sessions],
      };
    }

    // ── Patch creator profile fields ──────────────────────────────────────────
    case A.UPDATE_PROFILE: {
      if (!state.profile) return state;
      return {
        ...state,
        profile: { ...state.profile, ...action.payload },
      };
    }

    // ── Update one or more preferences by id or key ───────────────────────────
    case A.UPDATE_PREFERENCES: {
      const patches = action.payload; // array of { id, ...fields } OR single object
      const patchList = Array.isArray(patches) ? patches : [patches];
      const updated = state.preferences.map(pref => {
        const match = patchList.find(p => p.id === pref.id || p.key === pref.key);
        return match ? { ...pref, ...match, lastUsedAt: new Date().toISOString() } : pref;
      });
      return { ...state, preferences: updated };
    }

    // ── Push a new AI-generated insight ───────────────────────────────────────
    case A.ADD_INSIGHT: {
      const insight = { ...createBlankInsight(), ...action.payload };
      return {
        ...state,
        insights: [insight, ...state.insights],
      };
    }

    // ── Dismiss an insight by id ──────────────────────────────────────────────
    case A.DISMISS_INSIGHT: {
      const updated = state.insights.map(ins =>
        ins.id === action.payload ? { ...ins, dismissed: true } : ins
      );
      return { ...state, insights: updated };
    }

    // ── Mark a milestone as achieved ──────────────────────────────────────────
    case A.MARK_MILESTONE: {
      const { id, currentValue } = action.payload;
      const updated = state.milestones.map(m => {
        if (m.id !== id) return m;
        const cv = currentValue ?? m.currentValue;
        const achieved = cv >= m.targetValue;
        return {
          ...m,
          currentValue: cv,
          progress:     Math.min(100, Math.round((cv / m.targetValue) * 100)),
          achieved,
          achievedAt:   achieved && !m.achievedAt ? new Date().toISOString() : m.achievedAt,
        };
      });
      return { ...state, milestones: updated };
    }

    // ── Wipe all memory (creator opt-out / GDPR) ──────────────────────────────
    case A.CLEAR_MEMORY:
      return {
        ...initialState,
        loadState: 'loaded',
      };

    // ── Reset to fully-loaded mock state (dev / testing) ─────────────────────
    case A.RESET_MEMORY:
      return {
        ...state,
        loadState:         'loaded',
        errorMessage:      null,
        profile:           MOCK_CREATOR_PROFILE,
        sessions:          MOCK_MEMORY_SESSIONS,
        preferences:       MOCK_PREFERENCES,
        patterns:          MOCK_PATTERNS,
        insights:          MOCK_INSIGHTS,
        milestones:        MOCK_MILESTONES,
        favoriteWorkflows: MOCK_FAVORITE_WORKFLOWS,
        favoriteEditing:   MOCK_FAVORITE_EDITING,
        favoriteCamera:    MOCK_FAVORITE_CAMERA,
        styleEvolution:    STYLE_EVOLUTION,
      };

    // ── Loading state ─────────────────────────────────────────────────────────
    case A.SET_LOADING:
      return { ...state, loadState: 'loading', errorMessage: null };

    // ── Error state ───────────────────────────────────────────────────────────
    case A.SET_ERROR:
      return { ...state, loadState: 'error', errorMessage: action.payload ?? 'Unknown error.' };

    // ── Active view (dashboard / timeline / insights / etc.) ──────────────────
    case A.SET_ACTIVE_VIEW:
      return { ...state, activeView: action.payload };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived value helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Count occurrences of each value in an array and return the most common. */
function mostCommon(arr) {
  if (!arr || arr.length === 0) return null;
  const freq = {};
  arr.forEach(v => { if (v) freq[v] = (freq[v] ?? 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** Compute derived creator statistics from session list. */
function computeCreatorStats(sessions) {
  const editing = sessions.filter(s => s.type === 'Editing');
  const withImprovement = editing.filter(s => s.improvementDelta > 0);

  const totalAIRecs     = sessions.reduce((sum, s) => sum + (s.aiRecommendations ?? 0), 0);
  const totalAIAccepted = sessions.reduce((sum, s) => sum + (s.aiAccepted ?? 0), 0);
  const totalMinutes    = sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);

  const qualityScores   = editing
    .map(s => s.qualityScoreAfter)
    .filter(n => typeof n === 'number' && !isNaN(n));

  const avgQuality = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
    : 0;

  const bestQuality = qualityScores.length > 0
    ? Math.max(...qualityScores)
    : 0;

  const avgImprovement = withImprovement.length > 0
    ? Math.round(withImprovement.reduce((sum, s) => sum + s.improvementDelta, 0) / withImprovement.length)
    : 0;

  const acceptanceRate = totalAIRecs > 0
    ? Math.round((totalAIAccepted / totalAIRecs) * 100)
    : 0;

  const allEditTypes = editing.flatMap(s => s.editTypesApplied ?? []);
  const allMovements = sessions.flatMap(s => s.cameraMovements ?? []);

  return {
    totalSessions:             sessions.length,
    totalEditingSessions:      editing.length,
    totalShootingSessions:     sessions.filter(s => s.type === 'Shooting').length,
    totalMinutesEdited:        totalMinutes,
    totalAIRecommendations:    totalAIRecs,
    totalAIAccepted:           totalAIAccepted,
    aiAcceptanceRate:          acceptanceRate,
    averageQualityScore:       avgQuality,
    averageQualityImprovement: avgImprovement,
    bestQualityScore:          bestQuality,
    favoriteExportFormat:      mostCommon(sessions.map(s => s.exportFormat)) ?? 'MP4',
    favoritePlatform:          mostCommon(sessions.map(s => s.exportPlatform)) ?? 'YouTube',
    favoriteEditingType:       mostCommon(allEditTypes) ?? '',
    favoriteShootingStyle:     mostCommon(sessions.map(s => s.shootingStyle)) ?? 'Cinematic',
    favoriteMovement:          mostCommon(allMovements) ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const CreatorMemoryContext = createContext(null);

export function CreatorMemoryProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Derived values ───────────────────────────────────────────────────────────

  const creatorStats = useMemo(
    () => computeCreatorStats(state.sessions),
    [state.sessions]
  );

  const mostUsedWorkflow = useMemo(() => {
    if (!state.favoriteWorkflows.length) return null;
    return [...state.favoriteWorkflows].sort((a, b) => b.usageCount - a.usageCount)[0];
  }, [state.favoriteWorkflows]);

  const favoriteExportFormat = useMemo(
    () => creatorStats.favoriteExportFormat,
    [creatorStats]
  );

  const favoriteEditingType = useMemo(
    () => creatorStats.favoriteEditingType,
    [creatorStats]
  );

  const favoriteShootingStyle = useMemo(
    () => creatorStats.favoriteShootingStyle,
    [creatorStats]
  );

  const averageQualityImprovement = useMemo(
    () => creatorStats.averageQualityImprovement,
    [creatorStats]
  );

  const totalSessions = useMemo(
    () => creatorStats.totalSessions,
    [creatorStats]
  );

  const totalAIAccepted = useMemo(
    () => creatorStats.totalAIAccepted,
    [creatorStats]
  );

  const activeInsights = useMemo(
    () => state.insights
      .filter(i => !i.dismissed)
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)),
    [state.insights]
  );

  const achievedMilestones = useMemo(
    () => state.milestones.filter(m => m.achieved),
    [state.milestones]
  );

  const recentSessions = useMemo(
    () => [...state.sessions]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10),
    [state.sessions]
  );

  // ── Action creators ──────────────────────────────────────────────────────────

  /** Simulate async load — hydrates all mock data. [AI_FUTURE] replace with real API call. */
  const loadMemory = useCallback(() => {
    dispatch({ type: A.SET_LOADING });
    // Simulate async delay
    setTimeout(() => {
      dispatch({
        type:    A.LOAD_MEMORY,
        payload: {
          profile:           MOCK_CREATOR_PROFILE,
          sessions:          MOCK_MEMORY_SESSIONS,
          preferences:       MOCK_PREFERENCES,
          patterns:          MOCK_PATTERNS,
          insights:          MOCK_INSIGHTS,
          milestones:        MOCK_MILESTONES,
          favoriteWorkflows: MOCK_FAVORITE_WORKFLOWS,
          favoriteEditing:   MOCK_FAVORITE_EDITING,
          favoriteCamera:    MOCK_FAVORITE_CAMERA,
          styleEvolution:    STYLE_EVOLUTION,
        },
      });
    }, 600);
  }, []);

  const addSession = useCallback(
    (sessionData) => dispatch({ type: A.ADD_SESSION, payload: sessionData }),
    []
  );

  const updateProfile = useCallback(
    (patch) => dispatch({ type: A.UPDATE_PROFILE, payload: patch }),
    []
  );

  const updatePreferences = useCallback(
    (patches) => dispatch({ type: A.UPDATE_PREFERENCES, payload: patches }),
    []
  );

  const addInsight = useCallback(
    (insightData) => dispatch({ type: A.ADD_INSIGHT, payload: insightData }),
    []
  );

  const dismissInsight = useCallback(
    (id) => dispatch({ type: A.DISMISS_INSIGHT, payload: id }),
    []
  );

  const markMilestone = useCallback(
    (id, currentValue) => dispatch({ type: A.MARK_MILESTONE, payload: { id, currentValue } }),
    []
  );

  const clearMemory = useCallback(
    () => dispatch({ type: A.CLEAR_MEMORY }),
    []
  );

  const resetMemory = useCallback(
    () => dispatch({ type: A.RESET_MEMORY }),
    []
  );

  const setError = useCallback(
    (msg) => dispatch({ type: A.SET_ERROR, payload: msg }),
    []
  );

  const setActiveView = useCallback(
    (view) => dispatch({ type: A.SET_ACTIVE_VIEW, payload: view }),
    []
  );

  // ── Context value ────────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    // Raw state
    state,

    // Derived values
    creatorStats,
    mostUsedWorkflow,
    favoriteExportFormat,
    favoriteEditingType,
    favoriteShootingStyle,
    averageQualityImprovement,
    totalSessions,
    totalAIAccepted,
    activeInsights,
    achievedMilestones,
    recentSessions,

    // Action creators
    loadMemory,
    addSession,
    updateProfile,
    updatePreferences,
    addInsight,
    dismissInsight,
    markMilestone,
    clearMemory,
    resetMemory,
    setError,
    setActiveView,
  }), [
    state,
    creatorStats,
    mostUsedWorkflow,
    favoriteExportFormat,
    favoriteEditingType,
    favoriteShootingStyle,
    averageQualityImprovement,
    totalSessions,
    totalAIAccepted,
    activeInsights,
    achievedMilestones,
    recentSessions,
    loadMemory,
    addSession,
    updateProfile,
    updatePreferences,
    addInsight,
    dismissInsight,
    markMilestone,
    clearMemory,
    resetMemory,
    setError,
    setActiveView,
  ]);

  return (
    <CreatorMemoryContext.Provider value={value}>
      {children}
    </CreatorMemoryContext.Provider>
  );
}

export function useCreatorMemoryContext() {
  const ctx = useContext(CreatorMemoryContext);
  if (!ctx) {
    throw new Error('useCreatorMemoryContext must be used within CreatorMemoryProvider');
  }
  return ctx;
}

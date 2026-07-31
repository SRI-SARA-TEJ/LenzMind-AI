/**
 * editing/context/EditingContext.jsx
 *
 * All AI Editing Intelligence state in one place.
 *
 * Flow:
 *   idle → analysing → reviewing → applying → exporting → complete
 *
 * The reducer handles every editing action.
 * Components only ever call action creators from useEditing().
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

import { MOCK_EDIT_SESSIONS } from '../data/mockEditingData';
import {
  createBlankEditSession,
  createBlankAnalysis,
  createDefaultExportSettings,
} from '../models/editingModel';

// ── Action types ──────────────────────────────────────────────────────────────
const A = {
  // Session lifecycle
  START_SESSION:          'START_SESSION',
  RESET_SESSION:          'RESET_SESSION',
  SET_SESSION_STATE:      'SET_SESSION_STATE',

  // Analysis
  START_ANALYSIS:         'START_ANALYSIS',
  UPDATE_ANALYSIS_PROGRESS: 'UPDATE_ANALYSIS_PROGRESS',
  COMPLETE_ANALYSIS:      'COMPLETE_ANALYSIS',
  FAIL_ANALYSIS:          'FAIL_ANALYSIS',

  // Suggestion interactions
  APPLY_EDIT:             'APPLY_EDIT',
  APPLY_ALL:              'APPLY_ALL',
  DISMISS_EDIT:           'DISMISS_EDIT',
  DISMISS_ALL:            'DISMISS_ALL',
  UNDO_EDIT:              'UNDO_EDIT',

  // Export
  UPDATE_EXPORT_SETTINGS: 'UPDATE_EXPORT_SETTINGS',
  APPLY_PLATFORM_PRESET:  'APPLY_PLATFORM_PRESET',
  START_EXPORT:           'START_EXPORT',
  COMPLETE_EXPORT:        'COMPLETE_EXPORT',
  FAIL_EXPORT:            'FAIL_EXPORT',

  // Project save
  SAVE_PROJECT:           'SAVE_PROJECT',

  // Filter / UI
  SET_CATEGORY_FILTER:    'SET_CATEGORY_FILTER',
  SET_SEVERITY_FILTER:    'SET_SEVERITY_FILTER',
  SET_SUGGESTION_SEARCH:  'SET_SUGGESTION_SEARCH',
  SELECT_SESSION:         'SELECT_SESSION',
  CLEAR_SELECTED_SESSION: 'CLEAR_SELECTED_SESSION',
};

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  // All sessions (past + current)
  sessions:          MOCK_EDIT_SESSIONS,

  // Currently active editing session (null on landing)
  activeSession:     null,

  // Session being viewed in detail (may differ from active)
  selectedSession:   null,

  // Filters for the suggestion list
  categoryFilter:    'all',   // 'all' | EDIT_CATEGORIES value
  severityFilter:    'all',   // 'all' | SEVERITY_LEVELS value
  suggestionSearch:  '',

  // Export state
  exportState:       'idle',  // 'idle' | 'exporting' | 'complete' | 'error'
  exportProgress:    0,       // 0–100
  exportErrorMsg:    null,
  lastExportPath:    null,    // [AI_FUTURE] actual file path on device

  // Project save state
  saveState:         'idle',  // 'idle' | 'saving' | 'saved' | 'error'
};

// ── Helper — compute editProgress from session ────────────────────────────────
function computeEditProgress(session) {
  const total = session.analysis?.suggestions?.length ?? 0;
  if (total === 0) return 0;
  const acted = (session.appliedIds?.length ?? 0) + (session.dismissedIds?.length ?? 0);
  return Math.round((acted / total) * 100);
}

// ── Helper — add a history entry ─────────────────────────────────────────────
function addHistory(session, suggestion, action) {
  const entry = {
    id:           `hist-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    suggestionId: suggestion.id,
    type:         suggestion.type,
    title:        suggestion.title,
    action,
    timestamp:    new Date().toISOString(),
  };
  return [...(session.history ?? []), entry];
}

// ── Helper — patch suggestions inside active session ──────────────────────────
function patchSuggestion(session, id, patch) {
  const suggestions = session.analysis.suggestions.map(s =>
    s.id === id ? { ...s, ...patch } : s
  );
  return {
    ...session,
    analysis: { ...session.analysis, suggestions },
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Session lifecycle ────────────────────────────────────────────────────
    case A.START_SESSION: {
      const { projectId, projectTitle } = action.payload;
      const newSession = createBlankEditSession(projectId, projectTitle);
      return {
        ...state,
        activeSession:  newSession,
        selectedSession: newSession,
        categoryFilter:  'all',
        severityFilter:  'all',
        suggestionSearch: '',
      };
    }

    case A.RESET_SESSION:
      return {
        ...state,
        activeSession:    null,
        selectedSession:  null,
        exportState:      'idle',
        exportProgress:   0,
        exportErrorMsg:   null,
        saveState:        'idle',
        categoryFilter:   'all',
        severityFilter:   'all',
        suggestionSearch: '',
      };

    case A.SET_SESSION_STATE: {
      if (!state.activeSession) return state;
      const updated = { ...state.activeSession, state: action.payload };
      return {
        ...state,
        activeSession: updated,
        sessions: state.sessions.map(s => s.id === updated.id ? updated : s),
      };
    }

    // ── Analysis ─────────────────────────────────────────────────────────────
    case A.START_ANALYSIS: {
      if (!state.activeSession) return state;
      const analysis = createBlankAnalysis(
        state.activeSession.projectId,
        state.activeSession.projectTitle
      );
      const updated = {
        ...state.activeSession,
        state:    'analysing',
        analysis: { ...analysis, state: 'scanning', progress: 0 },
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeSession: updated,
        sessions: state.sessions.map(s => s.id === updated.id ? updated : s),
      };
    }

    case A.UPDATE_ANALYSIS_PROGRESS: {
      if (!state.activeSession?.analysis) return state;
      const { progress, phase } = action.payload;
      const updated = {
        ...state.activeSession,
        analysis: {
          ...state.activeSession.analysis,
          state:    phase ?? state.activeSession.analysis.state,
          progress: Math.min(100, progress),
        },
      };
      return {
        ...state,
        activeSession: updated,
        sessions: state.sessions.map(s => s.id === updated.id ? updated : s),
      };
    }

    case A.COMPLETE_ANALYSIS: {
      if (!state.activeSession) return state;
      const { suggestions, scores, aiSummary } = action.payload;
      const updated = {
        ...state.activeSession,
        state: 'reviewing',
        analysis: {
          ...state.activeSession.analysis,
          state:       'complete',
          progress:    100,
          completedAt: new Date().toISOString(),
          suggestions: suggestions ?? state.activeSession.analysis?.suggestions ?? [],
          scores:      scores      ?? state.activeSession.analysis?.scores ?? {},
          aiSummary:   aiSummary   ?? '',
        },
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeSession: updated,
        sessions: state.sessions.map(s => s.id === updated.id ? updated : s),
      };
    }

    case A.FAIL_ANALYSIS: {
      if (!state.activeSession?.analysis) return state;
      const updated = {
        ...state.activeSession,
        state: 'idle',
        analysis: {
          ...state.activeSession.analysis,
          state:        'error',
          errorMessage: action.payload ?? 'Analysis failed. Please try again.',
        },
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeSession: updated,
        sessions: state.sessions.map(s => s.id === updated.id ? updated : s),
      };
    }

    // ── Suggestion interactions ───────────────────────────────────────────────
    case A.APPLY_EDIT: {
      if (!state.activeSession?.analysis) return state;
      const id = action.payload;
      const sug = state.activeSession.analysis.suggestions.find(s => s.id === id);
      if (!sug || sug.status === 'applied') return state;

      let patched = patchSuggestion(state.activeSession, id, { status: 'applied' });
      patched = {
        ...patched,
        appliedIds:   [...(state.activeSession.appliedIds ?? []), id],
        dismissedIds: (state.activeSession.dismissedIds ?? []).filter(d => d !== id),
        history:      addHistory(patched, sug, 'applied'),
        updatedAt:    new Date().toISOString(),
      };
      patched.editProgress = computeEditProgress(patched);

      return {
        ...state,
        activeSession: patched,
        sessions: state.sessions.map(s => s.id === patched.id ? patched : s),
      };
    }

    case A.APPLY_ALL: {
      if (!state.activeSession?.analysis) return state;
      const pending = state.activeSession.analysis.suggestions.filter(
        s => s.status === 'pending' && s.autoApplicable
      );
      if (pending.length === 0) return state;

      let patched = { ...state.activeSession };
      for (const sug of pending) {
        const withSug = patchSuggestion(patched, sug.id, { status: 'applied' });
        patched = {
          ...withSug,
          appliedIds: [...(patched.appliedIds ?? []), sug.id],
          history:    addHistory(withSug, sug, 'applied'),
        };
      }
      patched = {
        ...patched,
        updatedAt: new Date().toISOString(),
      };
      patched.editProgress = computeEditProgress(patched);

      return {
        ...state,
        activeSession: patched,
        sessions: state.sessions.map(s => s.id === patched.id ? patched : s),
      };
    }

    case A.DISMISS_EDIT: {
      if (!state.activeSession?.analysis) return state;
      const id = action.payload;
      const sug = state.activeSession.analysis.suggestions.find(s => s.id === id);
      if (!sug || sug.status === 'dismissed') return state;

      let patched = patchSuggestion(state.activeSession, id, { status: 'dismissed' });
      patched = {
        ...patched,
        dismissedIds: [...(state.activeSession.dismissedIds ?? []), id],
        appliedIds:   (state.activeSession.appliedIds ?? []).filter(a => a !== id),
        history:      addHistory(patched, sug, 'dismissed'),
        updatedAt:    new Date().toISOString(),
      };
      patched.editProgress = computeEditProgress(patched);

      return {
        ...state,
        activeSession: patched,
        sessions: state.sessions.map(s => s.id === patched.id ? patched : s),
      };
    }

    case A.DISMISS_ALL: {
      if (!state.activeSession?.analysis) return state;
      const pending = state.activeSession.analysis.suggestions.filter(
        s => s.status === 'pending'
      );
      if (pending.length === 0) return state;

      let patched = { ...state.activeSession };
      for (const sug of pending) {
        const withSug = patchSuggestion(patched, sug.id, { status: 'dismissed' });
        patched = {
          ...withSug,
          dismissedIds: [...(patched.dismissedIds ?? []), sug.id],
          history:      addHistory(withSug, sug, 'dismissed'),
        };
      }
      patched = {
        ...patched,
        updatedAt: new Date().toISOString(),
      };
      patched.editProgress = computeEditProgress(patched);

      return {
        ...state,
        activeSession: patched,
        sessions: state.sessions.map(s => s.id === patched.id ? patched : s),
      };
    }

    case A.UNDO_EDIT: {
      if (!state.activeSession?.analysis) return state;
      const id = action.payload;
      const sug = state.activeSession.analysis.suggestions.find(s => s.id === id);
      if (!sug || sug.status === 'pending') return state;

      let patched = patchSuggestion(state.activeSession, id, { status: 'pending' });
      patched = {
        ...patched,
        appliedIds:   (state.activeSession.appliedIds ?? []).filter(a => a !== id),
        dismissedIds: (state.activeSession.dismissedIds ?? []).filter(d => d !== id),
        history:      addHistory(patched, sug, 'undone'),
        updatedAt:    new Date().toISOString(),
      };
      patched.editProgress = computeEditProgress(patched);

      return {
        ...state,
        activeSession: patched,
        sessions: state.sessions.map(s => s.id === patched.id ? patched : s),
      };
    }

    // ── Export ────────────────────────────────────────────────────────────────
    case A.UPDATE_EXPORT_SETTINGS: {
      if (!state.activeSession) return state;
      const updated = {
        ...state.activeSession,
        exportSettings: { ...state.activeSession.exportSettings, ...action.payload },
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeSession: updated,
        sessions: state.sessions.map(s => s.id === updated.id ? updated : s),
      };
    }

    case A.APPLY_PLATFORM_PRESET: {
      if (!state.activeSession) return state;
      const preset = action.payload;   // ExportSettings partial
      const updated = {
        ...state.activeSession,
        exportSettings: {
          ...state.activeSession.exportSettings,
          ...preset,
        },
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeSession: updated,
        sessions: state.sessions.map(s => s.id === updated.id ? updated : s),
      };
    }

    case A.START_EXPORT:
      return {
        ...state,
        exportState:    'exporting',
        exportProgress: 0,
        exportErrorMsg: null,
      };

    case A.COMPLETE_EXPORT: {
      if (!state.activeSession) return state;
      const updated = {
        ...state.activeSession,
        state:     'complete',
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        exportState:     'complete',
        exportProgress:  100,
        lastExportPath:  action.payload ?? null,  // [AI_FUTURE] real file path
        activeSession:   updated,
        sessions: state.sessions.map(s => s.id === updated.id ? updated : s),
      };
    }

    case A.FAIL_EXPORT:
      return {
        ...state,
        exportState:    'error',
        exportErrorMsg: action.payload ?? 'Export failed. Please try again.',
      };

    // ── Project save ──────────────────────────────────────────────────────────
    case A.SAVE_PROJECT:
      // [AI_FUTURE] — Persist session + applied edits to project record
      return { ...state, saveState: 'saved' };

    // ── Filters / UI ──────────────────────────────────────────────────────────
    case A.SET_CATEGORY_FILTER:
      return { ...state, categoryFilter: action.payload };

    case A.SET_SEVERITY_FILTER:
      return { ...state, severityFilter: action.payload };

    case A.SET_SUGGESTION_SEARCH:
      return { ...state, suggestionSearch: action.payload };

    case A.SELECT_SESSION:
      return { ...state, selectedSession: action.payload };

    case A.CLEAR_SELECTED_SESSION:
      return { ...state, selectedSession: null };

    default:
      return state;
  }
}

// ── Derived: filtered suggestions ─────────────────────────────────────────────
function filterSuggestions(suggestions, categoryFilter, severityFilter, search) {
  if (!suggestions) return [];
  let list = [...suggestions];

  if (categoryFilter !== 'all') {
    list = list.filter(s => s.category === categoryFilter);
  }
  if (severityFilter !== 'all') {
    list = list.filter(s => s.severity === severityFilter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }
  return list;
}

// ── Context ────────────────────────────────────────────────────────────────────
const EditingContext = createContext(null);

export function EditingProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Derived data ────────────────────────────────────────────────────────────

  const filteredSuggestions = useMemo(() =>
    filterSuggestions(
      state.activeSession?.analysis?.suggestions ?? [],
      state.categoryFilter,
      state.severityFilter,
      state.suggestionSearch
    ),
    [
      state.activeSession?.analysis?.suggestions,
      state.categoryFilter,
      state.severityFilter,
      state.suggestionSearch,
    ]
  );

  const suggestionStats = useMemo(() => {
    const all  = state.activeSession?.analysis?.suggestions ?? [];
    return {
      total:     all.length,
      pending:   all.filter(s => s.status === 'pending').length,
      applied:   all.filter(s => s.status === 'applied').length,
      dismissed: all.filter(s => s.status === 'dismissed').length,
      critical:  all.filter(s => s.severity === 'Critical').length,
      autoApplicable: all.filter(s => s.status === 'pending' && s.autoApplicable).length,
    };
  }, [state.activeSession?.analysis?.suggestions]);

  const sessionStats = useMemo(() => ({
    total:     state.sessions.length,
    reviewing: state.sessions.filter(s => s.state === 'reviewing').length,
    complete:  state.sessions.filter(s => s.state === 'complete').length,
  }), [state.sessions]);

  // ── Action creators ─────────────────────────────────────────────────────────
  const startSession           = useCallback((projectId, projectTitle) =>
    dispatch({ type: A.START_SESSION, payload: { projectId, projectTitle } }), []);

  const resetSession           = useCallback(() =>
    dispatch({ type: A.RESET_SESSION }), []);

  const setSessionState        = useCallback(s =>
    dispatch({ type: A.SET_SESSION_STATE, payload: s }), []);

  const startAnalysis          = useCallback(() =>
    dispatch({ type: A.START_ANALYSIS }), []);

  const updateAnalysisProgress = useCallback((progress, phase) =>
    dispatch({ type: A.UPDATE_ANALYSIS_PROGRESS, payload: { progress, phase } }), []);

  const completeAnalysis       = useCallback((suggestions, scores, aiSummary) =>
    dispatch({ type: A.COMPLETE_ANALYSIS, payload: { suggestions, scores, aiSummary } }), []);

  const failAnalysis           = useCallback(msg =>
    dispatch({ type: A.FAIL_ANALYSIS, payload: msg }), []);

  const applyEdit              = useCallback(id =>
    dispatch({ type: A.APPLY_EDIT, payload: id }), []);

  const applyAll               = useCallback(() =>
    dispatch({ type: A.APPLY_ALL }), []);

  const dismissEdit            = useCallback(id =>
    dispatch({ type: A.DISMISS_EDIT, payload: id }), []);

  const dismissAll             = useCallback(() =>
    dispatch({ type: A.DISMISS_ALL }), []);

  const undoEdit               = useCallback(id =>
    dispatch({ type: A.UNDO_EDIT, payload: id }), []);

  const updateExportSettings   = useCallback(patch =>
    dispatch({ type: A.UPDATE_EXPORT_SETTINGS, payload: patch }), []);

  const applyPlatformPreset    = useCallback(preset =>
    dispatch({ type: A.APPLY_PLATFORM_PRESET, payload: preset }), []);

  const startExport            = useCallback(() =>
    dispatch({ type: A.START_EXPORT }), []);

  const completeExport         = useCallback(path =>
    dispatch({ type: A.COMPLETE_EXPORT, payload: path }), []);

  const failExport             = useCallback(msg =>
    dispatch({ type: A.FAIL_EXPORT, payload: msg }), []);

  const saveProject            = useCallback(() =>
    dispatch({ type: A.SAVE_PROJECT }), []);

  const setCategoryFilter      = useCallback(c =>
    dispatch({ type: A.SET_CATEGORY_FILTER, payload: c }), []);

  const setSeverityFilter      = useCallback(s =>
    dispatch({ type: A.SET_SEVERITY_FILTER, payload: s }), []);

  const setSuggestionSearch    = useCallback(q =>
    dispatch({ type: A.SET_SUGGESTION_SEARCH, payload: q }), []);

  const selectSession          = useCallback(s =>
    dispatch({ type: A.SELECT_SESSION, payload: s }), []);

  const clearSelectedSession   = useCallback(() =>
    dispatch({ type: A.CLEAR_SELECTED_SESSION }), []);

  const value = {
    state,
    filteredSuggestions,
    suggestionStats,
    sessionStats,
    // Session
    startSession,
    resetSession,
    setSessionState,
    // Analysis
    startAnalysis,
    updateAnalysisProgress,
    completeAnalysis,
    failAnalysis,
    // Suggestions
    applyEdit,
    applyAll,
    dismissEdit,
    dismissAll,
    undoEdit,
    // Export
    updateExportSettings,
    applyPlatformPreset,
    startExport,
    completeExport,
    failExport,
    // Project
    saveProject,
    // Filters / navigation
    setCategoryFilter,
    setSeverityFilter,
    setSuggestionSearch,
    selectSession,
    clearSelectedSession,
  };

  return <EditingContext.Provider value={value}>{children}</EditingContext.Provider>;
}

export function useEditingContext() {
  const ctx = useContext(EditingContext);
  if (!ctx) throw new Error('useEditingContext must be used within EditingProvider');
  return ctx;
}

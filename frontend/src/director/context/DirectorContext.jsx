/**
 * director/context/DirectorContext.jsx
 *
 * All AI Director state in one place.
 *
 * TWO modes:
 *   'ai-guided'    — Template-driven step-by-step cinematography guide
 *   'create-own'   — Free-form recording with Shot Markers and Director Map
 *
 * Integration:
 *   - Reads workflow IDs from existing WorkflowContext (via prop injection)
 *   - Reads project IDs from existing ProjectContext (via prop injection)
 *   - Director Maps can be saved back to workflows
 *
 * Future AI hooks are clearly marked with [AI_FUTURE].
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';

import { CINEMATIC_TEMPLATES, MOCK_DIRECTOR_MAPS } from '../data/mockDirectorData';
import { createBlankShotMarker, createBlankDirectorMap } from '../models/directorModel';

// ── Action types ──────────────────────────────────────────────────────────────
const A = {
  // Mode & screen navigation
  SET_MODE:                'SET_MODE',
  GO_HOME:                 'GO_HOME',

  // AI Guided
  SELECT_TEMPLATE:         'SELECT_TEMPLATE',
  CLEAR_TEMPLATE:          'CLEAR_TEMPLATE',
  SET_GUIDED_STEP:         'SET_GUIDED_STEP',
  NEXT_STEP:               'NEXT_STEP',
  PREV_STEP:               'PREV_STEP',
  COMPLETE_GUIDED_SESSION: 'COMPLETE_GUIDED_SESSION',

  // Ready Screen (F1 / F7)
  SHOW_READY_SCREEN:       'SHOW_READY_SCREEN',
  DISMISS_READY_SCREEN:    'DISMISS_READY_SCREEN',

  // Camera Prep (F6)
  SHOW_CAMERA_PREP:        'SHOW_CAMERA_PREP',
  DISMISS_CAMERA_PREP:     'DISMISS_CAMERA_PREP',

  // Creator Memory (F8)
  SHOW_MEMORY_TOAST:       'SHOW_MEMORY_TOAST',
  DISMISS_MEMORY_TOAST:    'DISMISS_MEMORY_TOAST',

  // Create My Own — recording
  SET_RECORDING_STATE:     'SET_RECORDING_STATE',
  ADD_SHOT_MARKER:         'ADD_SHOT_MARKER',
  UPDATE_SHOT_MARKER:      'UPDATE_SHOT_MARKER',
  DELETE_SHOT_MARKER:      'DELETE_SHOT_MARKER',
  REORDER_SHOT_MARKERS:    'REORDER_SHOT_MARKERS',

  // Director Map
  SAVE_DIRECTOR_MAP:       'SAVE_DIRECTOR_MAP',
  UPDATE_DIRECTOR_MAP:     'UPDATE_DIRECTOR_MAP',
  DELETE_DIRECTOR_MAP:     'DELETE_DIRECTOR_MAP',
  SELECT_DIRECTOR_MAP:     'SELECT_DIRECTOR_MAP',
  CLEAR_SELECTED_MAP:      'CLEAR_SELECTED_MAP',

  // Shot marker dialog
  OPEN_SHOT_DIALOG:        'OPEN_SHOT_DIALOG',
  CLOSE_SHOT_DIALOG:       'CLOSE_SHOT_DIALOG',
  OPEN_MAP_SAVE_DIALOG:    'OPEN_MAP_SAVE_DIALOG',
  CLOSE_MAP_SAVE_DIALOG:   'CLOSE_MAP_SAVE_DIALOG',

  // Filters
  SET_TEMPLATE_CATEGORY:   'SET_TEMPLATE_CATEGORY',
  SET_TEMPLATE_SEARCH:     'SET_TEMPLATE_SEARCH',
};

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  // Screen navigation
  // 'home' | 'template-picker' | 'guided-session' | 'create-own' | 'director-map'
  screen:              'home',
  mode:                null,  // 'ai-guided' | 'create-own'

  // AI Guided
  templates:           CINEMATIC_TEMPLATES,
  selectedTemplate:    null,
  currentStepIndex:    0,
  completedSessions:   [],  // [AI_FUTURE] track learning progress

  // Ready Screen (F1/F7) — shown between template selection and session start
  readyScreenOpen:     false,
  readyTemplate:       null,  // template staged for the Ready Screen

  // Camera Prep (F6)
  cameraPrepOpen:      false,

  // Creator Memory Toast (F8)
  memoryToastVisible:  false,

  // Create My Own
  recordingState:      'idle',  // 'idle' | 'recording' | 'finished'
  currentShotMarkers:  [],      // active session shot markers
  shotDialogOpen:      false,
  editingShotMarker:   null,    // null = new, object = editing existing

  // Director Maps
  directorMaps:        MOCK_DIRECTOR_MAPS,
  selectedMap:         null,
  mapSaveDialogOpen:   false,

  // Filters (template picker)
  templateCategory:    'all',
  templateSearch:      '',
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Navigation ──────────────────────────────────────────────────────────
    case A.SET_MODE:
      return {
        ...state,
        mode:             action.payload,
        screen:           action.payload === 'ai-guided' ? 'template-picker' : 'create-own',
        currentStepIndex: 0,
        selectedTemplate: null,
        recordingState:   'idle',
        currentShotMarkers: [],
      };

    case A.GO_HOME:
      return {
        ...state,
        screen:              'home',
        mode:                null,
        selectedTemplate:    null,
        currentStepIndex:    0,
        recordingState:      'idle',
        currentShotMarkers:  [],
        shotDialogOpen:      false,
        editingShotMarker:   null,
        mapSaveDialogOpen:   false,
        selectedMap:         null,
      };

    // ── AI Guided ────────────────────────────────────────────────────────────
    // Template selection now opens Ready Screen (F1/F7), not guided-session directly
    case A.SELECT_TEMPLATE:
      return {
        ...state,
        readyTemplate:    action.payload,
        readyScreenOpen:  true,
        currentStepIndex: 0,
      };

    case A.SHOW_READY_SCREEN:
      return { ...state, readyScreenOpen: true, readyTemplate: action.payload ?? state.readyTemplate };

    case A.DISMISS_READY_SCREEN:
      return { ...state, readyScreenOpen: false, readyTemplate: null };

    // Camera Prep (F6)
    case A.SHOW_CAMERA_PREP:
      return { ...state, cameraPrepOpen: true };

    case A.DISMISS_CAMERA_PREP:
      return {
        ...state,
        cameraPrepOpen:   false,
        // After prep completes, commit the readyTemplate → guided-session
        selectedTemplate: state.readyTemplate ?? state.selectedTemplate,
        currentStepIndex: 0,
        screen:           'guided-session',
        readyTemplate:    null,
        readyScreenOpen:  false,
      };

    // Creator Memory Toast (F8)
    case A.SHOW_MEMORY_TOAST:
      return { ...state, memoryToastVisible: true };

    case A.DISMISS_MEMORY_TOAST:
      return { ...state, memoryToastVisible: false };

    case A.CLEAR_TEMPLATE:
      return {
        ...state,
        selectedTemplate: null,
        currentStepIndex: 0,
        screen:           'template-picker',
      };

    case A.SET_GUIDED_STEP:
      return { ...state, currentStepIndex: action.payload };

    case A.NEXT_STEP: {
      const maxIndex = (state.selectedTemplate?.steps.length ?? 1) - 1;
      const next = Math.min(state.currentStepIndex + 1, maxIndex);
      return { ...state, currentStepIndex: next };
    }

    case A.PREV_STEP: {
      const prev = Math.max(state.currentStepIndex - 1, 0);
      return { ...state, currentStepIndex: prev };
    }

    case A.COMPLETE_GUIDED_SESSION: {
      const session = {
        id:           `session-${Date.now()}`,
        templateId:   state.selectedTemplate?.id,
        templateName: state.selectedTemplate?.name,
        completedAt:  new Date().toISOString(),
        // [AI_FUTURE] store performance data for Creator Memory Agent
      };
      return {
        ...state,
        completedSessions:  [session, ...state.completedSessions],
        screen:             'home',
        selectedTemplate:   null,
        currentStepIndex:   0,
        memoryToastVisible: true,   // F8: show Creator Memory toast after session
      };
    }

    // ── Create My Own ────────────────────────────────────────────────────────
    case A.SET_RECORDING_STATE:
      return { ...state, recordingState: action.payload };

    case A.ADD_SHOT_MARKER: {
      const marker = action.payload;
      const updated = [...state.currentShotMarkers, marker];
      return { ...state, currentShotMarkers: updated, shotDialogOpen: false, editingShotMarker: null };
    }

    case A.UPDATE_SHOT_MARKER: {
      const { id, patch } = action.payload;
      return {
        ...state,
        currentShotMarkers: state.currentShotMarkers.map(sm =>
          sm.id === id ? { ...sm, ...patch } : sm
        ),
        shotDialogOpen:    false,
        editingShotMarker: null,
      };
    }

    case A.DELETE_SHOT_MARKER:
      return {
        ...state,
        currentShotMarkers: state.currentShotMarkers
          .filter(sm => sm.id !== action.payload)
          .map((sm, i) => ({ ...sm, order: i + 1 })),
      };

    case A.REORDER_SHOT_MARKERS: {
      const reordered = action.payload.map((sm, i) => ({ ...sm, order: i + 1 }));
      return { ...state, currentShotMarkers: reordered };
    }

    // ── Director Map ──────────────────────────────────────────────────────────
    case A.SAVE_DIRECTOR_MAP: {
      const now = new Date().toISOString();
      const newMap = {
        ...createBlankDirectorMap(),
        ...action.payload,
        id:         `dm-${Date.now()}`,
        shots:      state.currentShotMarkers,
        createdAt:  now,
        updatedAt:  now,
      };
      return {
        ...state,
        directorMaps:       [newMap, ...state.directorMaps],
        mapSaveDialogOpen:  false,
        currentShotMarkers: [],
        recordingState:     'idle',
        screen:             'director-map',
        selectedMap:        newMap,
        memoryToastVisible: true,  // F8: show Creator Memory toast after saving
      };
    }

    case A.UPDATE_DIRECTOR_MAP: {
      const { id, patch } = action.payload;
      const now = new Date().toISOString();
      const updated = state.directorMaps.map(dm =>
        dm.id === id ? { ...dm, ...patch, updatedAt: now } : dm
      );
      return {
        ...state,
        directorMaps: updated,
        selectedMap:  state.selectedMap?.id === id
          ? { ...state.selectedMap, ...patch, updatedAt: now }
          : state.selectedMap,
      };
    }

    case A.DELETE_DIRECTOR_MAP:
      return {
        ...state,
        directorMaps: state.directorMaps.filter(dm => dm.id !== action.payload),
        selectedMap:  state.selectedMap?.id === action.payload ? null : state.selectedMap,
      };

    case A.SELECT_DIRECTOR_MAP:
      return { ...state, selectedMap: action.payload, screen: 'director-map' };

    case A.CLEAR_SELECTED_MAP:
      return { ...state, selectedMap: null, screen: 'home' };

    // ── Dialogs ───────────────────────────────────────────────────────────────
    case A.OPEN_SHOT_DIALOG:
      return { ...state, shotDialogOpen: true, editingShotMarker: action.payload ?? null };

    case A.CLOSE_SHOT_DIALOG:
      return { ...state, shotDialogOpen: false, editingShotMarker: null };

    case A.OPEN_MAP_SAVE_DIALOG:
      return { ...state, mapSaveDialogOpen: true };

    case A.CLOSE_MAP_SAVE_DIALOG:
      return { ...state, mapSaveDialogOpen: false };

    // ── Filters ───────────────────────────────────────────────────────────────
    case A.SET_TEMPLATE_CATEGORY:
      return { ...state, templateCategory: action.payload };

    case A.SET_TEMPLATE_SEARCH:
      return { ...state, templateSearch: action.payload };

    default:
      return state;
  }
}

// ── Derived filtered templates ─────────────────────────────────────────────────
function filterTemplates(templates, category, search) {
  let list = [...templates];
  if (category !== 'all') {
    list = list.filter(t => t.category === category);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q))
    );
  }
  return list;
}

// ── Context ────────────────────────────────────────────────────────────────────
const DirectorContext = createContext(null);

export function DirectorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const filteredTemplates = useMemo(
    () => filterTemplates(state.templates, state.templateCategory, state.templateSearch),
    [state.templates, state.templateCategory, state.templateSearch]
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    templates:         state.templates.length,
    savedMaps:         state.directorMaps.length,
    sessionsCompleted: state.completedSessions.length,
    totalShots:        state.directorMaps.reduce((s, dm) => s + dm.shots.length, 0),
  }), [state.templates, state.directorMaps, state.completedSessions]);

  // ── Action creators ────────────────────────────────────────────────────────
  const setMode               = useCallback(m   => dispatch({ type: A.SET_MODE,               payload: m }), []);
  const goHome                = useCallback(()  => dispatch({ type: A.GO_HOME }),                             []);
  const selectTemplate        = useCallback(t   => dispatch({ type: A.SELECT_TEMPLATE,        payload: t }), []);
  const clearTemplate         = useCallback(()  => dispatch({ type: A.CLEAR_TEMPLATE }),                     []);
  const nextStep              = useCallback(()  => dispatch({ type: A.NEXT_STEP }),                          []);
  const prevStep              = useCallback(()  => dispatch({ type: A.PREV_STEP }),                          []);
  const setGuidedStep         = useCallback(i   => dispatch({ type: A.SET_GUIDED_STEP,         payload: i }), []);
  const completeGuidedSession = useCallback(()  => dispatch({ type: A.COMPLETE_GUIDED_SESSION }),            []);
  const dismissReadyScreen    = useCallback(()  => dispatch({ type: A.DISMISS_READY_SCREEN }),               []);
  const showCameraPrep        = useCallback(()  => dispatch({ type: A.SHOW_CAMERA_PREP }),                   []);
  const dismissCameraPrep     = useCallback(()  => dispatch({ type: A.DISMISS_CAMERA_PREP }),                []);
  const dismissMemoryToast    = useCallback(()  => dispatch({ type: A.DISMISS_MEMORY_TOAST }),               []);
  const setRecordingState     = useCallback(s   => dispatch({ type: A.SET_RECORDING_STATE,     payload: s }), []);
  const addShotMarker         = useCallback(sm  => dispatch({ type: A.ADD_SHOT_MARKER,         payload: sm }), []);
  const updateShotMarker      = useCallback((id, patch) =>
    dispatch({ type: A.UPDATE_SHOT_MARKER, payload: { id, patch } }), []);
  const deleteShotMarker      = useCallback(id  => dispatch({ type: A.DELETE_SHOT_MARKER,      payload: id }), []);
  const reorderShotMarkers    = useCallback(arr => dispatch({ type: A.REORDER_SHOT_MARKERS,    payload: arr }), []);
  const saveDirectorMap       = useCallback(d   => dispatch({ type: A.SAVE_DIRECTOR_MAP,       payload: d }), []);
  const updateDirectorMap     = useCallback((id, patch) =>
    dispatch({ type: A.UPDATE_DIRECTOR_MAP, payload: { id, patch } }), []);
  const deleteDirectorMap     = useCallback(id  => dispatch({ type: A.DELETE_DIRECTOR_MAP,     payload: id }), []);
  const selectDirectorMap     = useCallback(dm  => dispatch({ type: A.SELECT_DIRECTOR_MAP,     payload: dm }), []);
  const clearSelectedMap      = useCallback(()  => dispatch({ type: A.CLEAR_SELECTED_MAP }),                  []);
  const openShotDialog        = useCallback(sm  => dispatch({ type: A.OPEN_SHOT_DIALOG,        payload: sm }), []);
  const closeShotDialog       = useCallback(()  => dispatch({ type: A.CLOSE_SHOT_DIALOG }),                   []);
  const openMapSaveDialog     = useCallback(()  => dispatch({ type: A.OPEN_MAP_SAVE_DIALOG }),                []);
  const closeMapSaveDialog    = useCallback(()  => dispatch({ type: A.CLOSE_MAP_SAVE_DIALOG }),               []);
  const setTemplateCategory   = useCallback(c   => dispatch({ type: A.SET_TEMPLATE_CATEGORY,   payload: c }), []);
  const setTemplateSearch     = useCallback(q   => dispatch({ type: A.SET_TEMPLATE_SEARCH,     payload: q }), []);

  const value = {
    state,
    filteredTemplates,
    stats,
    setMode,
    goHome,
    selectTemplate,
    clearTemplate,
    nextStep,
    prevStep,
    setGuidedStep,
    completeGuidedSession,
    dismissReadyScreen,
    showCameraPrep,
    dismissCameraPrep,
    dismissMemoryToast,
    setRecordingState,
    addShotMarker,
    updateShotMarker,
    deleteShotMarker,
    reorderShotMarkers,
    saveDirectorMap,
    updateDirectorMap,
    deleteDirectorMap,
    selectDirectorMap,
    clearSelectedMap,
    openShotDialog,
    closeShotDialog,
    openMapSaveDialog,
    closeMapSaveDialog,
    setTemplateCategory,
    setTemplateSearch,
  };

  return <DirectorContext.Provider value={value}>{children}</DirectorContext.Provider>;
}

export function useDirectorContext() {
  const ctx = useContext(DirectorContext);
  if (!ctx) throw new Error('useDirectorContext must be used within DirectorProvider');
  return ctx;
}

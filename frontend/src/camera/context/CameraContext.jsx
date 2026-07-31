/**
 * camera/context/CameraContext.jsx — Camera Feature State
 *
 * All camera-screen state lives here:
 *   - Camera mode (photo / video / timelapse / slow-mo)
 *   - Camera settings (flash, HDR, resolution, FPS)
 *   - Capture state (idle / recording / processing)
 *   - Workflow state (active workflow)
 *   - AI suggestion state
 *   - AI status indicator
 *   - Navigation state
 *   - Creator Memory (camera-local analysis history)   ← Module 8.6
 *
 * Module 8.5 — Workflow Application:
 *   APPLY_WORKFLOW applies a full Workflow object from the library.
 *   Its cameraSettings are merged into state.settings so every UI
 *   component that reads settings reacts automatically.
 *
 * Module 8.6 — Creator Memory:
 *   After every successful image analysis a CameraMemoryEntry is built by
 *   creatorMemoryService and stored in state.creatorMemory (newest-first).
 *   Duplicate entries (same scene + workflow + second) are silently dropped.
 *   Failures never interrupt the capture pipeline.
 *
 * Mock cycles are used for Version 1 in place of real device/AI APIs.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import {
  MOCK_WORKFLOWS,
  MOCK_CAMERA_SETTINGS,
  AI_STATUS_STATES,
} from '../data/mockData';
import { analyzeCapturedImage } from '../../services/aiAnalysisService';
import {
  buildMemoryEntry,
  isDuplicate,
} from '../services/creatorMemoryService';

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  // Camera
  captureMode:     'video',               // 'photo' | 'video' | 'timelapse' | 'slow'
  captureState:    'idle',                // 'idle' | 'recording' | 'processing'
  cameraFacing:    'back',                // 'back' | 'front'
  settings:        MOCK_CAMERA_SETTINGS,
  capturedImage:   null,                  // { blob, url, width, height, createdAt }
  isAnalyzingImage: false,
  latestAnalysis:  null,
  imageAnalysisError: null,

  // Workflow
  activeWorkflow:  MOCK_WORKFLOWS[0],
  workflows:       MOCK_WORKFLOWS,

  // AI Suggestion
  suggestion:      null,                  // current visible suggestion
  suggestionVisible: false,

  // AI Status
  aiStatus:        AI_STATUS_STATES[0],  // default: Ready

  // Navigation
  activeTab:       'camera',

  // Creator Memory (Module 8.6) — camera-local analysis history
  creatorMemory:      [],   // CameraMemoryEntry[], newest-first
  latestMemoryEntry:  null, // CameraMemoryEntry | null
};

// ── Action types ──────────────────────────────────────────────────────────────
const A = {
  SET_CAPTURE_MODE:    'SET_CAPTURE_MODE',
  SET_CAPTURE_STATE:   'SET_CAPTURE_STATE',
  TOGGLE_CAMERA_FACE:  'TOGGLE_CAMERA_FACE',
  UPDATE_SETTING:      'UPDATE_SETTING',
  SET_WORKFLOW:        'SET_WORKFLOW',
  SHOW_SUGGESTION:     'SHOW_SUGGESTION',
  HIDE_SUGGESTION:     'HIDE_SUGGESTION',
  DISMISS_SUGGESTION:  'DISMISS_SUGGESTION',
  APPLY_SUGGESTION:    'APPLY_SUGGESTION',
  // Module 8.5: applies a full Workflow object, merging its cameraSettings
  APPLY_WORKFLOW:      'APPLY_WORKFLOW',
  SET_AI_STATUS:       'SET_AI_STATUS',
  SET_ACTIVE_TAB:      'SET_ACTIVE_TAB',
  SET_CAPTURED_IMAGE:  'SET_CAPTURED_IMAGE',
  SET_IMAGE_ANALYZING: 'SET_IMAGE_ANALYZING',
  SET_LATEST_ANALYSIS: 'SET_LATEST_ANALYSIS',
  SET_IMAGE_ANALYSIS_ERROR: 'SET_IMAGE_ANALYSIS_ERROR',
  // Module 8.6: Creator Memory
  ADD_MEMORY_ENTRY:    'ADD_MEMORY_ENTRY',
  CLEAR_MEMORY:        'CLEAR_MEMORY',
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case A.SET_CAPTURE_MODE:
      return { ...state, captureMode: action.payload };

    case A.SET_CAPTURE_STATE:
      return { ...state, captureState: action.payload };

    case A.TOGGLE_CAMERA_FACE:
      return { ...state, cameraFacing: state.cameraFacing === 'back' ? 'front' : 'back' };

    case A.UPDATE_SETTING:
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case A.SET_WORKFLOW:
      return {
        ...state,
        activeWorkflow: action.payload,
        aiStatus: AI_STATUS_STATES.find(s => s.id === 'workflow_active'),
      };

    case A.SHOW_SUGGESTION:
      return { ...state, suggestion: action.payload, suggestionVisible: true };

    case A.HIDE_SUGGESTION:
      return { ...state, suggestionVisible: false };

    case A.DISMISS_SUGGESTION:
      return { ...state, suggestionVisible: false, suggestion: null };

    case A.APPLY_SUGGESTION: {
      // Legacy path: resolve by name string only (no settings applied).
      const matched = state.workflows.find(
        w => w.name === action.payload || w.name === state.suggestion?.workflow,
      );
      return {
        ...state,
        suggestionVisible: false,
        suggestion: null,
        activeWorkflow: matched || state.activeWorkflow,
        aiStatus: AI_STATUS_STATES.find(s => s.id === 'workflow_active'),
      };
    }

    case A.APPLY_WORKFLOW: {
      // Module 8.5: apply a full Workflow object.
      // Merges cameraSettings from the workflow into the live settings state
      // so TopStatusBar, WorkflowIndicator, and every other consumer update.
      const workflow = action.payload; // full Workflow object from library
      const cs = workflow.cameraSettings || {};
      const settingsPatch = {};
      if (cs.flash      !== undefined) settingsPatch.flash      = cs.flash;
      if (cs.hdr        !== undefined) settingsPatch.hdr        = cs.hdr;
      if (cs.resolution !== undefined) settingsPatch.resolution = cs.resolution;
      if (cs.fps        !== undefined) settingsPatch.fps        = cs.fps;
      if (cs.stabilization !== undefined) settingsPatch.stabilization = cs.stabilization;
      if (cs.focusMode  !== undefined) settingsPatch.focusMode  = cs.focusMode;
      if (cs.whiteBalance !== undefined) settingsPatch.whiteBalance = cs.whiteBalance;
      return {
        ...state,
        activeWorkflow:    workflow,
        settings:          { ...state.settings, ...settingsPatch },
        suggestionVisible: false,
        suggestion:        null,
        aiStatus:          AI_STATUS_STATES.find(s => s.id === 'workflow_active'),
      };
    }

    case A.SET_AI_STATUS:
      return { ...state, aiStatus: action.payload };

    case A.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };

    case A.SET_CAPTURED_IMAGE:
      return { ...state, capturedImage: action.payload };

    case A.SET_IMAGE_ANALYZING:
      return { ...state, isAnalyzingImage: action.payload, imageAnalysisError: null };

    case A.SET_LATEST_ANALYSIS:
      return { ...state, latestAnalysis: action.payload, imageAnalysisError: null };

    case A.SET_IMAGE_ANALYSIS_ERROR:
      return { ...state, imageAnalysisError: action.payload };

    // Module 8.6 — Creator Memory ─────────────────────────────────────────────
    case A.ADD_MEMORY_ENTRY: {
      const entry = action.payload;
      // Guard: drop duplicates (same scene + workflow + second)
      if (isDuplicate(entry, state.creatorMemory)) return state;
      return {
        ...state,
        creatorMemory:     [entry, ...state.creatorMemory],
        latestMemoryEntry: entry,
      };
    }

    case A.CLEAR_MEMORY:
      return { ...state, creatorMemory: [], latestMemoryEntry: null };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const CameraContext = createContext(null);

export function CameraProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const photoCaptureHandler = useRef(null);
  const capturedImageUrl = useRef(null);
  const imageAnalysisRequest = useRef(0);

  // Object URLs are owned by this provider and are released when replaced or
  // when the camera feature unmounts.
  useEffect(() => () => {
    if (capturedImageUrl.current) URL.revokeObjectURL(capturedImageUrl.current);
  }, []);

  // ── Action creators ─────────────────────────────────────────────────────────
  const setCaptureMode   = useCallback(mode   => dispatch({ type: A.SET_CAPTURE_MODE, payload: mode }), []);
  const setCaptureState  = useCallback(s      => dispatch({ type: A.SET_CAPTURE_STATE, payload: s }), []);
  const toggleCameraFace = useCallback(()     => dispatch({ type: A.TOGGLE_CAMERA_FACE }), []);
  const updateSetting    = useCallback(patch  => dispatch({ type: A.UPDATE_SETTING, payload: patch }), []);
  const setWorkflow      = useCallback(wf     => dispatch({ type: A.SET_WORKFLOW, payload: wf }), []);
  const dismissSuggestion = useCallback(() => dispatch({ type: A.DISMISS_SUGGESTION }), []);
  const applySuggestion = useCallback(workflowName => {
    dispatch({ type: A.APPLY_SUGGESTION, payload: workflowName });
  }, []);

  /**
   * Module 8.5 — applyWorkflow
   * Accepts a full Workflow object from the library.
   * Sets it as the active workflow AND merges its cameraSettings into
   * the live settings state, updating the camera UI immediately.
   */
  const applyWorkflow = useCallback(workflow => {
    dispatch({ type: A.APPLY_WORKFLOW, payload: workflow });
  }, []);
  const setActiveTab     = useCallback(tab   => dispatch({ type: A.SET_ACTIVE_TAB, payload: tab }), []);
  const registerPhotoCaptureHandler = useCallback(handler => {
    photoCaptureHandler.current = handler;
  }, []);
  /**
   * Module 8.6 — addMemoryEntry
   * Builds a CameraMemoryEntry from the completed analysis and stores it.
   * Uses a ref snapshot of state so the callback never needs to re-create
   * on every state change (avoids stale-closure issues).
   *
   * Failures are caught and logged; they never interrupt the capture pipeline.
   */
  const stateRef = useRef(initialState);
  // Keep stateRef current without causing extra renders.
  // We update it synchronously in the reducer via a middleware-style effect,
  // but the simplest correct approach is a separate ref updated in the provider body.

  const addMemoryEntry = useCallback((analysis) => {
    // Read the live state snapshot from the ref (set below in provider body).
    const { activeWorkflow, settings, capturedImage } = stateRef.current;
    try {
      const entry = buildMemoryEntry(analysis, activeWorkflow, settings, capturedImage);
      dispatch({ type: A.ADD_MEMORY_ENTRY, payload: entry });
    } catch (err) {
      // Graceful failure: log but never throw — capture pipeline must continue.
      // eslint-disable-next-line no-console
      console.warn('[CreatorMemory] Failed to build memory entry:', err.message);
    }
  }, []);

  const clearCreatorMemory = useCallback(
    () => dispatch({ type: A.CLEAR_MEMORY }),
    [],
  );

  const capturePhoto = useCallback(async () => {
    const frame = await photoCaptureHandler.current?.();
    if (!frame?.blob) return null;

    if (capturedImageUrl.current) URL.revokeObjectURL(capturedImageUrl.current);
    const url = URL.createObjectURL(frame.blob);
    capturedImageUrl.current = url;

    const capturedImage = {
      blob: frame.blob,
      url,
      width: frame.width,
      height: frame.height,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: A.SET_CAPTURED_IMAGE, payload: capturedImage });

    const requestId = imageAnalysisRequest.current + 1;
    imageAnalysisRequest.current = requestId;
    dispatch({ type: A.SET_IMAGE_ANALYZING, payload: true });

    analyzeCapturedImage(frame.blob)
      .then((analysis) => {
        if (imageAnalysisRequest.current !== requestId) return;
        dispatch({ type: A.SET_LATEST_ANALYSIS, payload: analysis });
        // Module 8.6 — persist analysis to Creator Memory automatically.
        // addMemoryEntry is a stable callback; it reads live state via stateRef.
        addMemoryEntry(analysis);
      })
      .catch((error) => {
        if (imageAnalysisRequest.current === requestId) {
          dispatch({
            type: A.SET_IMAGE_ANALYSIS_ERROR,
            payload: error.message || 'Image analysis is temporarily unavailable.',
          });
        }
      })
      .finally(() => {
        if (imageAnalysisRequest.current === requestId) {
          dispatch({ type: A.SET_IMAGE_ANALYZING, payload: false });
        }
      });

    return capturedImage;
  }, [addMemoryEntry]);

  // Keep stateRef in sync with the latest reducer state on every render.
  // This is the correct pattern for reading fresh state inside stable callbacks.
  stateRef.current = state;

  const value = {
    state,
    setCaptureMode,
    setCaptureState,
    toggleCameraFace,
    updateSetting,
    setWorkflow,
    dismissSuggestion,
    applySuggestion,
    applyWorkflow,
    setActiveTab,
    registerPhotoCaptureHandler,
    capturePhoto,
    // Module 8.6 — Creator Memory
    addMemoryEntry,
    clearCreatorMemory,
  };

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>;
}

export function useCamera() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCamera must be used within CameraProvider');
  return ctx;
}

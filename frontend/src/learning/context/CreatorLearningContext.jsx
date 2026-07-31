/**
 * learning/context/CreatorLearningContext.jsx — Creator Learning Context
 *
 * Module 8.9 — Creator Learning Intelligence
 *
 * Stores the latest CreatorLearningProfile derived from the creator's
 * session history.  It is a pure derived-state store: it never fetches
 * data itself — LearningBridge.jsx writes to it; UI components read from it.
 *
 * ── State ─────────────────────────────────────────────────────────────────────
 *   profile     — latest CreatorLearningProfile (see learningModel.js)
 *   isLearning  — true while LearningBridge is computing an update
 *
 * ── Actions ───────────────────────────────────────────────────────────────────
 *   SET_PROFILE    — replace profile with a freshly-computed one
 *   SET_LEARNING   — toggle isLearning flag
 *
 * ── Public API ────────────────────────────────────────────────────────────────
 *   profile        — CreatorLearningProfile
 *   isLearning     — boolean
 *   updateProfile(newProfile) — write a freshly-computed profile
 *   setLearning(bool)         — set the loading indicator
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Wrapped around BrowserRouter in App.jsx, inside AnalyticsProvider:
 *   AnalyticsProvider
 *     └─ CreatorLearningProvider  ← here
 *        └─ BrowserRouter
 *           └─ LearningBridge (renderless, writes profile)
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';

import { createBlankLearningProfile } from '../models/learningModel';

// ── Action type constants ──────────────────────────────────────────────────────
const A = {
  SET_PROFILE:  'SET_PROFILE',
  SET_LEARNING: 'SET_LEARNING',
};

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  profile:    createBlankLearningProfile(),
  isLearning: false,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Replace the full profile ─────────────────────────────────────────────
    case A.SET_PROFILE:
      return {
        ...state,
        profile:    action.payload,
        isLearning: false,
      };

    // ── Toggle the loading indicator ─────────────────────────────────────────
    case A.SET_LEARNING:
      return { ...state, isLearning: action.payload };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const CreatorLearningContext = createContext(null);

export function CreatorLearningProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Action creators ──────────────────────────────────────────────────────

  /**
   * Write a newly-computed CreatorLearningProfile into the store.
   * Called exclusively by LearningBridge.
   *
   * @param {import('../models/learningModel').CreatorLearningProfile} newProfile
   */
  const updateProfile = useCallback(
    (newProfile) => dispatch({ type: A.SET_PROFILE, payload: newProfile }),
    [],
  );

  /**
   * Set the isLearning flag.  LearningBridge sets it true before computing
   * and false (via SET_PROFILE) after.
   *
   * @param {boolean} value
   */
  const setLearning = useCallback(
    (value) => dispatch({ type: A.SET_LEARNING, payload: value }),
    [],
  );

  // ── Context value ────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    // Raw state
    state,

    // Convenience top-level accessors
    profile:    state.profile,
    isLearning: state.isLearning,

    // Action creators
    updateProfile,
    setLearning,
  }), [state, updateProfile, setLearning]);

  return (
    <CreatorLearningContext.Provider value={value}>
      {children}
    </CreatorLearningContext.Provider>
  );
}

/**
 * Internal context hook — consumed by useCreatorLearning.js and LearningBridge.
 * Components should import useCreatorLearning from the public hook, not this.
 */
export function useCreatorLearningContext() {
  const ctx = useContext(CreatorLearningContext);
  if (!ctx) {
    throw new Error(
      'useCreatorLearningContext must be used within CreatorLearningProvider',
    );
  }
  return ctx;
}

/**
 * context/AppContext.jsx — Global Application State
 *
 * Why React Context?
 *   The MVP has a small state surface. Context avoids adding a heavy
 *   state library (Redux/Zustand) before it is needed. If state grows
 *   complex we can migrate to Zustand in one refactor.
 *
 * What lives here:
 *   - projects list
 *   - loading / error flags
 *   - active project
 *   - notification toast messages
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import * as api from '../services/api';

// ── State shape ──────────────────────────────────────────────────────────────
const initialState = {
  projects:      [],
  activeProject: null,
  loading:       false,
  error:         null,
  notification:  null,   // { type: 'success'|'error', message: string }
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':     return { ...state, loading: action.payload };
    case 'SET_ERROR':       return { ...state, error: action.payload, loading: false };
    case 'SET_PROJECTS':    return { ...state, projects: action.payload, loading: false };
    case 'ADD_PROJECT':     return { ...state, projects: [action.payload, ...state.projects] };
    case 'SET_ACTIVE':      return { ...state, activeProject: action.payload };
    case 'SET_NOTIFICATION':return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION': return { ...state, notification: null };
    default:                return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchProjects = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.getProjects();
      dispatch({ type: 'SET_PROJECTS', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  const createProject = useCallback(async (formData) => {
    const project = await api.createProject(formData);
    dispatch({ type: 'ADD_PROJECT', payload: project });
    dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'success', message: 'Project created!' } });
    return project;
  }, []);

  const notify = useCallback((type, message) => {
    dispatch({ type: 'SET_NOTIFICATION', payload: { type, message } });
    setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 4000);
  }, []);

  const value = { state, fetchProjects, createProject, notify };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Named export hook for clean consumption in components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

/**
 * mission/context/CreatorMissionContext.jsx — Creator Mission Context
 *
 * Module 10.2 — Realis Creator Mission Engine
 *
 * Stores the latest CreatorMission and per-task completion state.
 * MissionBridge writes the mission; the MissionCard UI updates task completion.
 *
 * ── State ─────────────────────────────────────────────────────────────────────
 *   mission        — latest CreatorMission (see missionModel.js)
 *   isGenerating   — true while MissionBridge is computing a new mission
 *
 * ── Actions ───────────────────────────────────────────────────────────────────
 *   SET_MISSION      — replace the full mission with a freshly-generated one
 *   SET_GENERATING   — toggle the loading indicator
 *   COMPLETE_TASK    — mark a single task completed by its id
 *   REFRESH_TICK     — increment so MissionBridge regenerates on demand
 *
 * ── Public API ────────────────────────────────────────────────────────────────
 *   mission              — CreatorMission
 *   isGenerating         — boolean
 *   setMission(m)        — write a generated mission (called by MissionBridge)
 *   setGenerating(v)     — set the loading indicator
 *   completeTask(taskId) — mark a task done and recompute completionProgress
 *   refreshMission()     — force MissionBridge to regenerate
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Wrapped inside CreatorAssistantProvider in App.jsx — the innermost provider.
 *   CreatorAssistantProvider
 *     └─ CreatorMissionProvider  ← here
 *        └─ BrowserRouter
 *           └─ MissionBridge (renderless)
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';

import { createBlankMission } from '../models/missionModel';

// ── Action constants ──────────────────────────────────────────────────────────
const A = {
  SET_MISSION:    'SET_MISSION',
  SET_GENERATING: 'SET_GENERATING',
  COMPLETE_TASK:  'COMPLETE_TASK',
  REFRESH_TICK:   'REFRESH_TICK',
};

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  mission:      createBlankMission(),
  isGenerating: false,
  refreshTick:  0,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function computeProgress(tasks) {
  if (!tasks?.length) return 0;
  const done = tasks.filter(t => t.completed).length;
  return Math.round((done / tasks.length) * 100);
}

function reducer(state, action) {
  switch (action.type) {

    case A.SET_MISSION:
      return { ...state, mission: action.payload, isGenerating: false };

    case A.SET_GENERATING:
      return { ...state, isGenerating: action.payload };

    case A.COMPLETE_TASK: {
      const updatedTasks = state.mission.tasks.map(t =>
        t.id === action.payload ? { ...t, completed: true } : t,
      );
      return {
        ...state,
        mission: {
          ...state.mission,
          tasks:              updatedTasks,
          completionProgress: computeProgress(updatedTasks),
        },
      };
    }

    case A.REFRESH_TICK:
      return { ...state, refreshTick: state.refreshTick + 1 };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const CreatorMissionContext = createContext(null);

export function CreatorMissionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setMission = useCallback(
    (mission) => dispatch({ type: A.SET_MISSION, payload: mission }),
    [],
  );

  const setGenerating = useCallback(
    (value) => dispatch({ type: A.SET_GENERATING, payload: value }),
    [],
  );

  const completeTask = useCallback(
    (taskId) => dispatch({ type: A.COMPLETE_TASK, payload: taskId }),
    [],
  );

  const refreshMission = useCallback(
    () => dispatch({ type: A.REFRESH_TICK }),
    [],
  );

  const value = useMemo(() => ({
    state,
    mission:      state.mission,
    isGenerating: state.isGenerating,
    setMission,
    setGenerating,
    completeTask,
    refreshMission,
  }), [state, setMission, setGenerating, completeTask, refreshMission]);

  return (
    <CreatorMissionContext.Provider value={value}>
      {children}
    </CreatorMissionContext.Provider>
  );
}

export function useCreatorMissionContext() {
  const ctx = useContext(CreatorMissionContext);
  if (!ctx) {
    throw new Error('useCreatorMissionContext must be used within CreatorMissionProvider');
  }
  return ctx;
}

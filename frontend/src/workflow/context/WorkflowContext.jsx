/**
 * workflow/context/WorkflowContext.jsx
 *
 * All Workflow Library state in one place:
 *   - Full workflow list
 *   - Active category filter
 *   - Search query
 *   - Derived filtered list
 *   - Selected workflow (for detail view)
 *   - Preview workflow (for pre-apply preview)
 *   - Dialog open states
 *   - CRUD operations (mock — no backend)
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';

import { MOCK_WORKFLOW_LIBRARY, WORKFLOW_CATEGORIES } from '../data/mockWorkflowData';
import { createBlankWorkflow } from '../models/workflowModel';

// ── Action types ──────────────────────────────────────────────────────────────
const A = {
  SET_CATEGORY:        'SET_CATEGORY',
  SET_SEARCH:          'SET_SEARCH',
  SELECT_WORKFLOW:     'SELECT_WORKFLOW',
  CLEAR_SELECTED:      'CLEAR_SELECTED',
  SET_PREVIEW:         'SET_PREVIEW',
  CLEAR_PREVIEW:       'CLEAR_PREVIEW',
  TOGGLE_FAVORITE:     'TOGGLE_FAVORITE',
  CREATE_WORKFLOW:     'CREATE_WORKFLOW',
  UPDATE_WORKFLOW:     'UPDATE_WORKFLOW',
  DELETE_WORKFLOW:     'DELETE_WORKFLOW',
  DUPLICATE_WORKFLOW:  'DUPLICATE_WORKFLOW',
  RESTORE_VERSION:     'RESTORE_VERSION',
  ACCEPT_AI_SUGGESTION:'ACCEPT_AI_SUGGESTION',
  IGNORE_AI_SUGGESTION:'IGNORE_AI_SUGGESTION',
  OPEN_CREATE:         'OPEN_CREATE',
  CLOSE_CREATE:        'CLOSE_CREATE',
  OPEN_EDIT:           'OPEN_EDIT',
  CLOSE_EDIT:          'CLOSE_EDIT',
  INCREMENT_USAGE:     'INCREMENT_USAGE',
};

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  workflows:       MOCK_WORKFLOW_LIBRARY,
  categories:      WORKFLOW_CATEGORIES,
  activeCategory:  'all',
  searchQuery:     '',
  selectedWorkflow:null,   // Workflow open in detail view
  previewWorkflow: null,   // Workflow in pre-apply preview modal
  createDialogOpen:false,
  editDialogOpen:  false,
  editTarget:      null,   // Workflow being edited
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyVersionRestore(workflow, versionId) {
  // Mock restore: reorder so restored version becomes latest; real impl would diff
  const idx = workflow.versions.findIndex(v => v.id === versionId);
  if (idx < 0) return workflow;
  const version = workflow.versions[idx];
  return {
    ...workflow,
    updatedAt: new Date().toISOString(),
    versions: [
      { ...version, createdAt: new Date().toISOString(), notes: `Restored from ${version.versionLabel}` },
      ...workflow.versions,
    ],
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case A.SET_CATEGORY:
      return { ...state, activeCategory: action.payload };

    case A.SET_SEARCH:
      return { ...state, searchQuery: action.payload };

    case A.SELECT_WORKFLOW:
      return { ...state, selectedWorkflow: action.payload };

    case A.CLEAR_SELECTED:
      return { ...state, selectedWorkflow: null };

    case A.SET_PREVIEW:
      return { ...state, previewWorkflow: action.payload };

    case A.CLEAR_PREVIEW:
      return { ...state, previewWorkflow: null };

    case A.TOGGLE_FAVORITE: {
      const id = action.payload;
      return {
        ...state,
        workflows: state.workflows.map(wf =>
          wf.id === id ? { ...wf, isFavorite: !wf.isFavorite } : wf
        ),
        selectedWorkflow: state.selectedWorkflow?.id === id
          ? { ...state.selectedWorkflow, isFavorite: !state.selectedWorkflow.isFavorite }
          : state.selectedWorkflow,
      };
    }

    case A.CREATE_WORKFLOW: {
      const now = new Date().toISOString();
      const newWf = {
        ...createBlankWorkflow(),
        ...action.payload,
        id:        `wf-user-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        versions:  [{ id: 'v1', versionLabel: 'v1.0', createdAt: now, notes: 'Created.', snapshot: {} }],
      };
      return { ...state, workflows: [newWf, ...state.workflows], createDialogOpen: false };
    }

    case A.UPDATE_WORKFLOW: {
      const { id, patch, saveAsVersion } = action.payload;
      const now = new Date().toISOString();
      return {
        ...state,
        editDialogOpen: false,
        editTarget: null,
        workflows: state.workflows.map(wf => {
          if (wf.id !== id) return wf;
          const updated = { ...wf, ...patch, updatedAt: now };
          if (saveAsVersion) {
            const vLabel = `v${wf.versions.length + 1}.0`;
            updated.versions = [
              { id: `v${Date.now()}`, versionLabel: vLabel, createdAt: now, notes: patch.versionNote || 'Updated.', snapshot: {} },
              ...wf.versions,
            ];
          }
          return updated;
        }),
        selectedWorkflow: state.selectedWorkflow?.id === id
          ? { ...state.selectedWorkflow, ...patch, updatedAt: now }
          : state.selectedWorkflow,
      };
    }

    case A.DELETE_WORKFLOW:
      return {
        ...state,
        workflows: state.workflows.filter(wf => wf.id !== action.payload),
        selectedWorkflow: state.selectedWorkflow?.id === action.payload ? null : state.selectedWorkflow,
      };

    case A.DUPLICATE_WORKFLOW: {
      const source = state.workflows.find(wf => wf.id === action.payload);
      if (!source) return state;
      const now = new Date().toISOString();
      const dupe = {
        ...source,
        id:         `wf-dupe-${Date.now()}`,
        name:       `${source.name} (Copy)`,
        isBuiltIn:  false,
        isFavorite: false,
        usageCount: 0,
        lastUsedAt: null,
        createdAt:  now,
        updatedAt:  now,
        versions:   [{ id: 'v1', versionLabel: 'v1.0', createdAt: now, notes: `Duplicated from ${source.name}.`, snapshot: {} }],
      };
      return { ...state, workflows: [dupe, ...state.workflows] };
    }

    case A.RESTORE_VERSION: {
      const { workflowId, versionId } = action.payload;
      return {
        ...state,
        workflows: state.workflows.map(wf =>
          wf.id === workflowId ? applyVersionRestore(wf, versionId) : wf
        ),
        selectedWorkflow: state.selectedWorkflow?.id === workflowId
          ? applyVersionRestore(state.selectedWorkflow, versionId)
          : state.selectedWorkflow,
      };
    }

    case A.ACCEPT_AI_SUGGESTION: {
      const { workflowId, newName } = action.payload;
      const now = new Date().toISOString();
      return {
        ...state,
        workflows: state.workflows.map(wf =>
          wf.id === workflowId
            ? { ...wf, category: 'My Workflows', aiLearned: true, name: newName || wf.name, updatedAt: now }
            : wf
        ),
      };
    }

    case A.IGNORE_AI_SUGGESTION:
      return {
        ...state,
        workflows: state.workflows.filter(wf => wf.id !== action.payload),
      };

    case A.OPEN_CREATE:
      return { ...state, createDialogOpen: true };

    case A.CLOSE_CREATE:
      return { ...state, createDialogOpen: false };

    case A.OPEN_EDIT:
      return { ...state, editDialogOpen: true, editTarget: action.payload };

    case A.CLOSE_EDIT:
      return { ...state, editDialogOpen: false, editTarget: null };

    case A.INCREMENT_USAGE: {
      const now = new Date().toISOString();
      return {
        ...state,
        workflows: state.workflows.map(wf =>
          wf.id === action.payload
            ? { ...wf, usageCount: wf.usageCount + 1, lastUsedAt: now }
            : wf
        ),
      };
    }

    default:
      return state;
  }
}

// ── Filtering logic (pure function, easy to replace with semantic search) ─────
function filterWorkflows(workflows, category, query) {
  let list = [...workflows];

  // Category filter
  if (category === 'favorites') {
    list = list.filter(wf => wf.isFavorite);
  } else if (category === 'recent') {
    list = list
      .filter(wf => wf.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, 8);
  } else if (category === 'my') {
    list = list.filter(wf => !wf.isBuiltIn);
  } else if (category === 'builtin') {
    list = list.filter(wf => wf.isBuiltIn);
  } else if (category === 'ai') {
    list = list.filter(wf => wf.aiLearned);
  } else if (category !== 'all') {
    list = list.filter(wf => wf.category === category);
  }

  // Search filter — name, category, tags, description
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(wf =>
      wf.name.toLowerCase().includes(q) ||
      wf.category.toLowerCase().includes(q) ||
      wf.description.toLowerCase().includes(q) ||
      wf.tags.some(t => t.includes(q))
    );
  }

  return list;
}

// ── Context ───────────────────────────────────────────────────────────────────
const WorkflowContext = createContext(null);

export function WorkflowProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Derived: filtered workflow list — memoised so components don't re-render on unrelated state changes
  const filteredWorkflows = useMemo(
    () => filterWorkflows(state.workflows, state.activeCategory, state.searchQuery),
    [state.workflows, state.activeCategory, state.searchQuery]
  );

  // ── Action creators ─────────────────────────────────────────────────────────
  const setCategory        = useCallback(cat  => dispatch({ type: A.SET_CATEGORY, payload: cat }), []);
  const setSearch          = useCallback(q    => dispatch({ type: A.SET_SEARCH, payload: q }), []);
  const selectWorkflow     = useCallback(wf   => dispatch({ type: A.SELECT_WORKFLOW, payload: wf }), []);
  const clearSelected      = useCallback(()   => dispatch({ type: A.CLEAR_SELECTED }), []);
  const setPreview         = useCallback(wf   => dispatch({ type: A.SET_PREVIEW, payload: wf }), []);
  const clearPreview       = useCallback(()   => dispatch({ type: A.CLEAR_PREVIEW }), []);
  const toggleFavorite     = useCallback(id   => dispatch({ type: A.TOGGLE_FAVORITE, payload: id }), []);
  const createWorkflow     = useCallback(data => dispatch({ type: A.CREATE_WORKFLOW, payload: data }), []);
  const updateWorkflow     = useCallback((id, patch, saveAsVersion = false) =>
    dispatch({ type: A.UPDATE_WORKFLOW, payload: { id, patch, saveAsVersion } }), []);
  const deleteWorkflow     = useCallback(id   => dispatch({ type: A.DELETE_WORKFLOW, payload: id }), []);
  const duplicateWorkflow  = useCallback(id   => dispatch({ type: A.DUPLICATE_WORKFLOW, payload: id }), []);
  const restoreVersion     = useCallback((workflowId, versionId) =>
    dispatch({ type: A.RESTORE_VERSION, payload: { workflowId, versionId } }), []);
  const acceptAISuggestion = useCallback((workflowId, newName) =>
    dispatch({ type: A.ACCEPT_AI_SUGGESTION, payload: { workflowId, newName } }), []);
  const ignoreAISuggestion = useCallback(id   => dispatch({ type: A.IGNORE_AI_SUGGESTION, payload: id }), []);
  const openCreate         = useCallback(()   => dispatch({ type: A.OPEN_CREATE }), []);
  const closeCreate        = useCallback(()   => dispatch({ type: A.CLOSE_CREATE }), []);
  const openEdit           = useCallback(wf   => dispatch({ type: A.OPEN_EDIT, payload: wf }), []);
  const closeEdit          = useCallback(()   => dispatch({ type: A.CLOSE_EDIT }), []);
  const incrementUsage     = useCallback(id   => dispatch({ type: A.INCREMENT_USAGE, payload: id }), []);

  const value = {
    state,
    filteredWorkflows,
    setCategory,
    setSearch,
    selectWorkflow,
    clearSelected,
    setPreview,
    clearPreview,
    toggleFavorite,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    restoreVersion,
    acceptAISuggestion,
    ignoreAISuggestion,
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    incrementUsage,
  };

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflowContext() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflowContext must be used within WorkflowProvider');
  return ctx;
}

/**
 * project/context/ProjectContext.jsx
 *
 * All Project Library state in one place:
 *   - Full project list
 *   - Active category filter
 *   - Active status filter
 *   - Search query
 *   - View mode (grid / list)
 *   - Selected project (detail view)
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

import { MOCK_PROJECTS } from '../data/mockProjectData';
import { createBlankProject } from '../models/projectModel';

// ── Action types ──────────────────────────────────────────────────────────────
const A = {
  SET_CATEGORY:        'SET_CATEGORY',
  SET_STATUS_FILTER:   'SET_STATUS_FILTER',
  SET_SEARCH:          'SET_SEARCH',
  SET_VIEW_MODE:       'SET_VIEW_MODE',
  SELECT_PROJECT:      'SELECT_PROJECT',
  CLEAR_SELECTED:      'CLEAR_SELECTED',
  TOGGLE_FAVORITE:     'TOGGLE_FAVORITE',
  CREATE_PROJECT:      'CREATE_PROJECT',
  UPDATE_PROJECT:      'UPDATE_PROJECT',
  DELETE_PROJECT:      'DELETE_PROJECT',
  DUPLICATE_PROJECT:   'DUPLICATE_PROJECT',
  ARCHIVE_PROJECT:     'ARCHIVE_PROJECT',
  OPEN_CREATE:         'OPEN_CREATE',
  CLOSE_CREATE:        'CLOSE_CREATE',
  OPEN_EDIT:           'OPEN_EDIT',
  CLOSE_EDIT:          'CLOSE_EDIT',
  OPEN_DELETE_CONFIRM: 'OPEN_DELETE_CONFIRM',
  CLOSE_DELETE_CONFIRM:'CLOSE_DELETE_CONFIRM',
};

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  projects:           MOCK_PROJECTS,
  activeCategory:     'all',
  activeStatusFilter: 'all',
  searchQuery:        '',
  viewMode:           'grid',   // 'grid' | 'list'
  selectedProject:    null,
  createDialogOpen:   false,
  editDialogOpen:     false,
  editTarget:         null,
  deleteConfirmId:    null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case A.SET_CATEGORY:
      return { ...state, activeCategory: action.payload };

    case A.SET_STATUS_FILTER:
      return { ...state, activeStatusFilter: action.payload };

    case A.SET_SEARCH:
      return { ...state, searchQuery: action.payload };

    case A.SET_VIEW_MODE:
      return { ...state, viewMode: action.payload };

    case A.SELECT_PROJECT:
      return { ...state, selectedProject: action.payload };

    case A.CLEAR_SELECTED:
      return { ...state, selectedProject: null };

    case A.TOGGLE_FAVORITE: {
      const id = action.payload;
      const updated = state.projects.map(p =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: new Date().toISOString() } : p
      );
      return {
        ...state,
        projects: updated,
        selectedProject: state.selectedProject?.id === id
          ? { ...state.selectedProject, isFavorite: !state.selectedProject.isFavorite }
          : state.selectedProject,
      };
    }

    case A.CREATE_PROJECT: {
      const now = new Date().toISOString();
      const newProj = {
        ...createBlankProject(),
        ...action.payload,
        id:        `proj-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        recentActivity: [
          { id: `act-${Date.now()}`, type: 'created', label: 'Project created', time: now },
        ],
      };
      return { ...state, projects: [newProj, ...state.projects], createDialogOpen: false };
    }

    case A.UPDATE_PROJECT: {
      const { id, patch } = action.payload;
      const now = new Date().toISOString();
      const updated = state.projects.map(p =>
        p.id === id ? { ...p, ...patch, updatedAt: now } : p
      );
      return {
        ...state,
        editDialogOpen: false,
        editTarget:     null,
        projects:       updated,
        selectedProject: state.selectedProject?.id === id
          ? { ...state.selectedProject, ...patch, updatedAt: now }
          : state.selectedProject,
      };
    }

    case A.DELETE_PROJECT:
      return {
        ...state,
        projects:        state.projects.filter(p => p.id !== action.payload),
        selectedProject: state.selectedProject?.id === action.payload ? null : state.selectedProject,
        deleteConfirmId: null,
      };

    case A.DUPLICATE_PROJECT: {
      const source = state.projects.find(p => p.id === action.payload);
      if (!source) return state;
      const now = new Date().toISOString();
      const dupe = {
        ...source,
        id:         `proj-dupe-${Date.now()}`,
        title:      `${source.title} (Copy)`,
        isFavorite: false,
        status:     'Planning',
        progress:   0,
        createdAt:  now,
        updatedAt:  now,
        recentActivity: [
          { id: `act-${Date.now()}`, type: 'created', label: `Duplicated from "${source.title}"`, time: now },
        ],
      };
      return { ...state, projects: [dupe, ...state.projects] };
    }

    case A.ARCHIVE_PROJECT: {
      const now = new Date().toISOString();
      const updated = state.projects.map(p =>
        p.id === action.payload ? { ...p, status: 'Archived', updatedAt: now } : p
      );
      return {
        ...state,
        projects: updated,
        selectedProject: state.selectedProject?.id === action.payload
          ? { ...state.selectedProject, status: 'Archived', updatedAt: now }
          : state.selectedProject,
      };
    }

    case A.OPEN_CREATE:
      return { ...state, createDialogOpen: true };

    case A.CLOSE_CREATE:
      return { ...state, createDialogOpen: false };

    case A.OPEN_EDIT:
      return { ...state, editDialogOpen: true, editTarget: action.payload };

    case A.CLOSE_EDIT:
      return { ...state, editDialogOpen: false, editTarget: null };

    case A.OPEN_DELETE_CONFIRM:
      return { ...state, deleteConfirmId: action.payload };

    case A.CLOSE_DELETE_CONFIRM:
      return { ...state, deleteConfirmId: null };

    default:
      return state;
  }
}

// ── Filtering logic ───────────────────────────────────────────────────────────
function filterProjects(projects, category, statusFilter, query) {
  let list = [...projects];

  // Category filter
  if (category === 'favorites') {
    list = list.filter(p => p.isFavorite);
  } else if (category !== 'all') {
    list = list.filter(p => p.category === category);
  }

  // Status filter
  if (statusFilter !== 'all') {
    list = list.filter(p => p.status === statusFilter);
  }

  // Search — title, description, tags, category
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return list;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const filteredProjects = useMemo(
    () => filterProjects(state.projects, state.activeCategory, state.activeStatusFilter, state.searchQuery),
    [state.projects, state.activeCategory, state.activeStatusFilter, state.searchQuery]
  );

  // ── Dashboard stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all      = state.projects;
    const active   = all.filter(p => !['Archived', 'Published'].includes(p.status));
    const published = all.filter(p => p.status === 'Published');
    const archived = all.filter(p => p.status === 'Archived');
    return {
      total:     all.length,
      active:    active.length,
      published: published.length,
      archived:  archived.length,
    };
  }, [state.projects]);

  // ── Action creators ─────────────────────────────────────────────────────────
  const setCategory        = useCallback(cat  => dispatch({ type: A.SET_CATEGORY,        payload: cat }),  []);
  const setStatusFilter    = useCallback(s    => dispatch({ type: A.SET_STATUS_FILTER,    payload: s }),    []);
  const setSearch          = useCallback(q    => dispatch({ type: A.SET_SEARCH,           payload: q }),    []);
  const setViewMode        = useCallback(m    => dispatch({ type: A.SET_VIEW_MODE,        payload: m }),    []);
  const selectProject      = useCallback(p    => dispatch({ type: A.SELECT_PROJECT,       payload: p }),    []);
  const clearSelected      = useCallback(()   => dispatch({ type: A.CLEAR_SELECTED }),                     []);
  const toggleFavorite     = useCallback(id   => dispatch({ type: A.TOGGLE_FAVORITE,      payload: id }),   []);
  const createProject      = useCallback(data => dispatch({ type: A.CREATE_PROJECT,       payload: data }), []);
  const updateProject      = useCallback((id, patch) =>
    dispatch({ type: A.UPDATE_PROJECT, payload: { id, patch } }), []);
  const deleteProject      = useCallback(id   => dispatch({ type: A.DELETE_PROJECT,       payload: id }),   []);
  const duplicateProject   = useCallback(id   => dispatch({ type: A.DUPLICATE_PROJECT,    payload: id }),   []);
  const archiveProject     = useCallback(id   => dispatch({ type: A.ARCHIVE_PROJECT,      payload: id }),   []);
  const openCreate         = useCallback(()   => dispatch({ type: A.OPEN_CREATE }),                        []);
  const closeCreate        = useCallback(()   => dispatch({ type: A.CLOSE_CREATE }),                       []);
  const openEdit           = useCallback(p    => dispatch({ type: A.OPEN_EDIT,            payload: p }),    []);
  const closeEdit          = useCallback(()   => dispatch({ type: A.CLOSE_EDIT }),                         []);
  const openDeleteConfirm  = useCallback(id   => dispatch({ type: A.OPEN_DELETE_CONFIRM,  payload: id }),   []);
  const closeDeleteConfirm = useCallback(()   => dispatch({ type: A.CLOSE_DELETE_CONFIRM }),                []);

  const value = {
    state,
    filteredProjects,
    stats,
    setCategory,
    setStatusFilter,
    setSearch,
    setViewMode,
    selectProject,
    clearSelected,
    toggleFavorite,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    archiveProject,
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    openDeleteConfirm,
    closeDeleteConfirm,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider');
  return ctx;
}

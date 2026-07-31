/**
 * project/ProjectLibraryScreen.jsx — Project Library Main Screen
 *
 * Layout (top → bottom):
 *   ┌──────────────────────────────────┐
 *   │  Header: title + AI badge        │
 *   │  ProjectDashboard (stats)        │
 *   │  ProjectSearch + view toggle     │
 *   │  ProjectFilter (cat + status)    │
 *   │  ── Scrollable content ──        │
 *   │    Favorites strip (h-scroll)    │
 *   │    Grid or List of projects      │
 *   │  ── End scrollable ──            │
 *   │  BottomNavBar                    │
 *   └──────────────────────────────────┘
 *
 * Overlays:
 *   ProjectDetail     — slides in from right
 *   CreateProjectDialog — bottom sheet
 *   EditProjectDialog   — bottom sheet
 *   DeleteProjectConfirm — centred modal
 */

import React, { useMemo } from 'react';
import styles from './ProjectLibraryScreen.module.css';

import { ProjectProvider }       from './context/ProjectContext';
import { useProject }            from './hooks/useProject';

import ProjectDashboard          from './components/ProjectDashboard';
import ProjectSearch             from './components/ProjectSearch';
import ProjectFilter             from './components/ProjectFilter';
import ProjectCard               from './components/ProjectCard';
import ProjectDetail             from './components/ProjectDetail';
import ProjectEmptyState         from './components/ProjectEmptyState';
import CreateProjectDialog       from './components/CreateProjectDialog';
import EditProjectDialog         from './components/EditProjectDialog';
import DeleteProjectConfirm      from './components/DeleteProjectConfirm';

import BottomNavBar              from '../camera/components/BottomNavBar';

// ── Inner screen ─────────────────────────────────────────────────────────────
function ProjectLibraryScreenInner() {
  const { state, filteredProjects, selectProject, openCreate } = useProject();
  const { viewMode, searchQuery, activeCategory, activeStatusFilter } = state;

  const isFiltered = activeCategory !== 'all' || activeStatusFilter !== 'all' || searchQuery.trim() !== '';

  const favorites = useMemo(
    () => state.projects.filter(p => p.isFavorite),
    [state.projects]
  );

  const showEmpty = state.projects.length === 0;
  const showFilteredEmpty = !showEmpty && filteredProjects.length === 0 && isFiltered;

  return (
    <div className={styles.screen}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.topTitle}>Project Library</h1>
          <p className={styles.topSubtitle}>{state.projects.length} projects</p>
        </div>
        <div className={styles.topBadge}>
          <span className={styles.aiBadgeDot} />
          AI Ready
        </div>
      </div>

      {/* ── Dashboard stats ───────────────────────────────────────────────── */}
      <div className={styles.dashWrap}>
        <ProjectDashboard />
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className={styles.searchWrap}>
        <ProjectSearch />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <ProjectFilter />

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div className={styles.content}>

        {/* ── Empty states ─────────────────────────────────────────────────── */}
        {showEmpty && <ProjectEmptyState />}
        {showFilteredEmpty && <ProjectEmptyState isFiltered />}

        {/* ── Favorites strip (shown when not filtering) ───────────────────── */}
        {!isFiltered && !showEmpty && favorites.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionTitleAccent}>★ Favorites</span>
              </h2>
              <span className={styles.sectionCount}>{favorites.length}</span>
            </div>
            <div className={styles.hScroll}>
              {favorites.map(p => (
                <div key={p.id} className={styles.hCard}>
                  <ProjectCard project={p} onSelect={selectProject} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main grid / list ─────────────────────────────────────────────── */}
        {!showEmpty && filteredProjects.length > 0 && (
          <div className={styles.section}>
            {isFiltered && (
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Results ({filteredProjects.length})
                  {searchQuery && <span className={styles.sectionSub}> — "{searchQuery}"</span>}
                </h2>
              </div>
            )}
            {!isFiltered && (
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>All Projects</h2>
                <span className={styles.sectionCount}>{filteredProjects.length}</span>
              </div>
            )}

            {viewMode === 'grid' ? (
              <div className={styles.grid}>
                {filteredProjects.map(p => (
                  <ProjectCard key={p.id} project={p} onSelect={selectProject} />
                ))}
              </div>
            ) : (
              <div className={styles.list}>
                {filteredProjects.map(p => (
                  <ProjectCard key={p.id} project={p} onSelect={selectProject} listMode />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* ── Create FAB ────────────────────────────────────────────────────── */}
      <button
        className={styles.fab}
        onClick={openCreate}
        aria-label="Create new project"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5"  y1="12" x2="19" y2="12" />
        </svg>
        <span>New</span>
      </button>

      {/* ── Bottom navigation ─────────────────────────────────────────────── */}
      <BottomNavBar />

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      <ProjectDetail />
      <CreateProjectDialog />
      <EditProjectDialog />
      <DeleteProjectConfirm />
    </div>
  );
}

// ── Root export: wraps provider ───────────────────────────────────────────────
export default function ProjectLibraryScreen() {
  return (
    <ProjectProvider>
      <ProjectLibraryScreenInner />
    </ProjectProvider>
  );
}

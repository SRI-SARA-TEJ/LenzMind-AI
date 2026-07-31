/**
 * project/components/ProjectSearch.jsx
 * Search bar with view-mode toggle (grid / list).
 */
import React from 'react';
import styles from './ProjectSearch.module.css';
import { useProject } from '../hooks/useProject';

export default function ProjectSearch() {
  const { state, setSearch, setViewMode } = useProject();

  return (
    <div className={styles.wrap}>
      <div className={styles.inputWrap}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.input}
          type="text"
          placeholder="Search projects…"
          value={state.searchQuery}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search projects"
        />
        {state.searchQuery && (
          <button className={styles.clear} onClick={() => setSearch('')} aria-label="Clear search">✕</button>
        )}
      </div>

      {/* View toggle */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewBtn} ${state.viewMode === 'grid' ? styles.viewBtnActive : ''}`}
          onClick={() => setViewMode('grid')}
          aria-label="Grid view"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
        <button
          className={`${styles.viewBtn} ${state.viewMode === 'list' ? styles.viewBtnActive : ''}`}
          onClick={() => setViewMode('list')}
          aria-label="List view"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

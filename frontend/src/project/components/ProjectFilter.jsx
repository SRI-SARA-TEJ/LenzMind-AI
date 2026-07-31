/**
 * project/components/ProjectFilter.jsx
 * Horizontal pill row: category filters + status filter.
 */
import React from 'react';
import styles from './ProjectFilter.module.css';
import { useProject } from '../hooks/useProject';
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from '../models/projectModel';

export default function ProjectFilter() {
  const { state, setCategory, setStatusFilter } = useProject();

  return (
    <div className={styles.wrap}>
      {/* Category pills */}
      <div className={styles.row}>
        <div className={styles.scroll}>
          {/* Favorites pill */}
          <button
            key="favorites"
            className={`${styles.pill} ${state.activeCategory === 'favorites' ? styles.pillActive : ''}`}
            onClick={() => setCategory('favorites')}
          >
            ★ Favorites
          </button>
          {PROJECT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`${styles.pill} ${state.activeCategory === cat.id ? styles.pillActive : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status pills */}
      <div className={styles.row}>
        <div className={styles.scroll}>
          <button
            className={`${styles.statusPill} ${state.activeStatusFilter === 'all' ? styles.statusAll : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Status
          </button>
          {PROJECT_STATUSES.map(s => (
            <button
              key={s}
              className={`${styles.statusPill} ${state.activeStatusFilter === s ? styles[`status${s}`] : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

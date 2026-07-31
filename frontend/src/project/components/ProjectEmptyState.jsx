/**
 * project/components/ProjectEmptyState.jsx
 *
 * Shown when no projects exist or no filtered results match.
 */

import React from 'react';
import styles from './ProjectEmptyState.module.css';
import { useProject } from '../hooks/useProject';

export default function ProjectEmptyState({ isFiltered = false }) {
  const { openCreate } = useProject();

  if (isFiltered) {
    return (
      <div className={styles.wrap}>
        <div className={styles.iconWrap}>🔍</div>
        <h3 className={styles.heading}>No projects found</h3>
        <p className={styles.sub}>Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap}>
        <div className={styles.iconCircle}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.iconSvg}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
      </div>
      <h3 className={styles.heading}>Create your first AI Project</h3>
      <p className={styles.sub}>
        Organise your creative work in one place. AI will analyse your content, suggest workflows, and track your progress automatically.
      </p>
      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🤖</span>
          <span className={styles.featureText}>AI-powered summaries & insights</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📊</span>
          <span className={styles.featureText}>Media statistics & progress tracking</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>⚡</span>
          <span className={styles.featureText}>Workflow integration & automation</span>
        </div>
      </div>
      <button className={styles.cta} onClick={openCreate}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5"  y1="12" x2="19" y2="12" />
        </svg>
        Create First Project
      </button>
    </div>
  );
}

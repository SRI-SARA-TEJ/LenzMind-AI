/**
 * project/components/ProjectDashboard.jsx
 * Four-stat overview: total, active, published, archived.
 */
import React from 'react';
import styles from './ProjectDashboard.module.css';
import { useProject } from '../hooks/useProject';

export default function ProjectDashboard() {
  const { stats } = useProject();

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.cardAccent}`}>
          <span className={`${styles.value} ${styles.valueAccent}`}>{stats.total}</span>
          <span className={styles.label}>Total Projects</span>
        </div>
        <div className={styles.card}>
          <span className={styles.value}>{stats.active}</span>
          <span className={styles.label}>Active</span>
        </div>
        <div className={styles.card}>
          <span className={styles.value}>{stats.published}</span>
          <span className={styles.label}>Published</span>
        </div>
        <div className={styles.card}>
          <span className={styles.value}>{stats.archived}</span>
          <span className={styles.label}>Archived</span>
        </div>
      </div>
    </div>
  );
}

/**
 * components/ui/StatCard.jsx
 *
 * Reusable metric card for the dashboard.
 * Displays a label, value, and optional trend indicator.
 */

import React from 'react';
import styles from './StatCard.module.css';

export default function StatCard({ label, value, trend, trendLabel, accentColor }) {
  return (
    <div className={styles.card} style={{ '--accent': accentColor || 'var(--color-accent)' }}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {trend !== undefined && (
        <div className={`${styles.trend} ${trend >= 0 ? styles.up : styles.down}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
        </div>
      )}
    </div>
  );
}

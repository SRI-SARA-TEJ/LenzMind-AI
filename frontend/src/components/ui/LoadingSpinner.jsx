/**
 * components/ui/LoadingSpinner.jsx
 *
 * Two exported components:
 *
 *   <LoadingSpinner />
 *     Inline SVG spinner. Used inside buttons during async actions.
 *     Props: size (default 16), color (default currentColor)
 *
 *   <RecommendationSkeleton count={n} />
 *     Animated skeleton placeholder shown while recommendations are loading.
 *     Matches the approximate visual shape of a RecommendationCard so layout
 *     does not jump when real data arrives.
 */

import React from 'react';
import styles from './LoadingSpinner.module.css';

// ── Inline spinner (for buttons / small contexts) ─────────────────────────────
export function LoadingSpinner({ size = 16, color = 'currentColor' }) {
  return (
    <svg
      className={styles.spinner}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

// ── Recommendation card skeleton ──────────────────────────────────────────────
export function RecommendationSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeletonCard} aria-hidden="true">
          <div className={styles.skeletonRow}>
            <div className={`${styles.bone} ${styles.badge}`} />
            <div className={`${styles.bone} ${styles.confidence}`} />
          </div>
          <div className={`${styles.bone} ${styles.title}`} />
          <div className={`${styles.bone} ${styles.line}`} />
          <div className={`${styles.bone} ${styles.lineShort}`} />
          <div className={styles.skeletonRow} style={{ marginTop: '16px' }}>
            <div className={`${styles.bone} ${styles.btnPrimary}`} />
            <div className={`${styles.bone} ${styles.btnSecondary}`} />
          </div>
        </div>
      ))}
    </>
  );
}

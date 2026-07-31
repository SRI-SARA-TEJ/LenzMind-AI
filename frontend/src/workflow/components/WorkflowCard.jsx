/**
 * workflow/components/WorkflowCard.jsx
 *
 * Reusable card for displaying a single workflow in list/grid views.
 * Shows: name, icon, category, description, usage, last-used, favorite,
 *        AI-Learned badge, quick-apply button.
 *
 * Props:
 *   workflow    {Workflow}  — the workflow object
 *   onSelect    {fn}        — open detail view
 *   onApply     {fn}        — quick-apply (opens preview)
 *   onFavorite  {fn}        — toggle favorite
 *   compact     {boolean}   — reduced height for dense lists
 */

import React from 'react';
import styles from './WorkflowCard.module.css';
import { useWorkflow } from '../hooks/useWorkflow';

function formatLastUsed(iso) {
  if (!iso) return 'Never';
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export default function WorkflowCard({ workflow, onSelect, onApply, compact = false }) {
  const { toggleFavorite } = useWorkflow();

  const handleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(workflow.id);
  };

  const handleApply = (e) => {
    e.stopPropagation();
    onApply?.(workflow);
  };

  return (
    <div
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      onClick={() => onSelect?.(workflow)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect?.(workflow)}
      aria-label={`Open ${workflow.name} workflow`}
    >
      {/* Top row: icon + name + favorite */}
      <div className={styles.top}>
        <span className={styles.icon}>{workflow.icon}</span>
        <div className={styles.nameBlock}>
          <span className={styles.name}>{workflow.name}</span>
          <span className={styles.category}>{workflow.category}</span>
        </div>
        <button
          className={`${styles.favBtn} ${workflow.isFavorite ? styles.favActive : ''}`}
          onClick={handleFavorite}
          aria-label={workflow.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {workflow.isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Description */}
      {!compact && (
        <p className={styles.desc}>{workflow.description}</p>
      )}

      {/* Badges */}
      <div className={styles.badges}>
        {workflow.aiLearned && (
          <span className={styles.badgeAI}>✦ AI Learned</span>
        )}
        {workflow.isBuiltIn && (
          <span className={styles.badgeBuiltIn}>Built-in</span>
        )}
      </div>

      {/* Footer: stats + apply button */}
      <div className={styles.footer}>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            {workflow.usageCount} uses
          </span>
          <span className={styles.statSep}>·</span>
          <span className={styles.stat}>{formatLastUsed(workflow.lastUsedAt)}</span>
        </div>
        <button className={styles.applyBtn} onClick={handleApply} aria-label={`Quick apply ${workflow.name}`}>
          Apply
        </button>
      </div>
    </div>
  );
}

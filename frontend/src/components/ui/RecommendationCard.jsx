/**
 * components/ui/RecommendationCard.jsx
 *
 * Displays a single AI recommendation with:
 *  - Agent name + colour-coded badge
 *  - Visual confidence bar (0–100 %)
 *  - Status chip (pending / accepted / dismissed)
 *  - Mock badge when watsonx.ai is not configured
 *  - Title and full explanation
 *  - Category tags
 *  - Accept / Dismiss action buttons (pending only)
 *
 * Design principle: Users are always in control.
 * Accept and Dismiss are given equal visual weight.
 * Resolved cards (accepted/dismissed) are dimmed, not hidden.
 */

import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './RecommendationCard.module.css';

// ── Agent configuration ───────────────────────────────────────────────────────
const AGENT_CONFIG = {
  'camera-intelligence':  { label: 'Camera',    name: 'Camera Intelligence',  color: 'var(--agent-camera)' },
  'editing-intelligence': { label: 'Editing',   name: 'Editing Intelligence', color: 'var(--agent-editing)' },
  'content-optimization': { label: 'Optimize',  name: 'Content Optimization', color: 'var(--agent-optimize)' },
  'creator-memory':       { label: 'Memory',    name: 'Creator Memory Agent', color: 'var(--color-accent)' },
  'analytics':            { label: 'Analytics', name: 'Analytics Agent',      color: 'var(--agent-analytics)' },
};

// ── Confidence helpers ────────────────────────────────────────────────────────
function confidenceLabel(score) {
  if (score === null || score === undefined) return null;
  if (score >= 0.8) return 'High';
  if (score >= 0.5) return 'Medium';
  return 'Low';
}

function confidenceColor(score) {
  if (score === null || score === undefined) return 'var(--color-text-muted)';
  if (score >= 0.8) return 'var(--color-success)';
  if (score >= 0.5) return 'var(--color-warning)';
  return 'var(--color-error)';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RecommendationCard({ rec, onAction }) {
  const [acting, setActing] = useState(false);

  const agent     = AGENT_CONFIG[rec.agentType] || { label: rec.agentType, name: rec.agentType, color: 'var(--color-accent)' };
  const isPending = rec.userAction === 'pending';
  const isMock    = rec.tags?.includes('mock');
  const pct       = rec.confidence != null ? Math.round(rec.confidence * 100) : null;
  const confLabel = confidenceLabel(rec.confidence);
  const confColor = confidenceColor(rec.confidence);

  async function handleAction(action) {
    setActing(true);
    try {
      await onAction(rec._id, action);
    } finally {
      setActing(false);
    }
  }

  return (
    <div className={`${styles.card} ${!isPending ? styles.resolved : ''}`}
         role="article"
         aria-label={`AI recommendation: ${rec.title}`}>

      {/* ── Header row ───────────────────────────────────────────── */}
      <div className={styles.header}>
        {/* Agent badge */}
        <span
          className={styles.agentBadge}
          style={{ background: agent.color + '22', color: agent.color }}
          title={agent.name}
        >
          {agent.label}
        </span>

        {/* Agent full name */}
        <span className={styles.agentName}>{agent.name}</span>

        {/* Mock indicator */}
        {isMock && (
          <span className={styles.mockBadge} title="watsonx.ai is not configured — this is placeholder data">
            Mock
          </span>
        )}

        {/* Status chip — only when resolved */}
        {!isPending && (
          <span className={`${styles.statusChip} ${styles[rec.userAction]}`}>
            {rec.userAction === 'accepted' ? '✓ Accepted' : '✕ Dismissed'}
          </span>
        )}
      </div>

      {/* ── Title ────────────────────────────────────────────────── */}
      <h4 className={styles.title}>{rec.title}</h4>

      {/* ── Explanation ──────────────────────────────────────────── */}
      <p className={styles.explanation}>{rec.explanation}</p>

      {/* ── Confidence ───────────────────────────────────────────── */}
      {pct !== null && (
        <div className={styles.confidenceRow}>
          <span className={styles.confidenceLabel}>
            Confidence: <strong style={{ color: confColor }}>{confLabel} ({pct}%)</strong>
          </span>
          <div className={styles.confidenceTrack} aria-label={`${pct}% confidence`}>
            <div
              className={styles.confidenceFill}
              style={{ width: `${pct}%`, background: confColor }}
            />
          </div>
        </div>
      )}

      {/* ── Tags ─────────────────────────────────────────────────── */}
      {rec.tags?.filter((t) => t !== 'mock').length > 0 && (
        <div className={styles.tags}>
          {rec.tags.filter((t) => t !== 'mock').map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* ── Actions (pending only) ────────────────────────────────── */}
      {isPending && (
        <div className={styles.actions}>
          <button
            className={styles.acceptBtn}
            onClick={() => handleAction('accepted')}
            disabled={acting}
            aria-label="Accept this AI suggestion"
          >
            {acting
              ? <LoadingSpinner size={14} color="white" />
              : '✓ Accept Suggestion'
            }
          </button>
          <button
            className={styles.dismissBtn}
            onClick={() => handleAction('dismissed')}
            disabled={acting}
            aria-label="Dismiss this AI suggestion"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

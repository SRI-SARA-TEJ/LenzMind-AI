/**
 * memory/components/MemoryInsightCard.jsx
 *
 * Premium AI insight card with animated indicator, priority badge,
 * confidence bar, expected impact, and dismiss + action buttons.
 *
 * Props:
 *   insight   — MemoryInsight object
 *   onDismiss — (id: string) => void
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemoryInsightCard.module.css';

// ── Priority colour definitions ───────────────────────────────────────────────
const PRIORITY_STYLES = {
  Critical: {
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.22)',
    text:   '#f87171',
    dot:    '#ef4444',
    label:  '● Critical',
  },
  High: {
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.22)',
    text:   '#fcd34d',
    dot:    '#f59e0b',
    label:  '▲ High',
  },
  Medium: {
    bg:     'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.22)',
    text:   '#a5b4fc',
    dot:    '#6366f1',
    label:  '◆ Medium',
  },
  Low: {
    bg:     'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
    text:   'rgba(255,255,255,0.35)',
    dot:    'rgba(255,255,255,0.25)',
    label:  '○ Low',
  },
};

// ── Insight type → icon ───────────────────────────────────────────────────────
const TYPE_ICONS = {
  'Quality Tip':             '⭐',
  'Efficiency':              '⚡',
  'Style Match':             '🎨',
  'Platform Fit':            '🌐',
  'Workflow Recommendation': '⚙️',
  'Milestone':               '🏆',
  'Trend':                   '📈',
};

// ── Impact colour ─────────────────────────────────────────────────────────────
const IMPACT_COLOR = { Critical: '#f87171', High: '#fcd34d', Medium: '#a5b4fc', Low: 'rgba(255,255,255,0.35)' };

// ── Expected impact labels (derived from priority) ────────────────────────────
const IMPACT_LABELS = {
  Critical: 'Major quality improvement expected',
  High:     'Significant impact on your content',
  Medium:   'Moderate quality and efficiency gain',
  Low:      'Minor improvement opportunity',
};

// ── AI confidence (mock — derived from priority) ──────────────────────────────
const CONFIDENCE = { Critical: 96, High: 88, Medium: 79, Low: 65 };

export default function MemoryInsightCard({ insight, onDismiss }) {
  const navigate   = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (!insight) return null;

  const p       = PRIORITY_STYLES[insight.priority] ?? PRIORITY_STYLES.Medium;
  const icon    = TYPE_ICONS[insight.type] ?? '💡';
  const conf    = CONFIDENCE[insight.priority] ?? 79;
  const impact  = IMPACT_LABELS[insight.priority] ?? IMPACT_LABELS.Medium;
  const impClr  = IMPACT_COLOR[insight.priority] ?? '#a5b4fc';

  // Format generated date
  const genDate = insight.generatedAt
    ? new Date(insight.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';

  return (
    <div
      className={styles.card}
      style={{ background: p.bg, borderColor: p.border }}
    >
      {/* ── Top row ─────────────────────────────────────────────────── */}
      <div className={styles.topRow}>
        {/* Icon */}
        <div className={styles.iconWrap} style={{ borderColor: p.border }}>
          <span className={styles.icon}>{icon}</span>
        </div>

        {/* Title + type */}
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{insight.title}</span>
            {/* Animated AI indicator */}
            <span className={styles.aiDot} style={{ background: p.dot }} />
          </div>
          <div className={styles.metaRow}>
            <span className={styles.typeBadge}>{insight.type}</span>
            <span className={styles.priorityBadge} style={{ color: p.text }}>
              {p.label}
            </span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          className={styles.dismissBtn}
          onClick={() => onDismiss && onDismiss(insight.id)}
          aria-label="Dismiss insight"
        >
          ✕
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <p className={`${styles.body} ${expanded ? styles.bodyExpanded : ''}`}>
        {insight.body}
      </p>
      {insight.body?.length > 100 && (
        <button className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less ▲' : 'Read more ▼'}
        </button>
      )}

      {/* ── AI Confidence bar ─────────────────────────────────────────── */}
      <div className={styles.confRow}>
        <span className={styles.confLabel}>AI Confidence</span>
        <div className={styles.confTrack}>
          <div
            className={styles.confFill}
            style={{ width: `${conf}%`, background: p.dot }}
          />
        </div>
        <span className={styles.confPct} style={{ color: p.text }}>{conf}%</span>
      </div>

      {/* ── Expected impact ───────────────────────────────────────────── */}
      <div className={styles.impactRow}>
        <span className={styles.impactIcon}>→</span>
        <span className={styles.impactText} style={{ color: impClr }}>{impact}</span>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span className={styles.genDate}>Generated {genDate}</span>
        {insight.actionLabel && insight.actionRoute && (
          <button
            className={styles.actionBtn}
            style={{ borderColor: p.border, color: p.text }}
            onClick={() => navigate(insight.actionRoute)}
          >
            {insight.actionLabel} →
          </button>
        )}
      </div>
    </div>
  );
}

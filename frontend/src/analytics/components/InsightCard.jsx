/**
 * analytics/components/InsightCard.jsx
 *
 * Premium analytics insight card with priority colouring, animated AI dot,
 * confidence bar, metric chip, expected impact, and dismiss/action.
 *
 * Props:
 *   insight   — AnalyticsInsight
 *   onDismiss — (id: string) => void
 */

import React, { useState } from 'react';
import styles from './InsightCard.module.css';

// ── Priority colour system ────────────────────────────────────────────────────
const P_STYLE = {
  Critical: { bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.22)',    text: '#f87171', dot: '#ef4444', label: '● Critical' },
  High:     { bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.22)',   text: '#fcd34d', dot: '#f59e0b', label: '▲ High'     },
  Medium:   { bg: 'rgba(99,102,241,0.07)',   border: 'rgba(99,102,241,0.22)',   text: '#a5b4fc', dot: '#6366f1', label: '◆ Medium'   },
  Low:      { bg: 'rgba(255,255,255,0.03)',  border: 'rgba(255,255,255,0.08)',  text: 'rgba(255,255,255,0.32)', dot: 'rgba(255,255,255,0.22)', label: '○ Low' },
};

// ── Category → icon ───────────────────────────────────────────────────────────
const CAT_ICON = {
  'Quality':      '⭐',
  'Efficiency':   '⚡',
  'Growth':       '📈',
  'Platform':     '🌐',
  'Workflow':     '⚙️',
  'Editing':      '✂️',
  'AI Learning':  '🤝',
};

// ── Trend indicator ───────────────────────────────────────────────────────────
const TREND = {
  up:   { icon: '↑', color: '#4ade80' },
  down: { icon: '↓', color: '#f87171' },
  flat: { icon: '→', color: 'rgba(255,255,255,0.3)' },
};

// ── Impact labels ─────────────────────────────────────────────────────────────
const IMPACT = {
  Critical: { text: 'Major quality improvement expected', color: '#f87171' },
  High:     { text: 'Significant impact on your content',  color: '#fcd34d' },
  Medium:   { text: 'Moderate quality and efficiency gain', color: '#a5b4fc' },
  Low:      { text: 'Minor improvement opportunity',        color: 'rgba(255,255,255,0.32)' },
};

export default function InsightCard({ insight, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  if (!insight) return null;

  const p      = P_STYLE[insight.priority] ?? P_STYLE.Medium;
  const icon   = CAT_ICON[insight.category] ?? '💡';
  const t      = TREND[insight.trend] ?? TREND.flat;
  const impact = IMPACT[insight.priority] ?? IMPACT.Medium;
  const conf   = insight.confidenceScore ?? 75;

  const genDate = insight.generatedAt
    ? new Date(insight.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className={styles.card} style={{ background: p.bg, borderColor: p.border }}>

      {/* ── Top row ─────────────────────────────────────────────────── */}
      <div className={styles.topRow}>
        <div className={styles.iconWrap} style={{ borderColor: p.border }}>
          <span>{icon}</span>
        </div>

        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{insight.title}</span>
            <span className={styles.aiDot} style={{ background: p.dot, color: p.dot }} />
          </div>
          <div className={styles.metaRow}>
            <span className={styles.categoryBadge}>{insight.category}</span>
            <span className={styles.priorityBadge} style={{ color: p.text }}>{p.label}</span>
            <span className={styles.trendBadge} style={{ color: t.color }}>{t.icon}</span>
          </div>
        </div>

        <button
          className={styles.dismissBtn}
          onClick={() => onDismiss && onDismiss(insight.id)}
          aria-label="Dismiss insight"
        >✕</button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <p className={`${styles.body} ${expanded ? styles.bodyExpanded : ''}`}>
        {insight.body}
      </p>
      {(insight.body?.length ?? 0) > 90 && (
        <button className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less ▲' : 'Read more ▼'}
        </button>
      )}

      {/* ── Metric chip ───────────────────────────────────────────────── */}
      {insight.metricValue > 0 && (
        <div className={styles.metricChip}>
          <span className={styles.metricIcon}>{icon}</span>
          <span className={styles.metricVal} style={{ color: p.text }}>
            {insight.metric === 'aiAcceptanceRate' || insight.metric === 'overallAcceptanceRate'
              ? `${insight.metricValue}%`
              : insight.metricValue}
          </span>
          <span className={styles.metricLabel}>{insight.metric?.replace(/([A-Z])/g, ' $1').trim()}</span>
        </div>
      )}

      {/* ── Confidence bar ────────────────────────────────────────────── */}
      <div className={styles.confRow}>
        <span className={styles.confLabel}>AI Confidence</span>
        <div className={styles.confTrack}>
          <div className={styles.confFill} style={{ width: `${conf}%`, background: p.dot }} />
        </div>
        <span className={styles.confPct} style={{ color: p.text }}>{conf}%</span>
      </div>

      {/* ── Impact ───────────────────────────────────────────────────── */}
      <div className={styles.impactRow}>
        <span className={styles.impactArrow}>→</span>
        <span className={styles.impactText} style={{ color: impact.color }}>{impact.text}</span>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span className={styles.genDate}>Generated {genDate}</span>
      </div>
    </div>
  );
}

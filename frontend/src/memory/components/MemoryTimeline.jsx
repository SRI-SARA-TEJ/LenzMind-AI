/**
 * memory/components/MemoryTimeline.jsx
 *
 * Chronological session timeline with date-group headers, filter tabs,
 * and expandable session detail cards.
 */

import React, { useState, useMemo } from 'react';
import styles from './MemoryTimeline.module.css';
import { useCreatorMemory } from '../hooks/useCreatorMemory';

// ── Session type metadata ─────────────────────────────────────────────────────
const TYPE_META = {
  Editing:  { icon: '✂️', color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)'  },
  Shooting: { icon: '📸', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.25)'   },
  Workflow: { icon: '⚙️', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  Export:   { icon: '📤', color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)'  },
  Review:   { icon: '🔍', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)'  },
  Director: { icon: '🎬', color: '#e879f9', bg: 'rgba(232,121,249,0.12)', border: 'rgba(232,121,249,0.25)' },
};

const FILTER_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'Editing',  label: 'Editing' },
  { id: 'Shooting', label: 'Shooting' },
  { id: 'Workflow', label: 'Workflow' },
];

// ── Date grouping helper ──────────────────────────────────────────────────────
function dateGroupLabel(isoStr) {
  const d     = new Date(isoStr);
  const now   = new Date();
  const diffD = Math.floor((now - d) / 86400000);
  if (diffD === 0)  return 'Today';
  if (diffD === 1)  return 'Yesterday';
  if (diffD < 7)    return 'This Week';
  if (diffD < 14)   return 'Last Week';
  if (diffD < 30)   return 'This Month';
  if (diffD < 60)   return 'Last Month';
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ── Format date short ─────────────────────────────────────────────────────────
function fmtDate(isoStr) {
  return new Date(isoStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Quality score colour ──────────────────────────────────────────────────────
function scoreColor(n) {
  if (n == null) return 'rgba(255,255,255,0.25)';
  if (n >= 85)   return '#4ade80';
  if (n >= 70)   return '#fcd34d';
  return '#f87171';
}

// ─────────────────────────────────────────────────────────────────────────────
// Single session card
// ─────────────────────────────────────────────────────────────────────────────
function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[session.type] ?? TYPE_META.Editing;
  const qScore = session.qualityScoreAfter;

  return (
    <div
      className={styles.sessionCard}
      onClick={() => setExpanded(e => !e)}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
    >
      {/* ── Top row ───────────────────────────────────────────────── */}
      <div className={styles.cardTop}>
        {/* Type icon */}
        <div
          className={styles.typeIconWrap}
          style={{ background: meta.bg, borderColor: meta.border }}
        >
          {meta.icon}
        </div>

        {/* Meta */}
        <div className={styles.cardMeta}>
          <span className={styles.cardTitle}>{session.title}</span>
          <div className={styles.cardSubRow}>
            <span
              className={styles.cardType}
              style={{ color: meta.color, borderColor: meta.border }}
            >
              {session.type}
            </span>
            {session.workflowName && (
              <span className={styles.cardWorkflow}>{session.workflowName}</span>
            )}
          </div>
        </div>

        {/* Quality score */}
        {qScore != null && (
          <div className={styles.scoreWrap}>
            <span className={styles.score} style={{ color: scoreColor(qScore) }}>
              {qScore}
            </span>
            <span className={styles.scoreLbl}>Score</span>
          </div>
        )}
      </div>

      {/* ── Progress bar (quality) ─────────────────────────────────── */}
      {qScore != null && (
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width:      `${qScore}%`,
              background: scoreColor(qScore),
            }}
          />
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className={styles.cardFooter}>
        <div className={styles.footerStat}>
          <span className={styles.footerStatIcon}>📅</span>
          <span>{fmtDate(session.completedAt)}</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.footerStatIcon}>⏱</span>
          <span>{session.durationMinutes}m</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.footerStatIcon}>📤</span>
          <span>{session.exportPlatform}</span>
        </div>
        {session.improvementDelta > 0 && (
          <span className={styles.improvementBadge}>+{session.improvementDelta}</span>
        )}
        {session.aiAccepted > 0 && (
          <span className={styles.aiBadge}>
            ✦ {session.aiAccepted} AI
          </span>
        )}
      </div>

      {/* ── Expanded detail ──────────────────────────────────────── */}
      {expanded && (
        <div className={styles.expandedDetail}>
          {session.projectTitle && (
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>📁</span>
              <span className={styles.detailLabel}>Project</span>
              <span className={styles.detailValue}>{session.projectTitle}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>🔲</span>
            <span className={styles.detailLabel}>Resolution</span>
            <span className={styles.detailValue}>{session.exportResolution} {session.exportFormat}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>📊</span>
            <span className={styles.detailLabel}>AI Recs</span>
            <span className={styles.detailValue}>
              {session.aiAccepted}/{session.aiRecommendations} accepted
            </span>
          </div>
          {session.editTypesApplied?.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>✂️</span>
              <span className={styles.detailLabel}>Edits</span>
              <span className={styles.detailValue}>{session.editTypesApplied.join(', ')}</span>
            </div>
          )}
          {session.cameraMovements?.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>🎥</span>
              <span className={styles.detailLabel}>Camera</span>
              <span className={styles.detailValue}>{session.cameraMovements.join(', ')}</span>
            </div>
          )}
          {session.notes && (
            <p className={styles.notesText}>"{session.notes}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main MemoryTimeline
// ─────────────────────────────────────────────────────────────────────────────
export default function MemoryTimeline() {
  const { state } = useCreatorMemory();
  const [activeFilter, setActiveFilter] = useState('all');

  // Filter sessions
  const filtered = useMemo(() => {
    const sorted = [...state.sessions]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    if (activeFilter === 'all') return sorted;
    return sorted.filter(s => s.type === activeFilter);
  }, [state.sessions, activeFilter]);

  // Group by date label
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(s => {
      const lbl = dateGroupLabel(s.completedAt);
      if (!map.has(lbl)) map.set(lbl, []);
      map.get(lbl).push(s);
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <div>
      {/* Filter bar */}
      <div className={styles.filterBar}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.filterBtn} ${activeFilter === tab.id ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter(tab.id)}
            aria-pressed={activeFilter === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grouped session cards */}
      {grouped.length === 0 ? (
        <p className={styles.emptyFilter}>No sessions for this filter.</p>
      ) : (
        grouped.map(([label, sessions]) => (
          <div key={label} className={styles.dateGroup}>
            <p className={styles.dateLabel}>{label}</p>
            {sessions.map(s => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

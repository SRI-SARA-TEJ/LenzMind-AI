/**
 * director/components/DirectorMapView.jsx
 *
 * Feature 4 — Storyboard Director Map.
 * Upgraded from a plain list to a storyboard flow:
 *   START node → Shot Cards (numbered storyboard cells) → FINISH node.
 * Each card shows technique, movement, duration, difficulty badge, notes.
 * Connector lines and transition labels link shots visually.
 */

import React, { useState } from 'react';
import styles from './DirectorMapView.module.css';
import { useDirector } from '../hooks/useDirector';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function diffColor(level) {
  return { Beginner: '#4ade80', Intermediate: '#fcd34d', Advanced: '#f87171' }[level] || '#e8eaf0';
}

function diffBg(level) {
  return {
    Beginner:     'rgba(34,197,94,0.12)',
    Intermediate: 'rgba(245,158,11,0.12)',
    Advanced:     'rgba(239,68,68,0.12)',
  }[level] || 'rgba(255,255,255,0.06)';
}

// ── Storyboard Start/Finish node ──────────────────────────────────────────────
function FlowCap({ label, icon, color }) {
  return (
    <div className={styles.flowCap} style={{ borderColor: color }}>
      <span className={styles.flowCapIcon} style={{ color }}>{icon}</span>
      <span className={styles.flowCapLabel} style={{ color }}>{label}</span>
    </div>
  );
}

// ── Storyboard connector (line + transition label) ────────────────────────────
function FlowConnector({ label }) {
  return (
    <div className={styles.connector}>
      <div className={styles.connectorLine} />
      <div className={styles.connectorBadge}>
        <span className={styles.connectorArrow}>↓</span>
        <span className={styles.connectorLabel}>{label}</span>
      </div>
      <div className={styles.connectorLine} />
    </div>
  );
}

// ── Storyboard shot card ──────────────────────────────────────────────────────
function ShotCard({ shot, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.shotCard} onClick={() => setExpanded(e => !e)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}>

      {/* Shot number badge */}
      <div className={styles.shotNumWrap}>
        <div className={styles.shotNum}>{index + 1}</div>
      </div>

      {/* Card body */}
      <div className={styles.shotBody}>
        {/* Title row */}
        <div className={styles.shotTop}>
          <span className={styles.shotName}>{shot.name}</span>
          <span
            className={styles.shotDiff}
            style={{ color: diffColor(shot.difficulty), background: diffBg(shot.difficulty) }}
          >
            {shot.difficulty}
          </span>
        </div>

        {/* Technique + movement row */}
        <div className={styles.shotMeta}>
          <span className={styles.shotTech}>{shot.technique}</span>
          <span className={styles.shotSep}>·</span>
          <span className={styles.shotMove}>{shot.movement}</span>
          <span className={styles.shotDur}>⏱ {shot.durationSeconds}s</span>
        </div>

        {/* Expanded notes */}
        {expanded && shot.notes && (
          <p className={styles.shotNotes}>{shot.notes}</p>
        )}

        {/* Expand hint */}
        {shot.notes && (
          <div className={styles.shotExpand}>
            <svg
              className={`${styles.expandChevron} ${expanded ? styles.expandOpen : ''}`}
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DirectorMapView() {
  const { state, clearSelectedMap, deleteDirectorMap } = useDirector();
  const { selectedMap: dm } = state;

  if (!dm) return null;

  const totalDur = dm.shots.reduce((s, sh) => s + sh.durationSeconds, 0);

  const handleDelete = () => {
    deleteDirectorMap(dm.id);
    clearSelectedMap();
  };

  return (
    <div className={styles.screen}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={clearSelectedMap} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.topMid}>
          <h1 className={styles.topTitle}>{dm.name}</h1>
          <p className={styles.topSub}>Director Map · {formatDate(dm.createdAt)}</p>
        </div>
        <div className={styles.storyboardBadge}>Storyboard</div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Meta chips */}
        <div className={styles.meta}>
          <div className={styles.metaItem}>🎬 {dm.shots.length} shot{dm.shots.length !== 1 ? 's' : ''}</div>
          <div className={styles.metaItem}>⏱ ~{totalDur}s total</div>
          {dm.workflowName && (
            <div className={`${styles.metaItem} ${styles.workflowChip}`}>⚡ {dm.workflowName}</div>
          )}
        </div>

        {/* Description */}
        {dm.description && <p className={styles.description}>{dm.description}</p>}

        {/* Storyboard flow */}
        <p className={styles.sectionTitle}>Shot Storyboard</p>

        <div className={styles.storyboard}>
          {/* START node */}
          <FlowCap label="START" icon="▶" color="#4ade80" />

          {dm.shots.map((shot, i) => {
            const isLast = i === dm.shots.length - 1;
            return (
              <React.Fragment key={shot.id}>
                <FlowConnector label={i === 0 ? 'Begin' : dm.shots[i - 1].transition} />
                <ShotCard shot={shot} index={i} />
                {!isLast && null /* connector rendered at start of next iteration */}
              </React.Fragment>
            );
          })}

          {/* Last connector + FINISH */}
          {dm.shots.length > 0 && (
            <FlowConnector label={dm.shots[dm.shots.length - 1].transition} />
          )}
          <FlowCap label="FINISH" icon="■" color="#f87171" />
        </div>

        {/* AI Analysis placeholder — [AI_FUTURE] */}
        <div className={styles.aiSection}>
          <div className={styles.aiSectionTop}>
            <span className={styles.aiBadge}>✦ AI Analysis</span>
            <span className={styles.aiComingSoon}>Coming Soon</span>
          </div>
          <div className={styles.aiPlaceholders}>
            {[
              { label: 'Cinematic Score',  val: 0 },
              { label: 'Flow Rating',      val: 0 },
              { label: 'Creator Memory',   val: 0 },
            ].map(({ label, val }) => (
              <div key={label} className={styles.aiPlaceholderRow}>
                <span className={styles.aiPlaceholderLabel}>{label}</span>
                <div className={styles.aiPlaceholderBar}>
                  <div className={styles.aiPlaceholderFill} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className={styles.aiPlaceholderNote}>
            IBM watsonx.ai will analyse your cinematography pattern and provide personalised coaching.
          </p>
        </div>

        <div style={{ height: 80 }} />
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className={styles.actionBar}>
        <button className={styles.btnDelete} onClick={handleDelete}>Delete</button>
        <button className={styles.btnGhost} onClick={clearSelectedMap}>Close</button>
      </div>
    </div>
  );
}

/**
 * director/components/CameraPrep.jsx
 *
 * Feature 6 — Automatic Camera Preparation sequence.
 * UI-only: cycles through Analysing Scene → Optimising Camera → Camera Ready.
 * On completion, calls dismissCameraPrep() which transitions to guided-session.
 */

import React, { useState, useEffect } from 'react';
import styles from './CameraPrep.module.css';
import { useDirector } from '../hooks/useDirector';

// ── Phase definitions ─────────────────────────────────────────────────────────
const PHASES = [
  {
    id: 'analyse',
    label: 'Analysing Scene',
    color: '#f59e0b',
    dotColor: '#fbbf24',
    items: [
      { key: 'lighting',     label: 'Lighting',     icon: '💡' },
      { key: 'subject',      label: 'Subject',      icon: '👤' },
      { key: 'movement',     label: 'Movement',     icon: '🔄' },
      { key: 'environment',  label: 'Environment',  icon: '🌍' },
    ],
    durationMs: 2200,
  },
  {
    id: 'optimise',
    label: 'Optimising Camera',
    color: '#3b82f6',
    dotColor: '#60a5fa',
    items: [
      { key: 'exposure',    label: 'Exposure',     icon: '☀️' },
      { key: 'iso',         label: 'ISO',          icon: '📊' },
      { key: 'wb',          label: 'White Balance', icon: '🌡️' },
      { key: 'hdr',         label: 'HDR',          icon: '✨' },
      { key: 'focus',       label: 'Focus',        icon: '🎯' },
    ],
    durationMs: 2400,
  },
  {
    id: 'ready',
    label: 'Camera Ready',
    color: '#22c55e',
    dotColor: '#4ade80',
    items: [],
    durationMs: 1000,
  },
];

// ── Animated bar ──────────────────────────────────────────────────────────────
function AnimatedBar({ active, color }) {
  return (
    <div className={styles.barTrack}>
      <div
        className={`${styles.barFill} ${active ? styles.barFillAnimate : ''}`}
        style={{ '--bar-color': color }}
      />
    </div>
  );
}

// ── Check item row ────────────────────────────────────────────────────────────
function CheckItem({ icon, label, done, active }) {
  return (
    <div className={`${styles.checkItem} ${done ? styles.checkDone : ''} ${active ? styles.checkActive : ''}`}>
      <span className={styles.checkIcon}>{done ? '✓' : active ? '⟳' : icon}</span>
      <span className={styles.checkLabel}>{label}</span>
      {active && <span className={styles.checkSpinner} />}
      {done && <span className={styles.checkOk}>OK</span>}
    </div>
  );
}

export default function CameraPrep() {
  const { state, dismissCameraPrep } = useDirector();
  const { cameraPrepOpen } = state;

  const [phaseIdx, setPhaseIdx]   = useState(0);
  const [itemIdx,  setItemIdx]    = useState(0);
  const [doneItems, setDoneItems] = useState({});
  const [finished, setFinished]   = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (cameraPrepOpen) {
      setPhaseIdx(0);
      setItemIdx(0);
      setDoneItems({});
      setFinished(false);
    }
  }, [cameraPrepOpen]);

  // Tick through items phase-by-phase
  useEffect(() => {
    if (!cameraPrepOpen || finished) return;

    const phase = PHASES[phaseIdx];
    if (!phase) return;

    if (phase.id === 'ready') {
      // Final phase — mark as finished after a short pause
      const t = setTimeout(() => setFinished(true), phase.durationMs);
      return () => clearTimeout(t);
    }

    const items = phase.items;
    if (itemIdx >= items.length) {
      // Move to next phase
      const t = setTimeout(() => {
        setPhaseIdx(p => p + 1);
        setItemIdx(0);
      }, 400);
      return () => clearTimeout(t);
    }

    const itemKey = `${phase.id}-${items[itemIdx].key}`;
    const perItem = Math.floor(phase.durationMs / items.length);
    const t = setTimeout(() => {
      setDoneItems(d => ({ ...d, [itemKey]: true }));
      setItemIdx(i => i + 1);
    }, perItem);
    return () => clearTimeout(t);
  }, [cameraPrepOpen, phaseIdx, itemIdx, doneItems, finished]);

  // Auto-dismiss after finishing
  useEffect(() => {
    if (finished) {
      const t = setTimeout(dismissCameraPrep, 900);
      return () => clearTimeout(t);
    }
  }, [finished, dismissCameraPrep]);

  if (!cameraPrepOpen) return null;

  const phase = PHASES[Math.min(phaseIdx, PHASES.length - 1)];

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>

        {/* Phase indicator */}
        <div className={styles.phases}>
          {PHASES.map((p, i) => (
            <div key={p.id} className={`${styles.phase} ${i === phaseIdx ? styles.phaseActive : ''} ${i < phaseIdx ? styles.phaseDone : ''}`}>
              <div className={styles.phaseDot} style={{ background: i <= phaseIdx ? p.dotColor : 'rgba(255,255,255,0.15)' }} />
              {i < PHASES.length - 1 && (
                <div className={`${styles.phaseLine} ${i < phaseIdx ? styles.phaseLineDone : ''}`}
                  style={i < phaseIdx ? { background: PHASES[i + 1].dotColor } : {}} />
              )}
            </div>
          ))}
        </div>

        {/* Phase label */}
        <div className={styles.phaseLabel}>
          <span className={styles.phaseDotInline} style={{ background: phase.dotColor }} />
          <span className={styles.phaseLabelText} style={{ color: phase.color }}>
            {phase.label}
          </span>
          {!finished && <span className={styles.ellipsis}>…</span>}
        </div>

        {/* Animated bar */}
        <AnimatedBar active={!finished} color={phase.color} />

        {/* Check items */}
        {phase.items.length > 0 && (
          <div className={styles.checkList}>
            {phase.items.map((item, i) => {
              const key   = `${phase.id}-${item.key}`;
              const done  = !!doneItems[key];
              const active = !done && i === itemIdx;
              return (
                <CheckItem key={key} icon={item.icon} label={item.label} done={done} active={active} />
              );
            })}
          </div>
        )}

        {/* Ready state */}
        {finished && (
          <div className={styles.readyState}>
            <div className={styles.readyIcon}>✓</div>
            <p className={styles.readyLabel}>Camera Ready</p>
            <p className={styles.readySub}>Starting session…</p>
          </div>
        )}
      </div>
    </div>
  );
}

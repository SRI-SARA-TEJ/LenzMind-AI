/**
 * director/components/LiveGuidanceOverlay.jsx
 *
 * Feature 2 — Live Camera Guidance Overlay.
 * Shown INSIDE the GuidedSession over the "motion illustration" area.
 * Displays dynamic directional arrows and text cues based on the
 * current step's camera movement.
 * Auto-fades after a few seconds (user can re-show by tapping).
 */

import React, { useState, useEffect } from 'react';
import styles from './LiveGuidanceOverlay.module.css';

// ── Movement → guidance mapping ───────────────────────────────────────────────
const GUIDANCE = {
  'Stationary':   { arrows: [],           cues: ['Hold Position', 'Keep Subject Centred'],          icon: '⊙' },
  'Slow Walk':    { arrows: ['forward'],   cues: ['Walk Forward', 'Heel-to-Toe', 'Bent Knees'],      icon: '↑' },
  'Fast Walk':    { arrows: ['forward'],   cues: ['Walk Briskly', 'Keep Horizon Level'],              icon: '↑↑' },
  'Side Slide':   { arrows: ['right'],     cues: ['Slide Right', 'Keep Distance Constant'],           icon: '→' },
  'Push Forward': { arrows: ['forward'],   cues: ['Move Closer', 'Push In Slowly'],                  icon: '↑' },
  'Pull Back':    { arrows: ['backward'],  cues: ['Step Back', 'Reveal the Scene'],                  icon: '↓' },
  'Pan Left':     { arrows: ['left'],      cues: ['← Move Left', 'Rotate Smoothly'],                 icon: '←' },
  'Pan Right':    { arrows: ['right'],     cues: ['→ Move Right', 'Rotate Smoothly'],                icon: '→' },
  'Tilt Up':      { arrows: ['up'],        cues: ['↑ Tilt Up', 'Slow Motion'],                       icon: '↑' },
  'Tilt Down':    { arrows: ['down'],      cues: ['↓ Tilt Down', 'Keep Subject in Frame'],           icon: '↓' },
  'Orbit CW':     { arrows: ['orbit-cw'],  cues: ['↻ Rotate Clockwise', 'Keep Distance Constant'],  icon: '↻' },
  'Orbit CCW':    { arrows: ['orbit-ccw'], cues: ['↺ Rotate Counter', 'Even Speed'],                 icon: '↺' },
  'Whip Right':   { arrows: ['whip'],      cues: ['WHIP →', 'Fast! Do Not Stop'],                    icon: '⟹' },
  'Whip Left':    { arrows: ['whip'],      cues: ['← WHIP', 'Fast! Do Not Stop'],                    icon: '⟸' },
  'Handheld':     { arrows: [],            cues: ['Natural Movement', 'Slight Sway OK'],              icon: '〰' },
  'Crane Up':     { arrows: ['up'],        cues: ['↑ Rise Up', 'Smooth Elevation'],                  icon: '↑' },
};

const ARROW_CONFIGS = {
  forward:    { rotate: 0,   label: 'Forward',  x: '50%', y: '30%' },
  backward:   { rotate: 180, label: 'Back',     x: '50%', y: '70%' },
  left:       { rotate: -90, label: 'Left',     x: '20%', y: '50%' },
  right:      { rotate: 90,  label: 'Right',    x: '80%', y: '50%' },
  up:         { rotate: 0,   label: 'Up',       x: '50%', y: '25%' },
  down:       { rotate: 180, label: 'Down',     x: '50%', y: '75%' },
  'orbit-cw': { rotate: 45,  label: '↻',        x: '75%', y: '30%' },
  'orbit-ccw':{ rotate: -45, label: '↺',        x: '25%', y: '30%' },
  whip:       { rotate: 90,  label: 'WHIP',     x: '50%', y: '50%' },
};

export default function LiveGuidanceOverlay({ movement, visible, onTap }) {
  const [cueIdx, setCueIdx] = useState(0);

  const g = GUIDANCE[movement] || GUIDANCE['Stationary'];

  // Cycle through cues
  useEffect(() => {
    if (!visible || g.cues.length < 2) return;
    const t = setInterval(() => setCueIdx(i => (i + 1) % g.cues.length), 2000);
    return () => clearInterval(t);
  }, [visible, g.cues.length]);

  // Reset cue index when movement changes
  useEffect(() => { setCueIdx(0); }, [movement]);

  if (!visible) {
    return (
      <button className={styles.showBtn} onClick={onTap} aria-label="Show guidance overlay">
        <span className={styles.showBtnIcon}>{g.icon}</span>
        <span className={styles.showBtnText}>Show Guidance</span>
      </button>
    );
  }

  return (
    <div className={styles.overlay} onClick={onTap} aria-label="Camera guidance overlay" role="img">
      {/* Background vignette */}
      <div className={styles.vignette} />

      {/* Movement arrows */}
      {g.arrows.map(arrow => {
        const cfg = ARROW_CONFIGS[arrow];
        if (!cfg) return null;
        return (
          <div
            key={arrow}
            className={styles.arrowWrap}
            style={{ left: cfg.x, top: cfg.y, transform: `translate(-50%, -50%) rotate(${cfg.rotate}deg)` }}
          >
            <svg
              className={styles.arrow}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            <span className={styles.arrowLabel}>{cfg.label}</span>
          </div>
        );
      })}

      {/* Centre icon */}
      <div className={styles.centreIcon}>{g.icon}</div>

      {/* Cycling cue text */}
      <div className={styles.cueRow}>
        <div className={styles.cueText} key={cueIdx}>{g.cues[cueIdx]}</div>
      </div>

      {/* Tap to dismiss hint */}
      <p className={styles.tapHint}>Tap to hide</p>
    </div>
  );
}

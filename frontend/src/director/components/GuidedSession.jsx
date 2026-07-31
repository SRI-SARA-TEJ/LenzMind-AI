/**
 * director/components/GuidedSession.jsx
 *
 * AI Guided Mode — Step-by-step cinematography guide.
 *
 * Features (polished):
 *   F2 — Live Camera Guidance Overlay (shows/hides on tap)
 *   F3 — Dynamic Cinematography Guidance (animated SVG motion paths)
 *   F9 — UI polish: smooth step transitions, better typography, animations
 */

import React, { useState } from 'react';
import styles from './GuidedSession.module.css';
import { useDirector } from '../hooks/useDirector';
import LiveGuidanceOverlay from './LiveGuidanceOverlay';

// ── F3: Dynamic motion path data ─────────────────────────────────────────────
const MOTION_DATA = {
  'Wide Shot': {
    path:      'M4 12 L20 12 M4 6 L20 6 M4 18 L20 18',
    start:     { x: 12, y: 12 }, end: { x: 12, y: 12 },
    animated:  false,
    subject:   { x: 12, y: 12, label: 'Scene' },
    camera:    { x: 4, y: 12, label: 'Far Back' },
    desc:      'Stay far back — show the full environment',
  },
  'Close-up': {
    path:      'M8 8 L16 8 L16 16 L8 16 Z',
    start:     { x: 18, y: 12 }, end: { x: 10, y: 12 },
    animated:  true,
    motionPath:'M18 12 L10 12',
    subject:   { x: 12, y: 12, label: 'Subject' },
    camera:    { x: 18, y: 12, label: 'Move In' },
    desc:      'Move very close — fill the frame',
  },
  'Tracking Shot': {
    path:      'M4 17 L4 7 L7 7 L7 17 Z M17 7 L17 17',
    start:     { x: 4, y: 12 }, end: { x: 20, y: 12 },
    animated:  true,
    motionPath:'M4 15 L20 15',
    subject:   { x: 12, y: 9, label: 'Subject' },
    camera:    { x: 4, y: 15, label: 'Follow →' },
    desc:      'Walk alongside — follow the subject\'s path',
  },
  'Push In': {
    path:      'M12 18 L12 6',
    start:     { x: 12, y: 18 }, end: { x: 12, y: 8 },
    animated:  true,
    motionPath:'M12 18 L12 8',
    subject:   { x: 12, y: 6, label: 'Subject' },
    camera:    { x: 12, y: 18, label: 'Push In ↑' },
    desc:      'Move closer — push the camera forward',
  },
  'Pull Out': {
    path:      'M12 6 L12 18',
    start:     { x: 12, y: 6 }, end: { x: 12, y: 18 },
    animated:  true,
    motionPath:'M12 6 L12 18',
    subject:   { x: 12, y: 6, label: 'Subject' },
    camera:    { x: 12, y: 18, label: 'Pull Back ↓' },
    desc:      'Step back — reveal the scene around the subject',
  },
  'Pan': {
    path:      'M4 12 L20 12',
    start:     { x: 4, y: 12 }, end: { x: 20, y: 12 },
    animated:  true,
    motionPath:'M4 12 L20 12',
    subject:   { x: 12, y: 8, label: 'Scene' },
    camera:    { x: 4, y: 12, label: 'Pan →' },
    desc:      'Rotate your body — left to right sweep',
  },
  'Tilt': {
    path:      'M12 4 L12 20',
    start:     { x: 12, y: 20 }, end: { x: 12, y: 4 },
    animated:  true,
    motionPath:'M12 20 L12 4',
    subject:   { x: 12, y: 12, label: 'Subject' },
    camera:    { x: 12, y: 20, label: 'Tilt ↑' },
    desc:      'Rotate up — from feet to face',
  },
  'Orbit': {
    path:      'M12 5 A7 7 0 1 1 11.99 5',
    start:     { x: 19, y: 12 }, end: { x: 19, y: 12 },
    animated:  true,
    motionPath:'M19 12 A7 7 0 1 1 18.99 12',
    subject:   { x: 12, y: 12, label: 'Subject' },
    camera:    { x: 19, y: 12, label: 'Walk ↻' },
    desc:      'Walk in a full circle around the subject',
  },
  'Reveal Shot': {
    path:      'M4 12 C8 4 16 20 20 12',
    start:     { x: 6, y: 18 }, end: { x: 18, y: 6 },
    animated:  true,
    motionPath:'M6 18 C8 12 16 12 18 6',
    subject:   { x: 18, y: 6, label: 'Revealed' },
    camera:    { x: 6, y: 18, label: 'Start Here' },
    desc:      'Start hidden — move to reveal the main scene',
  },
  'Whip Pan': {
    path:      'M4 12 Q12 6 20 12',
    start:     { x: 4, y: 12 }, end: { x: 20, y: 12 },
    animated:  true,
    motionPath:'M4 12 Q12 6 20 12',
    subject:   { x: 12, y: 12, label: 'Scene' },
    camera:    { x: 4, y: 12, label: 'WHIP →' },
    desc:      'Fast whip right — maximum speed, no stopping',
  },
  'Dutch Angle': {
    path:      'M6 18 L18 6',
    start:     { x: 6, y: 18 }, end: { x: 18, y: 6 },
    animated:  false,
    subject:   { x: 12, y: 12, label: 'Tilted' },
    camera:    { x: 8, y: 16, label: 'Tilt 15°' },
    desc:      'Tilt 15–20 degrees to create tension',
  },
  "Bird's Eye": {
    path:      'M12 4 L12 20 M4 12 L20 12',
    start:     { x: 12, y: 4 }, end: { x: 12, y: 4 },
    animated:  false,
    subject:   { x: 12, y: 12, label: 'Subject' },
    camera:    { x: 12, y: 4, label: 'Above ↓' },
    desc:      'Hold camera directly above pointing straight down',
  },
  'Low Angle': {
    path:      'M2 20 L22 20 M12 20 L12 4',
    start:     { x: 12, y: 20 }, end: { x: 12, y: 4 },
    animated:  false,
    subject:   { x: 12, y: 4, label: 'Subject' },
    camera:    { x: 12, y: 20, label: 'Ground ↑' },
    desc:      'Place camera at ground level — point upward',
  },
  'Static Shot': {
    path:      'M4 4 L20 4 L20 20 L4 20 Z',
    start:     { x: 12, y: 12 }, end: { x: 12, y: 12 },
    animated:  false,
    subject:   { x: 12, y: 12, label: 'Subject' },
    camera:    { x: 4, y: 4, label: 'Still' },
    desc:      'Do not move — observe and let life happen',
  },
  'Match Cut': {
    path:      'M3 12 L10 12 M14 12 L21 12',
    start:     { x: 3, y: 12 }, end: { x: 21, y: 12 },
    animated:  false,
    subject:   { x: 12, y: 12, label: 'Match' },
    camera:    { x: 3, y: 12, label: 'Scene A→B' },
    desc:      'Match the body position exactly between scenes',
  },
  'Over the Shoulder': {
    path:      'M4 18 C6 10 10 7 14 7 C18 7 20 10 20 14',
    start:     { x: 4, y: 18 }, end: { x: 20, y: 14 },
    animated:  false,
    subject:   { x: 20, y: 8, label: 'Subject' },
    camera:    { x: 4, y: 18, label: 'Behind' },
    desc:      'Shoot over the first person\'s shoulder',
  },
};

// ── F3: Animated motion path SVG ─────────────────────────────────────────────
function MotionPathSVG({ technique, motionIcon }) {
  const data = MOTION_DATA[technique] || MOTION_DATA['Static Shot'];

  return (
    <div className={styles.motionWrap}>
      <div className={styles.motionSVGBox}>
        <svg viewBox="0 0 24 24" className={styles.motionSVG} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Grid */}
          <line x1="0" y1="12" x2="24" y2="12" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <line x1="12" y1="0" x2="12" y2="24" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

          {/* Static reference path */}
          <path d={data.path} stroke="rgba(165,180,252,0.2)" strokeWidth="1" fill="none" />

          {/* Animated motion path */}
          {data.animated && data.motionPath && (
            <path
              d={data.motionPath}
              stroke="rgba(165,180,252,0.8)"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="30"
              strokeDashoffset="30"
              className={styles.motionPathAnim}
            />
          )}

          {/* Camera dot (start position) */}
          <circle cx={data.camera.x} cy={data.camera.y} r="1.5" fill="#6366f1" />
          {data.animated && (
            <circle cx={data.camera.x} cy={data.camera.y} r="1.5" fill="#6366f1" className={styles.camDotAnim}
              style={{ '--ex': data.end.x - data.camera.x, '--ey': data.end.y - data.camera.y }} />
          )}

          {/* Subject dot */}
          <circle cx={data.subject.x} cy={data.subject.y} r="2.5" fill="rgba(251,191,36,0.7)" />
          <circle cx={data.subject.x} cy={data.subject.y} r="4" fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="0.7" />
        </svg>

        {/* Emoji icon overlay */}
        <span className={styles.motionEmoji}>{motionIcon}</span>
      </div>

      {/* Labels */}
      <div className={styles.motionLabels}>
        <div className={styles.motionLabelItem}>
          <span className={styles.motionLabelDot} style={{ background: '#6366f1' }} />
          <span className={styles.motionLabelText}>{data.camera.label}</span>
        </div>
        <div className={styles.motionArrow}>
          {data.animated ? '→' : '—'}
        </div>
        <div className={styles.motionLabelItem}>
          <span className={styles.motionLabelDot} style={{ background: 'rgba(251,191,36,0.8)' }} />
          <span className={styles.motionLabelText}>{data.subject.label}</span>
        </div>
      </div>

      <p className={styles.motionDesc}>{data.desc}</p>
    </div>
  );
}

// ── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ total, current, onDotClick }) {
  return (
    <div className={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          className={`${styles.dot} ${i === current ? styles.dotActive : i < current ? styles.dotDone : ''}`}
          onClick={() => onDotClick(i)}
          aria-label={`Step ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ── Difficulty chip ───────────────────────────────────────────────────────────
function DifficultyChip({ level }) {
  const cols = { Beginner: 'rgba(34,197,94,0.18)', Intermediate: 'rgba(245,158,11,0.18)', Advanced: 'rgba(239,68,68,0.18)' };
  const txts = { Beginner: '#4ade80', Intermediate: '#fcd34d', Advanced: '#f87171' };
  return (
    <span className={styles.diffChip} style={{ background: cols[level], color: txts[level] }}>
      {level}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GuidedSession() {
  const {
    state,
    clearTemplate,
    nextStep,
    prevStep,
    setGuidedStep,
    completeGuidedSession,
  } = useDirector();

  const { selectedTemplate: tpl, currentStepIndex } = state;
  const [tipsExpanded,   setTipsExpanded]   = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);

  if (!tpl) return null;

  const step     = tpl.steps[currentStepIndex];
  const total    = tpl.steps.length;
  const isFirst  = currentStepIndex === 0;
  const isLast   = currentStepIndex === total - 1;
  const progress = Math.round(((currentStepIndex + 1) / total) * 100);

  // Reset overlay visibility when step changes
  const handleNext = () => { setOverlayVisible(true); setTipsExpanded(false); nextStep(); };
  const handlePrev = () => { setOverlayVisible(true); setTipsExpanded(false); prevStep(); };
  const handleDot  = (i) => { setOverlayVisible(true); setTipsExpanded(false); setGuidedStep(i); };

  return (
    <div className={styles.screen}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={clearTemplate} aria-label="Back to templates">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.topMid}>
          <span className={styles.templateName}>{tpl.icon} {tpl.name}</span>
          <span className={styles.stepCounter}>Shot {currentStepIndex + 1} of {total}</span>
        </div>
        <DifficultyChip level={step.difficulty} />
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      <div className={styles.progressBarWrap}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        <span className={styles.progressLabel}>{progress}%</span>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Technique badge row */}
        <div className={styles.techniqueRow}>
          <span className={styles.techniqueBadge}>{step.technique}</span>
          <span className={styles.transitionBadge}>→ {step.transition}</span>
          <span className={styles.durationBadge}>⏱ {step.durationSeconds}s</span>
        </div>

        {/* Step title */}
        <h2 className={styles.stepTitle}>{step.title}</h2>

        {/* F2: Live Guidance Overlay / F3: Dynamic motion path */}
        <LiveGuidanceOverlay
          movement={step.movement}
          visible={overlayVisible}
          onTap={() => setOverlayVisible(v => !v)}
        />

        {/* Show motion path only when guidance overlay is hidden */}
        {!overlayVisible && (
          <MotionPathSVG technique={step.technique} motionIcon={step.motionIcon} />
        )}

        {/* Main instruction */}
        <div className={styles.instructionCard}>
          <span className={styles.instructionLabel}>📋 How to do it</span>
          <p className={styles.instruction}>{step.instruction}</p>
        </div>

        {/* Why it works */}
        <div className={styles.whyCard}>
          <span className={styles.whyLabel}>🎬 Why it works</span>
          <p className={styles.whyText}>{step.whyItWorks}</p>
        </div>

        {/* Tips (expandable) */}
        <div className={styles.tipsCard}>
          <button
            className={styles.tipsToggle}
            onClick={() => setTipsExpanded(e => !e)}
            aria-expanded={tipsExpanded}
          >
            <span className={styles.tipsLabel}>💡 Pro Tips ({step.tips.length})</span>
            <svg
              className={`${styles.tipsChevron} ${tipsExpanded ? styles.tipsChevronOpen : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {tipsExpanded && (
            <ul className={styles.tipsList}>
              {step.tips.map((tip, i) => (
                <li key={i} className={styles.tip}>
                  <span className={styles.tipDot} />
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Camera movement row */}
        <div className={styles.movementRow}>
          <div className={styles.movementItem}>
            <span className={styles.movementLabel}>Movement</span>
            <span className={styles.movementValue}>{step.movement}</span>
          </div>
          <div className={styles.movementSep} />
          <div className={styles.movementItem}>
            <span className={styles.movementLabel}>Next Transition</span>
            <span className={styles.movementValue}>{step.transition}</span>
          </div>
        </div>

        <div style={{ height: 120 }} />
      </div>

      {/* ── Progress dots ─────────────────────────────────────────────── */}
      <div className={styles.dotsWrap}>
        <ProgressDots total={total} current={currentStepIndex} onDotClick={handleDot} />
      </div>

      {/* ── Navigation bar ────────────────────────────────────────────── */}
      <div className={styles.navBar}>
        <button
          className={styles.navBtnGhost}
          onClick={handlePrev}
          disabled={isFirst}
          aria-label="Previous step"
        >
          ← Prev
        </button>

        {isLast ? (
          <button className={styles.navBtnComplete} onClick={completeGuidedSession}>
            ✓ Complete Session
          </button>
        ) : (
          <button className={styles.navBtnPrimary} onClick={handleNext} aria-label="Next step">
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

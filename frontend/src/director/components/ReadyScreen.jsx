/**
 * director/components/ReadyScreen.jsx
 *
 * Feature 1 & 7 — Workflow/AI Recommendation Ready Screen.
 * Shown after the creator taps a template, before the session starts.
 * Gives a full briefing: workflow, steps, difficulty, camera settings,
 * director map preview, AI recommendation, battery & storage estimates.
 */

import React from 'react';
import styles from './ReadyScreen.module.css';
import { useDirector } from '../hooks/useDirector';

// ── Mock camera settings per template category ────────────────────────────────
const CAMERA_SETTINGS_MAP = {
  Vlog:         { resolution: '4K', fps: 30,  hdr: true,  stabilization: 'Cinematic', focus: 'Auto' },
  Cooking:      { resolution: '4K', fps: 30,  hdr: true,  stabilization: 'Standard',  focus: 'Manual' },
  Podcast:      { resolution: '4K', fps: 24,  hdr: false, stabilization: 'Standard',  focus: 'Manual' },
  Commercial:   { resolution: '4K', fps: 30,  hdr: false, stabilization: 'Standard',  focus: 'Auto' },
  Wedding:      { resolution: '4K', fps: 24,  hdr: true,  stabilization: 'Cinematic', focus: 'Auto' },
  Fitness:      { resolution: '4K', fps: 60,  hdr: false, stabilization: 'Sport',     focus: 'Auto' },
  Social:       { resolution: '4K', fps: 60,  hdr: false, stabilization: 'Sport',     focus: 'Auto' },
  Tutorial:     { resolution: '1080p', fps: 30, hdr: false, stabilization: 'Standard', focus: 'Manual' },
  Documentary:  { resolution: '4K', fps: 24,  hdr: true,  stabilization: 'Cinematic', focus: 'Auto' },
};

// ── AI recommendation mock per template ───────────────────────────────────────
const AI_RECS = {
  'tpl-travel':      'Optimal golden hour shooting detected. Recommend filming establishing shots first. Wind conditions will affect audio — use environment sounds intentionally.',
  'tpl-food':        'Warm indoor lighting ideal for macro shots. Suggest pre-heating the dish to maximise steam for close-up shots. HDR will enhance texture contrast.',
  'tpl-interview':   'Neutral ambient lighting is consistent. Lock white balance before starting. Recommend lavalier mic placement at 15cm below chin.',
  'tpl-product':     'Clean background detected. Recommend removing background items before orbit shots. Strong key light will enhance product highlights.',
  'tpl-wedding':     'Soft outdoor light is ideal. Golden hour starts in approximately 45 minutes — orbit shot timing is critical. Backup audio recommended for ceremony.',
  'tpl-sports':      'High motion environment. 60fps is essential for slow-motion review. Low angle power shots recommended for opening sequence.',
  'tpl-lifestyle':   'Trending hook format: tight close-up in first 3 frames. Beat-synced transition timing detected from your previous session.',
  'tpl-education':   'Clean audio environment confirmed. Recommend white or neutral background. Push-in emphasis shots on key learning points.',
  'tpl-fashion':     'Consistent soft-box lighting detected. Head-to-toe reveal tilt works optimally at this light angle. 4K ensures crop flexibility in post.',
  'tpl-documentary': 'Observational mode recommended. Minimal intervention in subject behaviour. Static shots require 30+ seconds of patience.',
};

// ── Difficulty colour ─────────────────────────────────────────────────────────
function diffColor(level) {
  return { Beginner: '#4ade80', Intermediate: '#fcd34d', Advanced: '#f87171' }[level.split(' ')[0]] || '#e8eaf0';
}

// ── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, valueColor }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoIcon}>{icon}</span>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue} style={valueColor ? { color: valueColor } : {}}>
        {value}
      </span>
    </div>
  );
}

export default function ReadyScreen() {
  const { state, dismissReadyScreen, showCameraPrep } = useDirector();
  const { readyScreenOpen, readyTemplate: tpl, directorMaps } = state;

  if (!readyScreenOpen || !tpl) return null;

  const cam       = CAMERA_SETTINGS_MAP[tpl.category] || CAMERA_SETTINGS_MAP.Vlog;
  const totalSecs = tpl.steps.reduce((s, st) => s + st.durationSeconds, 0);
  const estMin    = Math.max(1, Math.ceil(totalSecs / 60));
  const diffLvl   = tpl.targetAudience.split(' ')[0];
  const aiRec     = AI_RECS[tpl.id] || 'AI analysis complete. Scene conditions are optimal for this template.';

  // Find a saved director map linked to this template category
  const relatedMap = directorMaps.find(dm => dm.workflowName || dm.shots.length > 0);

  // Battery & storage estimates (mock)
  const batUsage  = `~${Math.round(estMin * 2.5)}% battery`;
  const storUsage = `~${(totalSecs * 0.08).toFixed(0)} MB`;

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>

        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.templateIcon} style={{ background: tpl.coverColor }}>
              <span className={styles.templateIconEmoji}>{tpl.icon}</span>
            </div>
            <div>
              <h2 className={styles.title}>{tpl.name}</h2>
              <p className={styles.subtitle}>Ready to begin</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={dismissReadyScreen} aria-label="Cancel">✕</button>
        </div>

        <div className={styles.body}>

          {/* AI Recommendation */}
          <div className={styles.aiRec}>
            <div className={styles.aiRecHeader}>
              <span className={styles.aiRecBadge}>✦ AI Recommendation</span>
            </div>
            <p className={styles.aiRecText}>{aiRec}</p>
          </div>

          {/* Session overview */}
          <p className={styles.sectionLabel}>Session Overview</p>
          <div className={styles.card}>
            <InfoRow icon="🎬" label="Template"            value={tpl.name} />
            <InfoRow icon="📋" label="Total Shots"         value={`${tpl.steps.length} shots`} />
            <InfoRow icon="⏱"  label="Est. Recording Time" value={`~${estMin} min`} />
            <InfoRow icon="📡" label="Difficulty"          value={diffLvl} valueColor={diffColor(diffLvl)} />
          </div>

          {/* Camera settings */}
          <p className={styles.sectionLabel}>Camera Profile</p>
          <div className={styles.card}>
            <InfoRow icon="🔲" label="Resolution"   value={cam.resolution} />
            <InfoRow icon="🎞" label="Frame Rate"   value={`${cam.fps} fps`} />
            <InfoRow icon="✨" label="HDR"          value={cam.hdr ? 'Enabled' : 'Off'} />
            <InfoRow icon="🎯" label="Stabilisation" value={cam.stabilization} />
            <InfoRow icon="🔍" label="Focus Mode"   value={cam.focus} />
          </div>

          {/* Director Map preview (if available) */}
          {relatedMap && (
            <>
              <p className={styles.sectionLabel}>Your Director Map</p>
              <div className={`${styles.card} ${styles.mapCard}`}>
                <div className={styles.mapCardTop}>
                  <span className={styles.mapIcon}>🎬</span>
                  <div className={styles.mapInfo}>
                    <span className={styles.mapName}>{relatedMap.name}</span>
                    <span className={styles.mapMeta}>{relatedMap.shots.length} shots · {relatedMap.shots.reduce((s, sh) => s + sh.durationSeconds, 0)}s</span>
                  </div>
                  <span className={styles.mapBadge}>Available</span>
                </div>
              </div>
            </>
          )}

          {/* Resources */}
          <p className={styles.sectionLabel}>Resource Estimates</p>
          <div className={styles.card}>
            <InfoRow icon="🔋" label="Battery Usage" value={batUsage} />
            <InfoRow icon="💾" label="Storage"        value={storUsage} />
          </div>

          <div style={{ height: 16 }} />
        </div>

        {/* Action buttons */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={dismissReadyScreen}>Cancel</button>
          <button className={styles.btnStart} onClick={showCameraPrep}>
            Start Session →
          </button>
        </div>
      </div>
    </div>
  );
}

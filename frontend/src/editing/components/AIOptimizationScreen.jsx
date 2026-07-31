/**
 * editing/components/AIOptimizationScreen.jsx
 *
 * Module 5 — Phase 4.2 — AI Export Optimization Screen
 *
 * Four sections:
 *   1. AI Optimisation Score Card  — export score, quality, platform readiness
 *   2. AI Recommendations          — 7 actionable suggestion cards with Apply
 *   3. Export Prediction           — time / upload / size / compression / retention
 *   4. Platform Readiness          — per-platform status grid (Ready/Warning/Needs Opt)
 *
 * Bottom action bar:
 *   ← Previous  |  Optimize Automatically  |  Continue →
 *
 * All state is local (applied recs tracked with useState).
 * Export settings changes dispatch updateExportSettings from EditingContext.
 */

import React, { useState, useCallback, useMemo } from 'react';
import styles from './AIOptimizationScreen.module.css';
import { useEditing } from '../hooks/useEditing';

// ─────────────────────────────────────────────────────────────────────────────
// Static mock data
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_META = {
  'YouTube':          { icon: '▶', color: '#ff4444',  accent: 'rgba(255,0,0,0.2)' },
  'Instagram Reels':  { icon: '⬡', color: '#e879f9',  accent: 'rgba(214,77,173,0.2)' },
  'TikTok':           { icon: '♪', color: '#22d3ee',  accent: 'rgba(0,242,234,0.15)' },
  'LinkedIn':         { icon: 'in', color: '#60a5fa', accent: 'rgba(10,102,194,0.2)' },
  'Facebook':         { icon: 'f',  color: '#6ea8fe', accent: 'rgba(24,119,242,0.2)' },
  'Twitter / X':      { icon: '𝕏', color: 'rgba(255,255,255,0.65)', accent: 'rgba(255,255,255,0.1)' },
};

// AI recommendation definitions — generated per session settings
function buildRecommendations(settings) {
  return [
    {
      id:          'rec-res',
      icon:        '🔲',
      title:       'Resolution Optimisation',
      explanation: `${settings.resolution} detected. For ${settings.platform}, 1080p delivers the best quality-to-size ratio. Switching reduces file size by ~40% with no visible quality loss.`,
      improvement: '+22% Upload Speed',
      confidence:  94,
      applied:     false,
      patch:       { resolution: '1080p' },
    },
    {
      id:          'rec-bitrate',
      icon:        '📊',
      title:       'Bitrate Optimisation',
      explanation: `Current quality setting "${settings.quality}" uses a higher bitrate than ${settings.platform} requires. AI recommends reducing to "High" for optimal streaming performance.`,
      improvement: '+18% Compression',
      confidence:  91,
      applied:     false,
      patch:       { quality: 'High' },
    },
    {
      id:          'rec-codec',
      icon:        '⚙️',
      title:       'H.265 Codec Recommendation',
      explanation: 'H.265 (HEVC) encoding reduces file size by up to 50% at equivalent visual quality compared to H.264. Ideal for 4K and HDR content.',
      improvement: '-50% File Size',
      confidence:  88,
      applied:     false,
      patch:       { format: 'MP4' },
    },
    {
      id:          'rec-hdr',
      icon:        '✨',
      title:       'HDR Profile Selection',
      explanation: `${settings.platform} supports HDR10. Enabling HDR tone mapping preserves the dynamic range captured in your footage and improves colour accuracy on HDR displays.`,
      improvement: '+15% Visual Quality',
      confidence:  82,
      applied:     false,
      patch:       {},
    },
    {
      id:          'rec-fps',
      icon:        '🎞',
      title:       'Frame Rate Alignment',
      explanation: `${settings.platform} recommends ${settings.fps >= 60 ? '60fps for fast-action content' : '30fps for standard content'}. Current setting is optimal — no change needed.`,
      improvement: 'Already Optimal',
      confidence:  97,
      applied:     true,       // pre-applied: already optimal
      patch:       {},
    },
    {
      id:          'rec-audio',
      icon:        '🎙',
      title:       'Audio Bitrate Optimisation',
      explanation: 'AI recommends AAC 320kbps stereo audio for maximum compatibility across all platforms. This balances file size with broadcast-quality audio fidelity.',
      improvement: '+12% Audio Clarity',
      confidence:  89,
      applied:     false,
      patch:       {},
    },
    {
      id:          'rec-thumb',
      icon:        '🖼️',
      title:       'Thumbnail Metadata Embedding',
      explanation: 'AI identified the optimal thumbnail frame (00:22.4s) during analysis. Embedding this as chapter metadata improves click-through rate by an average of 35%.',
      improvement: '+35% Click-Through',
      confidence:  85,
      applied:     false,
      patch:       {},
    },
  ];
}

// Platform readiness data — derived from current settings
function buildPlatformReadiness(settings) {
  const res   = settings.resolution;
  const fps   = settings.fps;
  const fmt   = settings.format;

  const isShort = ['Instagram Reels', 'TikTok'].includes(settings.platform);

  return [
    {
      id:     'YouTube',
      label:  'YouTube',
      status: res === '4K' || res === '1080p' ? 'ready' : 'warning',
      note:   res === '4K' || res === '1080p'
        ? 'Resolution and format are optimal.'
        : '720p accepted but 1080p recommended for monetised channels.',
    },
    {
      id:     'Instagram Reels',
      label:  'Instagram',
      status: isShort ? 'needs' : (res === '1080p' ? 'ready' : 'warning'),
      note:   isShort
        ? 'Vertical 9:16 format required — current 16:9 will be cropped.'
        : res === '1080p' ? 'Settings are fully compatible.' : 'Lower resolution may reduce feed quality.',
    },
    {
      id:     'TikTok',
      label:  'TikTok',
      status: isShort ? 'needs' : (fps >= 30 ? 'ready' : 'warning'),
      note:   isShort
        ? 'Vertical 9:16 aspect ratio required for full-screen display.'
        : fps >= 30 ? 'Frame rate is compatible.' : '24fps may appear less smooth on TikTok.',
    },
    {
      id:     'LinkedIn',
      label:  'LinkedIn',
      status: fmt === 'MP4' ? 'ready' : 'warning',
      note:   fmt === 'MP4' ? 'MP4/H.264 is the recommended LinkedIn format.' : `${fmt} has limited support — MP4 recommended.`,
    },
    {
      id:     'Facebook',
      label:  'Facebook',
      status: res === '1080p' || res === '720p' ? 'ready' : 'warning',
      note:   res === '1080p' || res === '720p'
        ? 'Fully compatible with Facebook video standards.'
        : '4K is transcoded to 1080p by Facebook — use 1080p to save bandwidth.',
    },
    {
      id:     'Twitter / X',
      label:  'X (Twitter)',
      status: res === '1080p' || res === '720p' ? 'ready' : 'needs',
      note:   res === '1080p' || res === '720p'
        ? 'Compatible with X video upload requirements.'
        : '4K is not supported — X limits to 1080p/30fps.',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — AI Optimisation Score Card
// ─────────────────────────────────────────────────────────────────────────────
const RADIUS = 44;
const CIRC   = 2 * Math.PI * RADIUS;

function ScoreRing({ score, label, color }) {
  const offset = CIRC * (1 - score / 100);
  return (
    <div className={styles.scoreRingWrap}>
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r={RADIUS} stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={RADIUS}
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className={styles.scoreRingCenter}>
        <span className={styles.scoreRingVal} style={{ color }}>{score}</span>
        <span className={styles.scoreRingLbl}>{label}</span>
      </div>
    </div>
  );
}

function AIScoreCard({ settings, aiScore, appliedCount }) {
  // Compute optimisation score from settings + applied recs
  const optScore = Math.min(99, Math.round(aiScore + appliedCount * 3));
  const qualScore  = settings.quality === 'Maximum' ? 98 : settings.quality === 'High' ? 86 : 72;
  const platMeta   = PLATFORM_META[settings.platform] ?? PLATFORM_META['YouTube'];
  const platScore  = settings.resolution === '4K'    ? 95
                   : settings.resolution === '1080p' ? 92
                   : settings.resolution === '1440p' ? 88 : 75;
  const compScore  = settings.quality === 'Standard' ? 90
                   : settings.quality === 'High'     ? 78 : 62;

  return (
    <div className={styles.scoreCard}>
      <div className={styles.scoreCardTop}>
        <div className={styles.ibmBadge}>
          <span className={styles.ibmDot} />
          <span>IBM watsonx.ai · Export Intelligence</span>
        </div>
      </div>

      <div className={styles.scoreRings}>
        <ScoreRing score={optScore}  label="AI Score"   color="#6366f1" />
        <ScoreRing score={qualScore} label="Quality"    color="#22c55e" />
        <ScoreRing score={platScore} label="Platform"   color={platMeta.color} />
        <ScoreRing score={compScore} label="Efficiency" color="#f59e0b" />
      </div>

      <div className={styles.scoreMetaRow}>
        <div className={styles.scoreMeta}>
          <span className={styles.scoreMetaIcon}>⚡</span>
          <div>
            <span className={styles.scoreMetaVal}>{optScore}/100</span>
            <span className={styles.scoreMetaLbl}>Optimisation Score</span>
          </div>
        </div>
        <div className={styles.scoreMetaDot} />
        <div className={styles.scoreMeta}>
          <span className={styles.scoreMetaIcon} style={{ color: platMeta.color }}>{platMeta.icon}</span>
          <div>
            <span className={styles.scoreMetaVal}>{settings.platform}</span>
            <span className={styles.scoreMetaLbl}>Target Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — AI Recommendation Cards
// ─────────────────────────────────────────────────────────────────────────────
function RecommendationCard({ rec, onApply }) {
  const confColor = rec.confidence >= 90 ? '#4ade80' : rec.confidence >= 75 ? '#fcd34d' : '#f87171';
  const confBar   = rec.confidence >= 90 ? '#22c55e' : rec.confidence >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className={`${styles.recCard} ${rec.applied ? styles.recCardApplied : ''}`}>
      <div className={styles.recCardTop}>
        {/* Icon + title */}
        <div className={styles.recIconWrap}>
          <span className={styles.recIcon}>{rec.icon}</span>
        </div>
        <div className={styles.recTitleGroup}>
          <span className={styles.recTitle}>{rec.title}</span>
          <div className={styles.recConfRow}>
            <div className={styles.recConfTrack}>
              <div className={styles.recConfFill} style={{ width: `${rec.confidence}%`, background: confBar }} />
            </div>
            <span className={styles.recConfPct} style={{ color: confColor }}>
              {rec.confidence}%
            </span>
          </div>
        </div>
        {/* Applied badge */}
        {rec.applied && <span className={styles.recAppliedBadge}>✓ Applied</span>}
      </div>

      <p className={styles.recExplanation}>{rec.explanation}</p>

      <div className={styles.recFooter}>
        <span className={styles.recImprovement}>
          <span className={styles.recImpIcon}>⚡</span>
          {rec.improvement}
        </span>
        {!rec.applied && (
          <button className={styles.recApplyBtn} onClick={() => onApply(rec.id)}>
            Apply →
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Export Prediction
// ─────────────────────────────────────────────────────────────────────────────
function ExportPrediction({ settings, appliedCount }) {
  // Mock math that improves with applied optimisations
  const resBitrate  = { '720p': 5, '1080p': 12, '1440p': 22, '4K': 45 };
  const qualMult    = { Standard: 0.6, High: 1, Maximum: 1.6 };
  const fpsMult     = settings.fps >= 60 ? 1.3 : 1;
  const optMult     = Math.max(0.5, 1 - appliedCount * 0.06); // each applied rec improves compression

  const mbps      = (resBitrate[settings.resolution] ?? 12) * (qualMult[settings.quality] ?? 1) * fpsMult * optMult;
  const totalMb   = Math.round(mbps * 3 * 60 / 8);
  const sizeLabel = totalMb >= 1000 ? `${(totalMb / 1000).toFixed(1)} GB` : `${totalMb} MB`;

  const expSecs   = Math.round((totalMb / 20) * (qualMult[settings.quality] ?? 1));
  const expLabel  = expSecs >= 60 ? `~${Math.ceil(expSecs / 60)}m` : `~${expSecs}s`;

  const uploadMbps = 10; // mock 10Mbps upload
  const uploadSecs = Math.round(totalMb / uploadMbps);
  const upLabel    = uploadSecs >= 60 ? `~${Math.ceil(uploadSecs / 60)}m` : `~${uploadSecs}s`;

  const origMb    = (resBitrate[settings.resolution] ?? 12) * 1.6 * 3 * 60 / 8;
  const compPct   = Math.round((1 - totalMb / origMb) * 100);
  const retainPct = Math.round(100 - (compPct * 0.08));

  const rows = [
    { icon: '⏱',  label: 'Export Time',          value: expLabel,           color: '#a5b4fc' },
    { icon: '📡',  label: 'Upload Time (10Mbps)', value: upLabel,            color: '#a5b4fc' },
    { icon: '💾',  label: 'Final File Size',       value: sizeLabel,          color: '#fcd34d' },
    { icon: '🗜',  label: 'Compression',           value: `${compPct}%`,      color: '#4ade80' },
    { icon: '🌟',  label: 'Quality Retention',     value: `${retainPct}%`,    color: '#4ade80' },
  ];

  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Export Prediction</p>
      <div className={styles.predCard}>
        {rows.map((row, i) => (
          <React.Fragment key={row.label}>
            <div className={styles.predRow}>
              <span className={styles.predIcon}>{row.icon}</span>
              <span className={styles.predLabel}>{row.label}</span>
              <span className={styles.predValue} style={{ color: row.color }}>{row.value}</span>
            </div>
            {i < rows.length - 1 && <div className={styles.predDivider} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Platform Readiness Grid
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  ready:   { icon: '✓', label: 'Ready',            bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   text: '#4ade80' },
  warning: { icon: '⚠', label: 'Warning',          bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',   text: '#fcd34d' },
  needs:   { icon: '✕', label: 'Needs Optimisation', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)',   text: '#f87171' },
};

function PlatformReadinessCard({ item }) {
  const s   = STATUS_STYLE[item.status] ?? STATUS_STYLE.warning;
  const meta = PLATFORM_META[item.id] ?? { icon: '●', color: '#94a3b8', accent: 'rgba(255,255,255,0.1)' };
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={styles.platReadyCard}
      style={{ borderColor: s.border, background: s.bg }}
      onClick={() => setExpanded(e => !e)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
    >
      <div className={styles.platReadyRow}>
        {/* Platform icon */}
        <div className={styles.platReadyIcon} style={{ color: meta.color, background: meta.accent }}>
          {meta.icon}
        </div>
        <span className={styles.platReadyLabel}>{item.label}</span>
        {/* Status badge */}
        <span className={styles.platReadyStatus} style={{ color: s.text, background: s.bg, borderColor: s.border }}>
          {s.icon} {s.label}
        </span>
        {/* Expand chevron */}
        <svg
          className={`${styles.platReadyChevron} ${expanded ? styles.platReadyChevronOpen : ''}`}
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {expanded && (
        <p className={styles.platReadyNote} style={{ color: s.text }}>{item.note}</p>
      )}
    </div>
  );
}

function PlatformReadiness({ settings }) {
  const readiness = useMemo(() => buildPlatformReadiness(settings), [settings]);
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Platform Readiness</p>
      <div className={styles.platReadyGrid}>
        {readiness.map(item => (
          <PlatformReadinessCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function AIOptimizationScreen() {
  const {
    state,
    updateExportSettings,
    setSessionState,
  } = useEditing();

  const session  = state.activeSession;
  const settings = session?.exportSettings ?? {
    platform:   'YouTube',
    resolution: '1080p',
    fps:        30,
    quality:    'High',
    format:     'MP4',
  };
  const aiScore = session?.analysis?.scores?.overall ?? 72;

  // Build recs from current settings
  const [recs, setRecs] = useState(() => buildRecommendations(settings));
  const appliedCount = recs.filter(r => r.applied).length;

  // Apply a single recommendation
  const handleApplyRec = useCallback((id) => {
    setRecs(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (Object.keys(r.patch).length > 0) {
        updateExportSettings(r.patch);
      }
      return { ...r, applied: true };
    }));
  }, [updateExportSettings]);

  // Apply all non-applied recs
  const handleOptimizeAll = useCallback(() => {
    const combinedPatch = {};
    recs.forEach(r => {
      if (!r.applied) Object.assign(combinedPatch, r.patch);
    });
    if (Object.keys(combinedPatch).length > 0) {
      updateExportSettings(combinedPatch);
    }
    setRecs(prev => prev.map(r => ({ ...r, applied: true })));
  }, [recs, updateExportSettings]);

  const handleBack     = useCallback(() => setSessionState('complete'),     [setSessionState]);
  const handleContinue = useCallback(() => setSessionState('exporting'),    [setSessionState]);

  return (
    <div className={styles.screen}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            <span>IBM watsonx.ai</span>
          </div>
          <h1 className={styles.headerTitle}>AI Optimisation</h1>
          <p className={styles.headerSub}>Export intelligence for {settings.platform}</p>
        </div>
        <div className={styles.headerScore}>
          <span className={styles.headerScoreVal}>{Math.min(99, aiScore + appliedCount * 3)}</span>
          <span className={styles.headerScoreLbl}>Score</span>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      <div className={styles.scroll}>

        {/* S1 — AI Score card */}
        <AIScoreCard settings={settings} aiScore={aiScore} appliedCount={appliedCount} />

        {/* S2 — AI Recommendations */}
        <div className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <p className={styles.sectionLabel}>AI Recommendations</p>
            <span className={styles.sectionCount}>{recs.filter(r => !r.applied).length} pending</span>
          </div>
          <div className={styles.recList}>
            {recs.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} onApply={handleApplyRec} />
            ))}
          </div>
        </div>

        {/* S3 — Export Prediction */}
        <ExportPrediction settings={settings} appliedCount={appliedCount} />

        {/* S4 — Platform Readiness */}
        <PlatformReadiness settings={settings} />

        <div style={{ height: 100 }} />
      </div>

      {/* ── Bottom action bar ───────────────────────────────────────── */}
      <div className={styles.actionBar}>
        <button className={styles.btnBack} onClick={handleBack}>
          ← Previous
        </button>
        <button
          className={styles.btnOptimize}
          onClick={handleOptimizeAll}
          disabled={appliedCount === recs.length}
        >
          Optimize All
        </button>
        <button className={styles.btnContinue} onClick={handleContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}

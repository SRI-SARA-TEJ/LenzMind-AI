/**
 * editing/components/ExportScreen.jsx
 *
 * AI Export Screen — full export configuration UI.
 *
 * Sections:
 *   1. Export Preview Card  — thumbnail placeholder, project meta, AI score
 *   2. Platform Selector    — 6 selectable platform cards
 *   3. Video Settings       — Resolution / FPS / Quality / Format pickers
 *   4. Export Summary       — computed output file size + export time estimate
 *
 * Bottom action bar:
 *   Cancel · Continue to AI Optimisation →
 *
 * All selections update EditingContext via updateExportSettings / applyPlatformPreset.
 * No backend — mock data only.
 * [AI_FUTURE] — Marked throughout for IBM watsonx.ai integration.
 */

import React, { useMemo, useCallback } from 'react';
import styles from './ExportScreen.module.css';
import { useEditing } from '../hooks/useEditing';
import { PLATFORM_PRESETS } from '../data/mockEditingData';

// ── Platform card definitions ─────────────────────────────────────────────────
const PLATFORMS = [
  {
    id:          'YouTube',
    label:       'YouTube',
    icon:        '▶',
    iconBg:      'rgba(255,0,0,0.15)',
    iconColor:   '#ff4444',
    recommended: true,
    ratio:       '16:9',
    maxRes:      '4K',
    accent:      'rgba(255,0,0,0.25)',
  },
  {
    id:          'Instagram Reels',
    label:       'Instagram',
    icon:        '⬡',
    iconBg:      'rgba(214,77,173,0.15)',
    iconColor:   '#e879f9',
    recommended: false,
    ratio:       '9:16',
    maxRes:      '1080p',
    accent:      'rgba(214,77,173,0.25)',
  },
  {
    id:          'TikTok',
    label:       'TikTok',
    icon:        '♪',
    iconBg:      'rgba(0,242,234,0.12)',
    iconColor:   '#22d3ee',
    recommended: false,
    ratio:       '9:16',
    maxRes:      '1080p',
    accent:      'rgba(0,242,234,0.2)',
  },
  {
    id:          'LinkedIn',
    label:       'LinkedIn',
    icon:        'in',
    iconBg:      'rgba(10,102,194,0.2)',
    iconColor:   '#60a5fa',
    recommended: false,
    ratio:       '16:9',
    maxRes:      '1080p',
    accent:      'rgba(10,102,194,0.25)',
  },
  {
    id:          'Facebook',
    label:       'Facebook',
    icon:        'f',
    iconBg:      'rgba(24,119,242,0.15)',
    iconColor:   '#6ea8fe',
    recommended: false,
    ratio:       '16:9',
    maxRes:      '1080p',
    accent:      'rgba(24,119,242,0.25)',
  },
  {
    id:          'Twitter / X',
    label:       'X (Twitter)',
    icon:        '𝕏',
    iconBg:      'rgba(255,255,255,0.06)',
    iconColor:   'rgba(255,255,255,0.65)',
    recommended: false,
    ratio:       '16:9',
    maxRes:      '1080p',
    accent:      'rgba(255,255,255,0.15)',
  },
];

// ── Setting options ───────────────────────────────────────────────────────────
const RESOLUTIONS = [
  { id: '720p',  label: '720p',  sub: 'HD' },
  { id: '1080p', label: '1080p', sub: 'Full HD' },
  { id: '1440p', label: '1440p', sub: '2K' },
  { id: '4K',    label: '4K',    sub: 'Ultra HD' },
];

const FRAME_RATES = [
  { id: 24, label: '24', sub: 'Cinematic' },
  { id: 30, label: '30', sub: 'Standard' },
  { id: 60, label: '60', sub: 'Smooth' },
];

const QUALITIES = [
  { id: 'Standard', label: 'Standard', sub: 'Smaller file' },
  { id: 'High',     label: 'High',     sub: 'Balanced' },
  { id: 'Maximum',  label: 'Maximum',  sub: 'Best quality' },
];

const FORMATS = [
  { id: 'MP4',  label: 'MP4',  sub: 'Universal' },
  { id: 'MOV',  label: 'MOV',  sub: 'Apple' },
  { id: 'WebM', label: 'WebM', sub: 'Web' },
];

// ── File size estimator (mock) ────────────────────────────────────────────────
function estimateFileSize(resolution, quality, fps, durationMin = 3) {
  const resBitrate = { '720p': 5, '1080p': 12, '1440p': 22, '4K': 45 };
  const qualMult   = { Standard: 0.6, High: 1, Maximum: 1.6 };
  const fpsMult    = fps >= 60 ? 1.3 : 1;
  const mbps = (resBitrate[resolution] ?? 12) * (qualMult[quality] ?? 1) * fpsMult;
  const totalMb = Math.round(mbps * durationMin * 60 / 8);
  return totalMb >= 1000 ? `${(totalMb / 1000).toFixed(1)} GB` : `${totalMb} MB`;
}

// ── Export time estimator (mock) ──────────────────────────────────────────────
function estimateExportTime(resolution, quality) {
  const base = { '720p': 8, '1080p': 18, '1440p': 35, '4K': 65 };
  const mult = { Standard: 0.7, High: 1, Maximum: 1.5 };
  const secs = Math.round((base[resolution] ?? 18) * (mult[quality] ?? 1));
  return secs >= 60 ? `~${Math.ceil(secs / 60)}m` : `~${secs}s`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Export Preview Card
// ─────────────────────────────────────────────────────────────────────────────
function PreviewCard({ session, aiScore }) {
  const title    = session?.projectTitle ?? 'Untitled Project';
  const applied  = session?.appliedIds?.length ?? 0;
  const total    = session?.analysis?.suggestions?.length ?? 0;
  // Mock duration based on suggestion count
  const durMin   = Math.max(1, Math.round(total * 0.2 + 1));
  const durLabel = `${durMin}:${String(Math.floor(Math.random() * 50 + 10)).padStart(2, '0')}`;

  return (
    <div className={styles.previewCard}>
      {/* Thumbnail placeholder */}
      <div className={styles.thumbnail}>
        <div className={styles.thumbnailInner}>
          <div className={styles.thumbPlayRing}>
            <span className={styles.thumbPlayIcon}>▶</span>
          </div>
          <div className={styles.thumbGrid} />
        </div>
        <div className={styles.thumbDurBadge}>{durLabel}</div>
      </div>

      {/* Meta */}
      <div className={styles.previewMeta}>
        <div className={styles.ibmBadge}>
          <span className={styles.ibmDot} />
          <span>IBM watsonx.ai</span>
        </div>
        <h2 className={styles.previewTitle}>{title}</h2>
        <div className={styles.previewStats}>
          <div className={styles.previewStat}>
            <span className={styles.previewStatIcon}>✓</span>
            <span className={styles.previewStatVal}>{applied}/{total}</span>
            <span className={styles.previewStatLbl}>Edits Applied</span>
          </div>
          <div className={styles.previewStatSep} />
          <div className={styles.previewStat}>
            <span className={styles.previewStatIcon}>⭐</span>
            <span className={styles.previewStatVal} style={{ color: aiScore >= 80 ? '#4ade80' : aiScore >= 60 ? '#fcd34d' : '#f87171' }}>
              {aiScore}/100
            </span>
            <span className={styles.previewStatLbl}>AI Quality</span>
          </div>
          <div className={styles.previewStatSep} />
          <div className={styles.previewStat}>
            <span className={styles.previewStatIcon}>⏱</span>
            <span className={styles.previewStatVal}>{durLabel}</span>
            <span className={styles.previewStatLbl}>Duration</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Platform Selector
// ─────────────────────────────────────────────────────────────────────────────
function PlatformSelector({ selected, onSelect }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Export Platform</p>
      <div className={styles.platformGrid}>
        {PLATFORMS.map(p => {
          const isActive = selected === p.id;
          return (
            <button
              key={p.id}
              className={`${styles.platformCard} ${isActive ? styles.platformCardActive : ''}`}
              style={isActive ? { borderColor: p.accent, background: `${p.iconBg}` } : {}}
              onClick={() => onSelect(p)}
              aria-pressed={isActive}
            >
              {p.recommended && (
                <span className={styles.recommendedBadge}>✦ Best</span>
              )}
              <div
                className={styles.platformIcon}
                style={{ background: p.iconBg, color: p.iconColor }}
              >
                {p.icon}
              </div>
              <span className={styles.platformLabel}>{p.label}</span>
              <div className={styles.platformMeta}>
                <span className={styles.platformRatio}>{p.ratio}</span>
                <span className={styles.platformRes}>{p.maxRes}</span>
              </div>
              {isActive && (
                <div className={styles.platformCheck}>✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Video Settings
// ─────────────────────────────────────────────────────────────────────────────
function OptionRow({ label, options, selected, onSelect }) {
  return (
    <div className={styles.optionGroup}>
      <span className={styles.optionLabel}>{label}</span>
      <div className={styles.optionRow}>
        {options.map(opt => {
          const isActive = selected === opt.id;
          return (
            <button
              key={opt.id}
              className={`${styles.optionBtn} ${isActive ? styles.optionBtnActive : ''}`}
              onClick={() => onSelect(opt.id)}
              aria-pressed={isActive}
            >
              <span className={styles.optionBtnVal}>{opt.label}</span>
              {opt.sub && <span className={styles.optionBtnSub}>{opt.sub}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VideoSettings({ settings, onChange }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Video Settings</p>
      <div className={styles.settingsCard}>
        <OptionRow
          label="Resolution"
          options={RESOLUTIONS}
          selected={settings.resolution}
          onSelect={v => onChange({ resolution: v })}
        />
        <div className={styles.settingsDivider} />
        <OptionRow
          label="Frame Rate"
          options={FRAME_RATES}
          selected={settings.fps}
          onSelect={v => onChange({ fps: v })}
        />
        <div className={styles.settingsDivider} />
        <OptionRow
          label="Quality"
          options={QUALITIES}
          selected={settings.quality}
          onSelect={v => onChange({ quality: v })}
        />
        <div className={styles.settingsDivider} />
        <OptionRow
          label="Format"
          options={FORMATS}
          selected={settings.format}
          onSelect={v => onChange({ format: v })}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Export Summary
// ─────────────────────────────────────────────────────────────────────────────
function ExportSummary({ settings }) {
  const fileSize   = estimateFileSize(settings.resolution, settings.quality, settings.fps);
  const exportTime = estimateExportTime(settings.resolution, settings.quality);
  const platform   = PLATFORMS.find(p => p.id === settings.platform) ?? PLATFORMS[0];

  const rows = [
    { icon: platform.icon, label: 'Platform',    value: platform.label,       valueStyle: { color: platform.iconColor } },
    { icon: '🔲',          label: 'Resolution',   value: settings.resolution   },
    { icon: '🎞',          label: 'Frame Rate',   value: `${settings.fps} FPS` },
    { icon: '📦',          label: 'Format',       value: settings.format       },
    { icon: '⚙️',          label: 'Quality',      value: settings.quality      },
    { icon: '💾',          label: 'Est. Size',    value: fileSize, valueStyle: { color: '#fcd34d' } },
    { icon: '⏱',          label: 'Export Time',  value: exportTime            },
  ];

  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Export Summary</p>
      <div className={styles.summaryCard}>
        {rows.map((row, i) => (
          <div key={row.label} className={styles.summaryRow}>
            <span className={styles.summaryRowIcon}>{row.icon}</span>
            <span className={styles.summaryRowLabel}>{row.label}</span>
            <span
              className={styles.summaryRowValue}
              style={row.valueStyle ?? {}}
            >
              {row.value}
            </span>
          </div>
        ))}
        {/* AI optimisation teaser [AI_FUTURE] */}
        <div className={styles.aiTeaser}>
          <span className={styles.aiTeaserBadge}>✦ AI Optimisation</span>
          <span className={styles.aiTeaserText}>
            IBM watsonx.ai will auto-tune bitrate, codec, and colour space for this platform.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ExportScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function ExportScreen() {
  const {
    state,
    updateExportSettings,
    applyPlatformPreset,
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

  // Platform selection — apply preset + set platform name
  const handlePlatformSelect = useCallback((platform) => {
    const preset = PLATFORM_PRESETS[platform.id];
    if (preset) {
      applyPlatformPreset({ ...preset, platform: platform.id });
    } else {
      updateExportSettings({ platform: platform.id });
    }
  }, [applyPlatformPreset, updateExportSettings]);

  const handleSettingChange = useCallback((patch) => {
    updateExportSettings(patch);
  }, [updateExportSettings]);

  const handleCancel   = useCallback(() => setSessionState('reviewing'),  [setSessionState]);
  const handleContinue = useCallback(() => setSessionState('optimizing'), [setSessionState]);

  return (
    <div className={styles.screen}>

      {/* ── Fixed header ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            <span>IBM watsonx.ai</span>
          </div>
          <h1 className={styles.headerTitle}>Export Settings</h1>
          <p className={styles.headerSub}>Configure your final export</p>
        </div>
        <div className={styles.headerBadge}>
          <span className={styles.headerBadgeIcon}>📤</span>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <div className={styles.scroll}>

        {/* Section 1 — Preview card */}
        <PreviewCard session={session} aiScore={aiScore} />

        {/* Section 2 — Platform selector */}
        <PlatformSelector
          selected={settings.platform}
          onSelect={handlePlatformSelect}
        />

        {/* Section 3 — Video settings */}
        <VideoSettings
          settings={settings}
          onChange={handleSettingChange}
        />

        {/* Section 4 — Export summary */}
        <ExportSummary settings={settings} />

        <div style={{ height: 100 }} />
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────── */}
      <div className={styles.actionBar}>
        <button className={styles.btnCancel} onClick={handleCancel}>
          ← Back
        </button>
        <button className={styles.btnContinue} onClick={handleContinue}>
          Continue to AI Optimisation →
        </button>
      </div>
    </div>
  );
}

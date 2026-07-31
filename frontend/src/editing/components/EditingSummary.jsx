/**
 * editing/components/EditingSummary.jsx
 *
 * Final "Export Complete" summary screen — shown when session.state === 'exporting'.
 *
 * Sections:
 *   1. Success banner     — AI quality score improvement, export confirmed
 *   2. Score comparison   — Before / After bars for 6 quality dimensions
 *   3. Edit breakdown     — Category counts (Visual / Audio / Motion / Text)
 *   4. Export details     — Platform, resolution, fps, format, file size estimate
 *   5. Edit history       — Timeline of applied / dismissed actions
 *   6. Action bar         — Start New Session · Save to Project
 *
 * [AI_FUTURE] — Creator Memory: style pattern learned badge (IBM watsonx.ai)
 */

import React, { useMemo } from 'react';
import styles from './EditingSummary.module.css';
import { useEditing } from '../hooks/useEditing';

// ── Score dimension definitions ───────────────────────────────────────────────
const SCORE_DIMS = [
  { key: 'visual',    label: 'Visual',    before: 58, color: '#6366f1' },
  { key: 'audio',     label: 'Audio',     before: 62, color: '#8b5cf6' },
  { key: 'pacing',    label: 'Pacing',    before: 55, color: '#06b6d4' },
  { key: 'colour',    label: 'Colour',    before: 60, color: '#f59e0b' },
  { key: 'stability', label: 'Stability', before: 50, color: '#10b981' },
  { key: 'overall',   label: 'Overall',   before: 57, color: '#e879f9' },
];

// ── Category icons ────────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  Visual:  '🎨',
  Audio:   '🎙',
  Motion:  '🎥',
  Text:    '💬',
  Export:  '📤',
  Colour:  '🌈',
};

// ── File-size mock (matches ExportScreen logic) ───────────────────────────────
function estimateFileSize(resolution = '1080p', quality = 'High', fps = 30) {
  const resBitrate = { '720p': 5, '1080p': 12, '1440p': 22, '4K': 45 };
  const qualMult   = { Standard: 0.6, High: 1, Maximum: 1.6 };
  const fpsMult    = fps >= 60 ? 1.3 : 1;
  const mbps       = (resBitrate[resolution] ?? 12) * (qualMult[quality] ?? 1) * fpsMult;
  const totalMb    = Math.round(mbps * 3 * 60 / 8);
  return totalMb >= 1000 ? `${(totalMb / 1000).toFixed(1)} GB` : `${totalMb} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Success Banner
// ─────────────────────────────────────────────────────────────────────────────
function SuccessBanner({ title, aiScore, appliedCount }) {
  const beforeScore = 57;
  const improvement = Math.max(0, aiScore - beforeScore);

  return (
    <div className={styles.banner}>
      {/* Glow ring */}
      <div className={styles.bannerRing}>
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="7" />
          <circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke="url(#bannerGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40 * (aiScore / 100)} ${2 * Math.PI * 40}`}
            strokeDashoffset={2 * Math.PI * 40 * 0.25}
          />
          <defs>
            <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className={styles.bannerRingCenter}>
          <span className={styles.bannerScore}>{aiScore}</span>
          <span className={styles.bannerScoreLbl}>AI Score</span>
        </div>
      </div>

      {/* Title + meta */}
      <div className={styles.bannerMeta}>
        <div className={styles.ibmBadge}>
          <span className={styles.ibmDot} />
          <span>IBM watsonx.ai</span>
        </div>
        <h2 className={styles.bannerTitle}>Export Complete</h2>
        <p className={styles.bannerSub}>{title}</p>

        <div className={styles.bannerStats}>
          <div className={styles.bannerStat}>
            <span className={styles.bannerStatVal} style={{ color: '#4ade80' }}>+{improvement}</span>
            <span className={styles.bannerStatLbl}>Score Gain</span>
          </div>
          <div className={styles.bannerStatSep} />
          <div className={styles.bannerStat}>
            <span className={styles.bannerStatVal}>{appliedCount}</span>
            <span className={styles.bannerStatLbl}>Edits Applied</span>
          </div>
          <div className={styles.bannerStatSep} />
          <div className={styles.bannerStat}>
            <span className={styles.bannerStatVal} style={{ color: '#a5b4fc' }}>✦ AI</span>
            <span className={styles.bannerStatLbl}>Optimised</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Score Comparison Bars
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ label, before, after, color }) {
  return (
    <div className={styles.scoreBarRow}>
      <span className={styles.scoreBarLabel}>{label}</span>
      <div className={styles.scoreBarTrack}>
        {/* Before bar (ghost) */}
        <div
          className={styles.scoreBarBefore}
          style={{ width: `${before}%` }}
        />
        {/* After bar */}
        <div
          className={styles.scoreBarAfter}
          style={{ width: `${after}%`, background: color }}
        />
      </div>
      <div className={styles.scoreBarNums}>
        <span className={styles.scoreBarPrev}>{before}</span>
        <span className={styles.scoreBarArrow}>→</span>
        <span className={styles.scoreBarNext} style={{ color }}>{after}</span>
      </div>
    </div>
  );
}

function ScoreComparison({ aiScore, appliedCount }) {
  const dims = useMemo(() => SCORE_DIMS.map(d => {
    const boost = d.key === 'overall' ? aiScore : Math.min(99, d.before + appliedCount * 3 + Math.round(Math.random() * 5));
    return { ...d, after: boost };
  }), [aiScore, appliedCount]);

  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Quality Improvement</p>
      <div className={styles.scoreCompCard}>
        <div className={styles.scoreCompLegend}>
          <span className={styles.legendBefore}>■ Before</span>
          <span className={styles.legendAfter}>■ After AI</span>
        </div>
        {dims.map(d => (
          <ScoreBar key={d.key} label={d.label} before={d.before} after={d.after} color={d.color} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Category Breakdown
// ─────────────────────────────────────────────────────────────────────────────
function CategoryBreakdown({ suggestions }) {
  const counts = useMemo(() => {
    const map = {};
    (suggestions ?? []).forEach(s => {
      map[s.category] = (map[s.category] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [suggestions]);

  const total = counts.reduce((sum, [, c]) => sum + c, 0) || 1;

  if (counts.length === 0) return null;

  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Category Breakdown</p>
      <div className={styles.catGrid}>
        {counts.map(([cat, count]) => (
          <div key={cat} className={styles.catCard}>
            <span className={styles.catIcon}>{CATEGORY_ICONS[cat] ?? '✦'}</span>
            <span className={styles.catCount}>{count}</span>
            <span className={styles.catLabel}>{cat}</span>
            {/* Mini bar */}
            <div className={styles.catBarTrack}>
              <div
                className={styles.catBarFill}
                style={{ width: `${Math.round((count / total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Export Details
// ─────────────────────────────────────────────────────────────────────────────
function ExportDetails({ settings }) {
  const {
    platform   = 'YouTube',
    resolution = '1080p',
    fps        = 30,
    quality    = 'High',
    format     = 'MP4',
  } = settings ?? {};

  const fileSize = estimateFileSize(resolution, quality, fps);

  const rows = [
    { icon: '▶',  label: 'Platform',   value: platform             },
    { icon: '🔲', label: 'Resolution', value: resolution           },
    { icon: '🎞', label: 'Frame Rate', value: `${fps} fps`         },
    { icon: '⚙️', label: 'Quality',    value: quality              },
    { icon: '📦', label: 'Format',     value: format               },
    { icon: '💾', label: 'File Size',  value: fileSize, highlight: true },
  ];

  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Export Details</p>
      <div className={styles.detailsCard}>
        {rows.map((row, i) => (
          <React.Fragment key={row.label}>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>{row.icon}</span>
              <span className={styles.detailLabel}>{row.label}</span>
              <span
                className={styles.detailValue}
                style={row.highlight ? { color: '#fcd34d' } : {}}
              >
                {row.value}
              </span>
            </div>
            {i < rows.length - 1 && <div className={styles.detailDivider} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Edit History Timeline
// ─────────────────────────────────────────────────────────────────────────────
function HistoryTimeline({ history }) {
  if (!history || history.length === 0) return null;

  const ICON_MAP = { applied: '✓', dismissed: '✕', undone: '↩' };
  const COLOR_MAP = {
    applied:   { dot: '#4ade80', text: '#4ade80', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.22)' },
    dismissed: { dot: '#f87171', text: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
    undone:    { dot: '#fcd34d', text: '#fcd34d', bg: 'rgba(252,211,77,0.08)', border: 'rgba(252,211,77,0.2)' },
  };

  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Edit History</p>
      <div className={styles.historyList}>
        {history.slice(0, 8).map((entry, i) => {
          const c = COLOR_MAP[entry.action] ?? COLOR_MAP.applied;
          return (
            <div
              key={entry.id ?? i}
              className={styles.historyItem}
              style={{ background: c.bg, borderColor: c.border }}
            >
              <div className={styles.historyDot} style={{ background: c.dot }} />
              <div className={styles.historyContent}>
                <span className={styles.historyType} style={{ color: c.text }}>
                  {ICON_MAP[entry.action] ?? '•'} {entry.title ?? entry.suggestionId ?? 'Edit'}
                </span>
                <span className={styles.historyTime}>
                  {entry.timestamp
                    ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main EditingSummary
// ─────────────────────────────────────────────────────────────────────────────
export default function EditingSummary() {
  const { state, startSession, resetSession } = useEditing();
  const session = state.activeSession;

  const title        = session?.projectTitle ?? 'Untitled Project';
  const aiScore      = session?.analysis?.scores?.overall ?? 82;
  const suggestions  = session?.analysis?.suggestions ?? [];
  const appliedIds   = session?.appliedIds ?? [];
  const appliedCount = appliedIds.length;
  const history      = session?.history ?? [];
  const settings     = session?.exportSettings;

  return (
    <div className={styles.screen}>

      {/* ── Fixed header ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            <span>IBM watsonx.ai</span>
          </div>
          <h1 className={styles.headerTitle}>Session Complete</h1>
          <p className={styles.headerSub}>Your AI-enhanced video is ready</p>
        </div>
        <div className={styles.headerIcon}>✦</div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <div className={styles.scroll}>

        {/* S1 — Success banner */}
        <SuccessBanner title={title} aiScore={aiScore} appliedCount={appliedCount} />

        {/* S2 — Score comparison bars */}
        <ScoreComparison aiScore={aiScore} appliedCount={appliedCount} />

        {/* S3 — Category breakdown */}
        <CategoryBreakdown suggestions={suggestions} />

        {/* S4 — Export details */}
        <ExportDetails settings={settings} />

        {/* S5 — History timeline */}
        <HistoryTimeline history={history} />

        {/* [AI_FUTURE] Creator Memory card */}
        <div className={styles.memoryCard}>
          <span className={styles.memoryBadge}>✦ Coming Soon</span>
          <h3 className={styles.memoryTitle}>Creator Memory</h3>
          <p className={styles.memorySub}>
            IBM watsonx.ai will learn your editing style from this session and auto-apply your preferences in future projects.
          </p>
        </div>

        <div style={{ height: 100 }} />
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────── */}
      <div className={styles.actionBar}>
        <button
          className={styles.btnNew}
          onClick={() => resetSession()}
        >
          ↺ New Session
        </button>
        <button
          className={styles.btnSave}
          onClick={() => startSession(null, 'New Project')}
        >
          ✦ Start New Analysis →
        </button>
      </div>

    </div>
  );
}

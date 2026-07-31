/**
 * intelligence/CreatorIntelligenceScreen.jsx
 *
 * Module 9 — Realis Creator Intelligence Dashboard
 *
 * Premium mobile-first dashboard that unifies all three intelligence layers:
 *   • CreatorLearningContext  — AI-derived learning profile (Module 8.9)
 *   • AnalyticsContext        — session analytics & creator score (Module 8.8)
 *   • CreatorMemoryContext    — session history & creator profile (Module 8.7)
 *
 * ── Component hierarchy ────────────────────────────────────────────────────────
 *
 *   CreatorIntelligenceScreen         ← root export, owns tab state
 *     ├─ IntelHeader                  ← fixed header bar
 *     ├─ IntelStatsRow                ← key metric pills
 *     ├─ IntelViewTabs                ← tab bar (Overview / Learning / Analytics / Memory)
 *     ├─ [scroll]
 *     │   ├─ OverviewView             ← tab 0: profile + hero confidence + style
 *     │   │   ├─ ProfileHero          ← avatar, name, handle, genres, AI confidence
 *     │   │   ├─ AIStyleCard          ← free-text style profile from learning engine
 *     │   │   ├─ PredictionCard       ← predicted next workflow + preset hint
 *     │   │   └─ ConfidenceRing       ← animated SVG ring for learning confidence
 *     │   ├─ LearningView             ← tab 1: workflows + scenes + camera settings
 *     │   │   ├─ PreferredWorkflows   ← scored workflow list
 *     │   │   ├─ PreferredScenes      ← scene frequency bars
 *     │   │   └─ CameraPrefs         ← camera setting pills grid
 *     │   ├─ AnalyticsView            ← tab 2: stat cards + behaviour + timing
 *     │   │   ├─ AnalyticsStatGrid    ← 6 stat cards
 *     │   │   ├─ RecommendationBehaviourCard
 *     │   │   └─ TimingCard           ← preferred shooting window
 *     │   └─ MemoryView               ← tab 3: reuses MemoryTimeline
 *     │       └─ MemoryTimeline       ← re-used from memory module
 *     └─ BottomNavBar                 ← shared nav
 *
 * ── Data flow ──────────────────────────────────────────────────────────────────
 *
 *   Camera capture
 *     → CameraMemoryBridge → CreatorMemoryContext
 *     → AnalyticsBridge    → AnalyticsContext
 *     → LearningBridge     → CreatorLearningContext
 *     → (this screen auto-updates)
 *
 * ── Zero business logic in this file ─────────────────────────────────────────
 *   All data is read directly from contexts. No computations. No API calls.
 *
 * [AI_FUTURE] IBM watsonx.ai will enrich profile, insights, and predictions
 * via real API responses — all surface in this dashboard automatically via context.
 */

import React, { useState, useEffect, useMemo } from 'react';
import styles from './CreatorIntelligenceScreen.module.css';

import { useCreatorLearning }  from '../learning/hooks/useCreatorLearning';
import { useAnalytics }        from '../analytics/hooks/useAnalytics';
import { useCreatorMemory }    from '../memory/hooks/useCreatorMemory';

import MemoryTimeline  from '../memory/components/MemoryTimeline';
import BottomNavBar    from '../camera/components/BottomNavBar';

// ── View tab config ───────────────────────────────────────────────────────────
const VIEW_TABS = [
  { id: 'overview',  label: 'Overview',  icon: '✦' },
  { id: 'learning',  label: 'Learning',  icon: '🧠' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'memory',    label: 'Memory',    icon: '⏱' },
];

// ── Colour helpers ────────────────────────────────────────────────────────────
function scoreColor(n) {
  if (n == null) return 'rgba(255,255,255,0.25)';
  if (n >= 80)   return '#4ade80';
  if (n >= 55)   return '#fcd34d';
  return '#f87171';
}

function trendColor(dir) {
  if (dir === 'improving') return '#4ade80';
  if (dir === 'declining') return '#f87171';
  return '#fcd34d';
}

function trendArrow(dir) {
  if (dir === 'improving') return '↑';
  if (dir === 'declining') return '↓';
  return '→';
}

// ── Animated confidence ring (SVG) ───────────────────────────────────────────
const CIRC_R = 46;
const CIRC_C = 2 * Math.PI * CIRC_R;

function ConfidenceRing({ value = 0, label, sublabel, color = '#6366f1' }) {
  const offset = CIRC_C * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className={styles.ringWrap}>
      <svg viewBox="0 0 108 108" className={styles.ringSvg} aria-hidden="true">
        <circle
          cx="54" cy="54" r={CIRC_R}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
        />
        <circle
          cx="54" cy="54" r={CIRC_R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC_C}
          strokeDashoffset={offset}
          transform="rotate(-90 54 54)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className={styles.ringInner}>
        <span className={styles.ringVal} style={{ color }}>{value}</span>
        <span className={styles.ringUnit}>/ 100</span>
      </div>
      {label    && <p className={styles.ringLabel}>{label}</p>}
      {sublabel && <p className={styles.ringSub}>{sublabel}</p>}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHead({ title, sub, accent }) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <h3
          className={styles.sectionTitle}
          style={accent ? { color: accent } : undefined}
        >
          {title}
        </h3>
        {sub && <p className={styles.sectionSub}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Profile hero ──────────────────────────────────────────────────────────────
function ProfileHero({ memoryProfile, aiConfidence, learningConfidence, isLearning }) {
  const name    = memoryProfile?.name    ?? 'Creator';
  const handle  = memoryProfile?.handle  ?? '@creator';
  const initials= memoryProfile?.avatarInitials ?? '??';
  const genres  = memoryProfile?.primaryGenres ?? [];

  return (
    <div className={styles.profileHero}>
      {/* Avatar + ring */}
      <div className={styles.avatarWrap}>
        <div className={styles.avatar}>{initials}</div>
        <svg className={styles.avatarRing} viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29"
            fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="29"
            fill="none" stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 29}`}
            strokeDashoffset={`${2 * Math.PI * 29 * (1 - aiConfidence / 100)}`}
            transform="rotate(-90 32 32)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        {isLearning && <span className={styles.learningPulse} aria-hidden="true" />}
      </div>

      {/* Name / handle / genres */}
      <div className={styles.profileInfo}>
        <span className={styles.profileName}>{name}</span>
        <span className={styles.profileHandle}>{handle}</span>
        <div className={styles.genreRow}>
          {genres.slice(0, 3).map(g => (
            <span key={g} className={styles.genreTag}>{g}</span>
          ))}
        </div>
      </div>

      {/* Dual confidence badges */}
      <div className={styles.profileBadges}>
        <div className={styles.confBadge}>
          <span className={styles.confBadgeVal} style={{ color: scoreColor(aiConfidence) }}>
            {aiConfidence}%
          </span>
          <span className={styles.confBadgeLbl}>AI Conf.</span>
        </div>
        <div className={styles.confBadge}>
          <span className={styles.confBadgeVal} style={{ color: scoreColor(learningConfidence) }}>
            {learningConfidence}
          </span>
          <span className={styles.confBadgeLbl}>Learning</span>
        </div>
      </div>
    </div>
  );
}

// ── AI style card ─────────────────────────────────────────────────────────────
function AIStyleCard({ aiStyleProfile, confidenceTrend }) {
  const dir = confidenceTrend?.direction ?? 'stable';
  return (
    <div className={styles.styleCard}>
      <div className={styles.styleCardHeader}>
        <span className={styles.ibmBadge}>
          <span className={styles.ibmDot} />
          IBM watsonx.ai
        </span>
        <span
          className={styles.trendChip}
          style={{ color: trendColor(dir), borderColor: trendColor(dir) + '44' }}
        >
          {trendArrow(dir)} {dir}
        </span>
      </div>
      <p className={styles.styleText}>
        {aiStyleProfile || 'Not enough data to build a style profile yet.'}
      </p>
      {confidenceTrend && (
        <div className={styles.trendRow}>
          <span className={styles.trendItem}>
            <span className={styles.trendItemLbl}>Score now</span>
            <span className={styles.trendItemVal}
              style={{ color: scoreColor(confidenceTrend.current) }}>
              {confidenceTrend.current}
            </span>
          </span>
          <span className={styles.trendDiv} />
          <span className={styles.trendItem}>
            <span className={styles.trendItemLbl}>Previous</span>
            <span className={styles.trendItemVal}>{confidenceTrend.previous}</span>
          </span>
          <span className={styles.trendDiv} />
          <span className={styles.trendItem}>
            <span className={styles.trendItemLbl}>Delta</span>
            <span className={styles.trendItemVal}
              style={{ color: confidenceTrend.delta >= 0 ? '#4ade80' : '#f87171' }}>
              {confidenceTrend.delta >= 0 ? '+' : ''}{confidenceTrend.delta}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Prediction card ───────────────────────────────────────────────────────────
function PredictionCard({ predictedNextWorkflow, personalizedPresetHint }) {
  if (!predictedNextWorkflow && !personalizedPresetHint) return null;
  return (
    <div className={styles.predCard}>
      <SectionHead
        title="AI Prediction"
        sub="Next session recommendation"
        accent="#a78bfa"
      />
      {predictedNextWorkflow && (
        <div className={styles.predRow}>
          <div className={styles.predIcon}>🔮</div>
          <div className={styles.predMeta}>
            <span className={styles.predLabel}>Predicted Workflow</span>
            <span className={styles.predVal}>{predictedNextWorkflow}</span>
          </div>
        </div>
      )}
      {personalizedPresetHint && (
        <div className={styles.predRow}>
          <div className={styles.predIcon}>⚙️</div>
          <div className={styles.predMeta}>
            <span className={styles.predLabel}>Personalized Preset</span>
            <span className={styles.predVal}>{personalizedPresetHint.workflowHint}</span>
            {personalizedPresetHint.settings && (
              <div className={styles.presetPills}>
                {Object.entries(personalizedPresetHint.settings)
                  .filter(([, v]) => v != null)
                  .slice(0, 4)
                  .map(([k, v]) => (
                    <span key={k} className={styles.presetPill}>
                      {k}: {String(v)}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Preferred workflows ───────────────────────────────────────────────────────
function PreferredWorkflows({ workflows }) {
  if (!workflows?.length) return (
    <p className={styles.emptyNote}>No workflow data yet. Start shooting!</p>
  );
  return (
    <div className={styles.wfList}>
      {workflows.slice(0, 6).map((wf, i) => (
        <div key={wf.workflowName ?? i} className={styles.wfRow}>
          <span className={styles.wfRank}>#{i + 1}</span>
          <div className={styles.wfMeta}>
            <span className={styles.wfName}>{wf.workflowName}</span>
            <div className={styles.wfBar}>
              <div
                className={styles.wfBarFill}
                style={{ width: `${wf.score}%` }}
              />
            </div>
          </div>
          <span className={styles.wfScore}>{wf.score}%</span>
          <span className={styles.wfCount}>{wf.count}×</span>
        </div>
      ))}
    </div>
  );
}

// ── Preferred scenes ──────────────────────────────────────────────────────────
function PreferredScenes({ scenes }) {
  if (!scenes?.length) return (
    <p className={styles.emptyNote}>No scene data yet.</p>
  );
  return (
    <div className={styles.sceneList}>
      {scenes.slice(0, 6).map((sc, i) => (
        <div key={sc.scene ?? i} className={styles.sceneRow}>
          <div className={styles.sceneMeta}>
            <span className={styles.sceneName}>{sc.scene}</span>
            <div className={styles.sceneBar}>
              <div
                className={styles.sceneBarFill}
                style={{ width: `${sc.pct}%` }}
              />
            </div>
          </div>
          <span className={styles.scenePct}>{sc.pct}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Camera preferences grid ───────────────────────────────────────────────────
function CameraPrefs({ prefs }) {
  if (!prefs) return (
    <p className={styles.emptyNote}>No camera setting data yet.</p>
  );

  const items = [
    { label: 'Resolution',    value: prefs.resolution,    icon: '🔲' },
    { label: 'FPS',           value: prefs.fps != null ? `${prefs.fps} fps` : null, icon: '🎞' },
    { label: 'HDR',           value: prefs.hdr   != null ? (prefs.hdr   ? 'On' : 'Off') : null, icon: '✨' },
    { label: 'Flash',         value: prefs.flash,         icon: '⚡' },
    { label: 'Stabilization', value: prefs.stabilization, icon: '🎥' },
    { label: 'Focus Mode',    value: prefs.focusMode,     icon: '🎯' },
    { label: 'White Balance', value: prefs.whiteBalance,  icon: '🌡' },
  ].filter(it => it.value != null);

  if (!items.length) return (
    <p className={styles.emptyNote}>No camera setting data yet.</p>
  );

  return (
    <div className={styles.camGrid}>
      {items.map(it => (
        <div key={it.label} className={styles.camCell}>
          <span className={styles.camIcon}>{it.icon}</span>
          <span className={styles.camVal}>{it.value}</span>
          <span className={styles.camLbl}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Analytics stat grid ───────────────────────────────────────────────────────
function AnalyticsStatGrid({ stats, analyticsStats }) {
  const cells = [
    { label: 'Total Sessions',  value: stats?.totalSessions         ?? 0,          color: '#6366f1' },
    { label: 'AI Accepted',     value: stats?.totalAIAccepted       ?? 0,          color: '#a78bfa' },
    { label: 'Acceptance Rate', value: `${stats?.aiAcceptanceRate   ?? 0}%`,       color: '#4ade80' },
    { label: 'Avg Quality',     value: stats?.averageQualityScore   ?? 0,          color: '#fcd34d' },
    { label: 'Avg Gain',        value: `+${stats?.averageQualityImprovement ?? 0}`,color: '#4ade80' },
    { label: 'Best Score',      value: stats?.bestQualityScore      ?? 0,          color: '#06b6d4' },
  ];

  return (
    <div className={styles.statGrid}>
      {cells.map(c => (
        <div key={c.label} className={styles.statCell}>
          <span className={styles.statCellVal} style={{ color: c.color }}>
            {c.value}
          </span>
          <span className={styles.statCellLbl}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Recommendation behaviour card ─────────────────────────────────────────────
function RecommendationBehaviourCard({ behaviour }) {
  if (!behaviour) return null;
  const dir = behaviour.trend ?? 'stable';
  return (
    <div className={styles.recBehCard}>
      <div className={styles.recBehHeader}>
        <span className={styles.recBehTitle}>AI Recommendation Behaviour</span>
        <span
          className={styles.trendChip}
          style={{ color: trendColor(dir), borderColor: trendColor(dir) + '44' }}
        >
          {trendArrow(dir)} {dir}
        </span>
      </div>
      <div className={styles.recBehStats}>
        <div className={styles.recBehStat}>
          <span className={styles.recBehVal}>{behaviour.totalOffered}</span>
          <span className={styles.recBehLbl}>Offered</span>
        </div>
        <div className={styles.recBehStat}>
          <span className={styles.recBehVal} style={{ color: '#4ade80' }}>
            {behaviour.totalAccepted}
          </span>
          <span className={styles.recBehLbl}>Accepted</span>
        </div>
        <div className={styles.recBehStat}>
          <span className={styles.recBehVal} style={{ color: '#a5b4fc' }}>
            {behaviour.acceptanceRate}%
          </span>
          <span className={styles.recBehLbl}>Rate</span>
        </div>
      </div>
      {/* Acceptance bar */}
      <div className={styles.accBar}>
        <div
          className={styles.accBarFill}
          style={{ width: `${behaviour.acceptanceRate}%` }}
        />
      </div>
    </div>
  );
}

// ── Timing card ───────────────────────────────────────────────────────────────
function TimingCard({ timing, habits }) {
  if (!timing && !habits) return null;
  return (
    <div className={styles.timingCard}>
      <SectionHead title="Shooting Habits" sub="When and how you shoot" />
      <div className={styles.timingGrid}>
        {timing?.mostActiveWindow && (
          <div className={styles.timingCell}>
            <span className={styles.timingIcon}>🌅</span>
            <span className={styles.timingVal}>{timing.mostActiveWindow}</span>
            <span className={styles.timingLbl}>Active Window</span>
          </div>
        )}
        {timing?.preferredDayOfWeek && (
          <div className={styles.timingCell}>
            <span className={styles.timingIcon}>📅</span>
            <span className={styles.timingVal}>{timing.preferredDayOfWeek}</span>
            <span className={styles.timingLbl}>Favourite Day</span>
          </div>
        )}
        {timing?.capturesLast7 != null && (
          <div className={styles.timingCell}>
            <span className={styles.timingIcon}>📸</span>
            <span className={styles.timingVal}>{timing.capturesLast7}</span>
            <span className={styles.timingLbl}>Last 7 days</span>
          </div>
        )}
        {timing?.capturesLast30 != null && (
          <div className={styles.timingCell}>
            <span className={styles.timingIcon}>📆</span>
            <span className={styles.timingVal}>{timing.capturesLast30}</span>
            <span className={styles.timingLbl}>Last 30 days</span>
          </div>
        )}
        {habits?.favoriteStyle && (
          <div className={styles.timingCell}>
            <span className={styles.timingIcon}>🎬</span>
            <span className={styles.timingVal}>{habits.favoriteStyle}</span>
            <span className={styles.timingLbl}>Fav Style</span>
          </div>
        )}
        {habits?.favoriteMovement && (
          <div className={styles.timingCell}>
            <span className={styles.timingIcon}>🎥</span>
            <span className={styles.timingVal}>{habits.favoriteMovement}</span>
            <span className={styles.timingLbl}>Fav Movement</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ══ Views ══════════════════════════════════════════════════════════════════════

function OverviewView({ profile, learningProfile, aiConfidence, learningConfidence }) {
  return (
    <div className={styles.viewContent}>
      <ProfileHero
        memoryProfile={profile}
        aiConfidence={aiConfidence}
        learningConfidence={learningConfidence}
        isLearning={false}
      />

      <AIStyleCard
        aiStyleProfile={learningProfile?.aiStyleProfile}
        confidenceTrend={learningProfile?.confidenceTrend}
      />

      <PredictionCard
        predictedNextWorkflow={learningProfile?.predictedNextWorkflow}
        personalizedPresetHint={learningProfile?.personalizedPresetHint}
      />
    </div>
  );
}

function LearningView({ learningProfile }) {
  return (
    <div className={styles.viewContent}>
      <div className={styles.card}>
        <SectionHead
          title="Preferred Workflows"
          sub="Ranked by frequency · recency"
          accent="#6366f1"
        />
        <PreferredWorkflows workflows={learningProfile?.preferredWorkflows} />
      </div>

      <div className={styles.card}>
        <SectionHead
          title="Preferred Scenes"
          sub="Your most-shot environments"
          accent="#06b6d4"
        />
        <PreferredScenes scenes={learningProfile?.preferredScenes} />
      </div>

      <div className={styles.card}>
        <SectionHead
          title="Camera Setting Preferences"
          sub="Majority vote across all shoots"
          accent="#a78bfa"
        />
        <CameraPrefs prefs={learningProfile?.cameraSettingPreferences} />
      </div>
    </div>
  );
}

function AnalyticsView({ creatorStats, analyticsStats, learningProfile }) {
  return (
    <div className={styles.viewContent}>
      <div className={styles.card}>
        <SectionHead
          title="Creator Analytics"
          sub="Aggregated across all sessions"
          accent="#6366f1"
        />
        <AnalyticsStatGrid stats={creatorStats} analyticsStats={analyticsStats} />
      </div>

      <RecommendationBehaviourCard
        behaviour={learningProfile?.recommendationBehaviour}
      />

      <TimingCard
        timing={learningProfile?.captureTimingPreferences}
        habits={learningProfile?.shootingHabits}
      />
    </div>
  );
}

function MemoryView() {
  return (
    <div className={styles.viewContent}>
      <MemoryTimeline />
    </div>
  );
}

// ══ Root screen ════════════════════════════════════════════════════════════════

export default function CreatorIntelligenceScreen() {
  const { profile: learningProfile, isLearning } = useCreatorLearning();
  const { state: analyticsState, creatorScore }  = useAnalytics();
  const {
    state: memoryState,
    creatorStats,
    loadMemory,
  } = useCreatorMemory();

  const [activeTab, setActiveTab] = useState('overview');

  // Trigger memory load on mount if not yet loaded
  useEffect(() => {
    if (memoryState.loadState === 'idle') loadMemory();
  }, [memoryState.loadState, loadMemory]);

  const memoryProfile     = memoryState.profile;
  const aiConfidence      = memoryProfile?.aiConfidenceScore ?? 0;
  const learningConfidence= learningProfile?.learningConfidence ?? 0;
  const analyticsStats    = analyticsState.statistics;

  // Stats row derived values
  const totalSessions = creatorStats?.totalSessions ?? 0;
  const aiAcceptance  = creatorStats?.aiAcceptanceRate ?? 0;
  const avgQuality    = creatorStats?.averageQualityScore ?? 0;

  function renderView() {
    switch (activeTab) {
      case 'learning':
        return <LearningView learningProfile={learningProfile} />;
      case 'analytics':
        return (
          <AnalyticsView
            creatorStats={creatorStats}
            analyticsStats={analyticsStats}
            learningProfile={learningProfile}
          />
        );
      case 'memory':
        return <MemoryView />;
      default:
        return (
          <OverviewView
            profile={memoryProfile}
            learningProfile={learningProfile}
            aiConfidence={aiConfidence}
            learningConfidence={learningConfidence}
          />
        );
    }
  }

  return (
    <div className={styles.screen}>

      {/* ── Fixed header ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            IBM watsonx.ai
          </span>
          <h1 className={styles.headerTitle}>Creator Intelligence</h1>
          <p className={styles.headerSub}>
            {memoryProfile?.name ?? 'Creator'} · AI Learning Active
          </p>
        </div>
        <div className={styles.headerScore}>
          <span className={styles.headerScoreVal}>{creatorScore}</span>
          <span className={styles.headerScoreLbl}>Score</span>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        <div className={styles.statPill}>
          <span className={styles.statVal}>{totalSessions}</span>
          <span className={styles.statLbl}>Sessions</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal} style={{ color: '#4ade80' }}>{aiAcceptance}%</span>
          <span className={styles.statLbl}>AI Accept</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal}>{avgQuality}</span>
          <span className={styles.statLbl}>Avg Quality</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal} style={{ color: '#a5b4fc' }}>{learningConfidence}</span>
          <span className={styles.statLbl}>Learning</span>
        </div>
      </div>

      {/* ── View tabs ────────────────────────────────────────────────── */}
      <div className={styles.viewTabs} role="tablist" aria-label="Intelligence views">
        {VIEW_TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.viewTab} ${activeTab === tab.id ? styles.viewTabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.viewTabIcon}>{tab.icon}</span>
            <span className={styles.viewTabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <div className={styles.scroll} role="tabpanel">
        {isLearning && (
          <div className={styles.learningBanner}>
            <span className={styles.learningDot} />
            Updating intelligence profile…
          </div>
        )}
        {renderView()}
        <div style={{ height: 100 }} />
      </div>

      <BottomNavBar />
    </div>
  );
}

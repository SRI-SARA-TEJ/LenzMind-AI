/**
 * memory/components/MemoryDashboard.jsx
 *
 * Full Creator Memory Dashboard — replaces Phase 1 placeholder.
 *
 * Sections:
 *   1. Creator Profile card (avatar, AI learning level, genres, stats)
 *   2. Creative Streak card
 *   3. Dashboard Stats grid (8 glassmorphism stat cards)
 *   4. Favourite Styles (camera, editing, export, workflow, colour, motion)
 *   5. Creator Preferences (learned settings list)
 *   6. Favourite Workflows (ranked with quality gain)
 *   7. Detected Patterns (top 3 AI-detected behaviour patterns)
 *   8. Milestones (all milestones with progress bars)
 */

import React, { useMemo } from 'react';
import styles from './MemoryDashboard.module.css';
import { useCreatorMemory } from '../hooks/useCreatorMemory';

// ── Quality colour helper ─────────────────────────────────────────────────────
function qColor(n) {
  if (n == null || n === 0) return 'rgba(255,255,255,0.4)';
  if (n >= 85) return '#4ade80';
  if (n >= 70) return '#fcd34d';
  return '#f87171';
}

// ── Format date ───────────────────────────────────────────────────────────────
function fmtDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Creator Profile Card
// ─────────────────────────────────────────────────────────────────────────────
const CIRC = 2 * Math.PI * 18;

function ProfileCard({ profile, creatorStats }) {
  if (!profile) return null;
  const conf = profile.aiConfidenceScore ?? 0;
  const offset = CIRC * (1 - conf / 100);

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileTop}>
        {/* Avatar */}
        <div className={styles.avatar}>{profile.avatarInitials}</div>

        {/* Name / handle / genres */}
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{profile.name}</span>
          <span className={styles.profileHandle}>{profile.handle}</span>
          <div className={styles.profileGenres}>
            {profile.primaryGenres?.map(g => (
              <span key={g} className={styles.genreTag}>{g}</span>
            ))}
          </div>
        </div>

        {/* AI Learning Level ring */}
        <div className={styles.aiLevelBadge}>
          <div className={styles.aiLevelRing}>
            <svg viewBox="0 0 40 40" width="48" height="48">
              <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="4" />
              <circle
                cx="20" cy="20" r="18"
                fill="none"
                stroke="url(#confGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
              />
              <defs>
                <linearGradient id="confGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.aiLevelVal}>{conf}</span>
          </div>
          <span className={styles.aiLevelLbl}>AI Level</span>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.profileStats}>
        <div className={styles.profileStat}>
          <span className={styles.profileStatVal}>{creatorStats.totalSessions}</span>
          <span className={styles.profileStatLbl}>Sessions</span>
        </div>
        <div className={styles.profileStatSep} />
        <div className={styles.profileStat}>
          <span className={styles.profileStatVal}>{creatorStats.totalAIAccepted}</span>
          <span className={styles.profileStatLbl}>AI Accepted</span>
        </div>
        <div className={styles.profileStatSep} />
        <div className={styles.profileStat}>
          <span className={styles.profileStatVal} style={{ color: '#4ade80' }}>
            +{creatorStats.averageQualityImprovement}
          </span>
          <span className={styles.profileStatLbl}>Avg Gain</span>
        </div>
        <div className={styles.profileStatSep} />
        <div className={styles.profileStat}>
          <span className={styles.profileStatVal}>
            {profile.statistics?.currentStreak ?? 0}
          </span>
          <span className={styles.profileStatLbl}>Streak</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Streak Card
// ─────────────────────────────────────────────────────────────────────────────
function StreakCard({ profile }) {
  const streak  = profile?.statistics?.currentStreak  ?? 0;
  const longest = profile?.statistics?.longestStreak  ?? 0;
  return (
    <div className={styles.streakCard}>
      <span className={styles.streakIcon}>🔥</span>
      <div className={styles.streakMeta}>
        <span className={styles.streakTitle}>{streak}-Day Active Streak</span>
        <span className={styles.streakSub}>
          Longest: {longest} days · Keep creating!
        </span>
      </div>
      <div>
        <div className={styles.streakVal}>{streak}</div>
        <div className={styles.streakDays}>days</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Stats Grid
// ─────────────────────────────────────────────────────────────────────────────
function StatsGrid({ creatorStats, mostUsedWorkflow, profile }) {
  const cards = [
    {
      icon:  '🎬',
      label: 'Total Sessions',
      val:   creatorStats.totalSessions,
      bar:   (creatorStats.totalSessions / 50) * 100,
      color: '#6366f1',
    },
    {
      icon:  '🤝',
      label: 'AI Accepted',
      val:   creatorStats.totalAIAccepted,
      bar:   creatorStats.aiAcceptanceRate,
      color: '#8b5cf6',
    },
    {
      icon:  '📈',
      label: 'Avg Improvement',
      val:   `+${creatorStats.averageQualityImprovement}`,
      bar:   creatorStats.averageQualityImprovement,
      color: '#4ade80',
    },
    {
      icon:  '🌐',
      label: 'Fav Platform',
      val:   creatorStats.favoritePlatform,
      bar:   null,
      color: '#06b6d4',
    },
    {
      icon:  '📦',
      label: 'Fav Format',
      val:   creatorStats.favoriteExportFormat,
      bar:   null,
      color: '#f59e0b',
    },
    {
      icon:  '⚙️',
      label: 'Fav Workflow',
      val:   mostUsedWorkflow?.name ?? '—',
      bar:   null,
      color: '#e879f9',
    },
    {
      icon:  '⭐',
      label: 'Learning Score',
      val:   `${profile?.aiConfidenceScore ?? 0}%`,
      bar:   profile?.aiConfidenceScore ?? 0,
      color: '#a5b4fc',
    },
    {
      icon:  '🎯',
      label: 'Best Quality',
      val:   creatorStats.bestQualityScore,
      bar:   creatorStats.bestQualityScore,
      color: qColor(creatorStats.bestQualityScore),
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={styles.statCard}
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          <div className={styles.statCardTop}>
            <span className={styles.statCardIcon}>{c.icon}</span>
            <span className={styles.statCardVal} style={{ color: c.bar != null ? c.color : '#e8eaf0' }}>
              {c.val}
            </span>
          </div>
          <span className={styles.statCardLbl}>{c.label}</span>
          {c.bar != null && (
            <div className={styles.statCardBar}>
              <div
                className={styles.statCardBarFill}
                style={{ width: `${Math.min(100, c.bar)}%`, background: c.color }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Favourite Styles
// ─────────────────────────────────────────────────────────────────────────────
function FavouriteStyles({ state, creatorStats }) {
  const camTop  = state.favoriteCamera[0];
  const editTop = state.favoriteEditing[0];
  const wfTop   = state.favoriteWorkflows[0];

  const cards = [
    {
      icon:  '🎥',
      title: camTop?.movement ?? 'Tracking Shot',
      sub:   'Camera Style',
      usage: camTop?.usageCount ?? '—',
    },
    {
      icon:  '🎨',
      title: editTop?.label ?? 'Cinematic Grade',
      sub:   'Editing Style',
      usage: editTop?.usageCount ?? '—',
    },
    {
      icon:  '📦',
      title: `${creatorStats.favoriteExportFormat} · ${state.preferences.find(p => p.key === 'exportResolution')?.value ?? '4K'}`,
      sub:   'Export Preset',
      usage: state.preferences.find(p => p.key === 'exportResolution')?.usageCount ?? '—',
    },
    {
      icon:  wfTop?.icon ?? '⚙️',
      title: wfTop?.name ?? 'Travel Vlog',
      sub:   'Workflow',
      usage: wfTop?.usageCount ?? '—',
    },
    {
      icon:  '🌈',
      title: state.preferences.find(p => p.key === 'colourGradeStyle')?.value ?? 'Teal-Orange',
      sub:   'Colour Grade',
      usage: state.preferences.find(p => p.key === 'colourGradeStyle')?.usageCount ?? '—',
    },
    {
      icon:  '🎬',
      title: camTop?.technique ?? 'Cinematic',
      sub:   'Motion Style',
      usage: camTop?.usageCount ?? '—',
    },
  ];

  return (
    <div className={styles.stylesRow}>
      {cards.map((c, i) => (
        <div
          key={c.sub}
          className={styles.styleCard}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <span className={styles.styleCardIcon}>{c.icon}</span>
          <span className={styles.styleCardTitle}>{c.title}</span>
          <span className={styles.styleCardSub}>{c.sub}</span>
          <span className={styles.styleUsage}>{c.usage}× used</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Creator Preferences
// ─────────────────────────────────────────────────────────────────────────────
const PREF_ICONS = {
  exportResolution:     '🔲',
  exportFormat:         '📦',
  primaryPlatform:      '🌐',
  frameRate:            '🎞',
  captionsEnabled:      '💬',
  audioCleanupLevel:    '🎙',
  stabilisationLevel:   '🎥',
  colourGradeStyle:     '🌈',
  exportQuality:        '⭐',
  backgroundMusicStyle: '🎵',
};

function PreferencesSection({ preferences }) {
  // Show top 8 most-used preferences
  const top8 = useMemo(
    () => [...preferences].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8),
    [preferences]
  );

  return (
    <div className={styles.prefCard}>
      {top8.map((pref, i) => (
        <React.Fragment key={pref.id}>
          <div className={styles.prefRow}>
            <span className={styles.prefIcon}>{PREF_ICONS[pref.key] ?? '⚙️'}</span>
            <div className={styles.prefLabelGroup}>
              <span className={styles.prefLabel}>{pref.label}</span>
              <span className={styles.prefSub}>{pref.category}</span>
            </div>
            <span className={styles.prefValue}>{pref.value}</span>
            {pref.aiLearned && <span className={styles.aiLearnedDot} title="AI Learned" />}
          </div>
          {i < top8.length - 1 && <div className={styles.prefDivider} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 — Favourite Workflows
// ─────────────────────────────────────────────────────────────────────────────
function FavouriteWorkflows({ workflows }) {
  return (
    <div className={styles.workflowList}>
      {workflows.slice(0, 5).map((wf, i) => (
        <div key={wf.workflowId} className={styles.workflowCard} style={{ animationDelay: `${i * 0.04}s` }}>
          <span className={styles.workflowIcon}>{wf.icon}</span>
          <div className={styles.workflowMeta}>
            <div className={styles.workflowName}>{wf.name}</div>
            <div className={styles.workflowSub}>
              {wf.category} · Last: {fmtDate(wf.lastUsedAt)}
            </div>
          </div>
          <div className={styles.workflowStats}>
            <span className={styles.workflowUsage}>{wf.usageCount}× used</span>
            <span className={styles.workflowGain}>+{wf.averageQualityGain} avg</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 — Detected Patterns
// ─────────────────────────────────────────────────────────────────────────────
function DetectedPatterns({ patterns }) {
  const top3 = patterns.filter(p => p.isActive).slice(0, 3);

  return (
    <div className={styles.patternList}>
      {top3.map((pat, i) => (
        <div key={pat.id} className={styles.patternCard} style={{ animationDelay: `${i * 0.06}s` }}>
          <div className={styles.patternTop}>
            <span className={styles.patternTypeBadge}>{pat.type}</span>
            <span className={styles.patternTitle}>{pat.title}</span>
          </div>
          <div className={styles.patternConfRow}>
            <div className={styles.patternConfTrack}>
              <div
                className={styles.patternConfFill}
                style={{ width: `${pat.confidenceScore}%` }}
              />
            </div>
            <span className={styles.patternConfPct}>{pat.confidenceScore}%</span>
          </div>
          <p className={styles.patternDesc}>{pat.description}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 8 — Milestones
// ─────────────────────────────────────────────────────────────────────────────
function MilestonesSection({ milestones }) {
  return (
    <div className={styles.milestonesGrid}>
      {milestones.map((m, i) => (
        <div
          key={m.id}
          className={`${styles.milestoneCard} ${m.achieved ? styles.milestoneCardAchieved : ''}`}
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          <div className={styles.milestoneTop}>
            <div className={`${styles.milestoneIconWrap} ${m.achieved ? styles.milestoneIconWrapAchieved : ''}`}>
              {m.icon}
            </div>
            <div className={styles.milestoneMeta}>
              <div className={styles.milestoneTitle}>{m.title}</div>
              <div className={styles.milestoneDesc}>{m.description}</div>
            </div>
            <div className={styles.milestoneStatus}>
              {m.achieved ? (
                <>
                  <span className={styles.milestoneAchievedBadge}>✓ Achieved</span>
                  <span className={styles.milestoneDate}>{fmtDate(m.achievedAt)}</span>
                </>
              ) : (
                <span className={styles.milestonePct}>{m.progress}%</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.milestoneProgressRow}>
            <div className={styles.milestoneProgressTrack}>
              <div
                className={styles.milestoneProgressFill}
                style={{
                  width:      `${m.progress}%`,
                  background: m.achieved ? '#4ade80' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
            <span className={styles.milestonePct}>
              {m.currentValue}/{m.targetValue}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main MemoryDashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function MemoryDashboard() {
  const {
    state,
    creatorStats,
    mostUsedWorkflow,
  } = useCreatorMemory();

  const { profile, preferences, patterns, milestones, favoriteWorkflows } = state;

  return (
    <div>
      {/* ── 1. Creator Profile ─────────────────────────────────────── */}
      <ProfileCard profile={profile} creatorStats={creatorStats} />

      {/* ── 2. Streak ──────────────────────────────────────────────── */}
      <StreakCard profile={profile} />

      {/* ── 3. Stats Grid ──────────────────────────────────────────── */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Creator Statistics</p>
        <StatsGrid
          creatorStats={creatorStats}
          mostUsedWorkflow={mostUsedWorkflow}
          profile={profile}
        />
      </div>

      {/* ── 4. Favourite Styles ────────────────────────────────────── */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Favourite Styles</p>
        <FavouriteStyles state={state} creatorStats={creatorStats} />
      </div>

      {/* ── 5. Creator Preferences ─────────────────────────────────── */}
      {preferences.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Learned Preferences</p>
          <PreferencesSection preferences={preferences} />
        </div>
      )}

      {/* ── 6. Favourite Workflows ─────────────────────────────────── */}
      {favoriteWorkflows.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Favourite Workflows</p>
          <FavouriteWorkflows workflows={favoriteWorkflows} />
        </div>
      )}

      {/* ── 7. Detected Patterns ───────────────────────────────────── */}
      {patterns.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>AI-Detected Patterns</p>
          <DetectedPatterns patterns={patterns} />
        </div>
      )}

      {/* ── 8. Milestones ──────────────────────────────────────────── */}
      {milestones.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Creator Milestones</p>
          <MilestonesSection milestones={milestones} />
        </div>
      )}
    </div>
  );
}

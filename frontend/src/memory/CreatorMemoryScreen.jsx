/**
 * memory/CreatorMemoryScreen.jsx
 *
 * Creator Memory Intelligence — Main Screen
 *
 * This is the root screen for Module 6.
 * It wraps itself in CreatorMemoryProvider and handles:
 *   - Initial data load (simulated async via loadMemory action)
 *   - Loading state display
 *   - Error state display
 *   - Empty state (no sessions yet)
 *   - Main content when memory is loaded
 *
 * Internal navigation via state.activeView:
 *   'dashboard'    → MemoryDashboard  (Phase 2)
 *   'timeline'     → MemoryTimeline   (Phase 2)
 *   'insights'     → MemoryInsightCard list (Phase 2)
 *   'milestones'   → milestone grid   (Phase 2)
 *   'preferences'  → preference list  (Phase 2)
 *
 * Phase 1 — Foundation:
 *   All sub-views render placeholder components.
 *   The screen shell, header, stats row, and nav tabs are fully implemented.
 *
 * [AI_FUTURE] — IBM watsonx.ai will populate all sections via real API.
 */

import React, { useEffect } from 'react';
import styles from './CreatorMemoryScreen.module.css';

import { useCreatorMemory } from './hooks/useCreatorMemory';

import MemoryDashboard   from './components/MemoryDashboard';
import MemoryTimeline    from './components/MemoryTimeline';
import MemoryInsightCard from './components/MemoryInsightCard';
import MemoryEmptyState  from './components/MemoryEmptyState';

// local CSS for milestones/prefs full-page views (reuse dashboard classes via inline)
import dashStyles from './components/MemoryDashboard.module.css';

import BottomNavBar from '../camera/components/BottomNavBar';

// ── View tab definitions ──────────────────────────────────────────────────────
const VIEW_TABS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
  { id: 'timeline',    label: 'Timeline',    icon: '⏱' },
  { id: 'insights',    label: 'Insights',    icon: '💡' },
  { id: 'milestones',  label: 'Milestones',  icon: '🏆' },
  { id: 'preferences', label: 'Prefs',       icon: '⚙️' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Loading screen
// ─────────────────────────────────────────────────────────────────────────────
function MemoryLoadingScreen() {
  return (
    <div className={styles.centreShell}>
      <div className={styles.loadingRing}>
        <div className={styles.loadingSpinner} />
      </div>
      <p className={styles.loadingLabel}>Loading Creator Memory…</p>
      <p className={styles.loadingSub}>IBM watsonx.ai is reading your history</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error screen
// ─────────────────────────────────────────────────────────────────────────────
function MemoryErrorScreen({ message, onRetry }) {
  return (
    <div className={styles.centreShell}>
      <span className={styles.errorIcon}>⚠️</span>
      <p className={styles.errorLabel}>Failed to load memory</p>
      <p className={styles.errorSub}>{message ?? 'Unknown error. Please try again.'}</p>
      <button className={styles.retryBtn} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner content — rendered once memory is loaded
// ─────────────────────────────────────────────────────────────────────────────
function MemoryContent() {
  const {
    state,
    creatorStats,
    activeInsights,
    setActiveView,
    loadMemory,
    dismissInsight,
  } = useCreatorMemory();

  const { loadState, errorMessage, profile, activeView } = state;

  // Trigger load on mount
  useEffect(() => {
    if (loadState === 'idle') {
      loadMemory();
    }
  }, [loadState, loadMemory]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadState === 'idle' || loadState === 'loading') {
    return (
      <div className={styles.screen}>
        <MemoryLoadingScreen />
        <BottomNavBar />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div className={styles.screen}>
        <MemoryErrorScreen message={errorMessage} onRetry={loadMemory} />
        <BottomNavBar />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (creatorStats.totalSessions === 0) {
    return (
      <div className={styles.screen}>
        <div className={styles.emptyShell}>
          <MemoryEmptyState />
        </div>
        <BottomNavBar />
      </div>
    );
  }

  // ── Active view content ────────────────────────────────────────────────────
  function renderActiveView() {
    switch (activeView) {
      case 'timeline':
        return <MemoryTimeline />;

      case 'insights':
        return (
          <div className={styles.insightsList}>
            {activeInsights.length === 0
              ? <p className={styles.emptyMsg}>No active insights right now.</p>
              : activeInsights.map(ins => (
                  <MemoryInsightCard
                    key={ins.id}
                    insight={ins}
                    onDismiss={dismissInsight}
                  />
                ))
            }
          </div>
        );

      case 'milestones': {
        const { milestones } = state;
        return (
          <div className={dashStyles.milestonesGrid}>
            {milestones.map((m, i) => {
              const fmtDate = (d) => d
                ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                : '—';
              return (
                <div
                  key={m.id}
                  className={`${dashStyles.milestoneCard} ${m.achieved ? dashStyles.milestoneCardAchieved : ''}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className={dashStyles.milestoneTop}>
                    <div className={`${dashStyles.milestoneIconWrap} ${m.achieved ? dashStyles.milestoneIconWrapAchieved : ''}`}>
                      {m.icon}
                    </div>
                    <div className={dashStyles.milestoneMeta}>
                      <div className={dashStyles.milestoneTitle}>{m.title}</div>
                      <div className={dashStyles.milestoneDesc}>{m.description}</div>
                    </div>
                    <div className={dashStyles.milestoneStatus}>
                      {m.achieved
                        ? <><span className={dashStyles.milestoneAchievedBadge}>✓ Achieved</span>
                             <span className={dashStyles.milestoneDate}>{fmtDate(m.achievedAt)}</span></>
                        : <span className={dashStyles.milestonePct}>{m.progress}%</span>
                      }
                    </div>
                  </div>
                  <div className={dashStyles.milestoneProgressRow}>
                    <div className={dashStyles.milestoneProgressTrack}>
                      <div
                        className={dashStyles.milestoneProgressFill}
                        style={{
                          width:      `${m.progress}%`,
                          background: m.achieved ? '#4ade80' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                        }}
                      />
                    </div>
                    <span className={dashStyles.milestonePct}>{m.currentValue}/{m.targetValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'preferences': {
        const { preferences } = state;
        const PREF_ICONS = {
          exportResolution: '🔲', exportFormat: '📦', primaryPlatform: '🌐',
          frameRate: '🎞', captionsEnabled: '💬', audioCleanupLevel: '🎙',
          stabilisationLevel: '🎥', colourGradeStyle: '🌈', exportQuality: '⭐',
          backgroundMusicStyle: '🎵', defaultWorkflow: '⚙️', captureResolution: '📷',
        };
        return (
          <div className={dashStyles.prefCard}>
            {[...preferences]
              .sort((a, b) => b.usageCount - a.usageCount)
              .map((pref, i, arr) => (
                <React.Fragment key={pref.id}>
                  <div className={dashStyles.prefRow}>
                    <span className={dashStyles.prefIcon}>{PREF_ICONS[pref.key] ?? '⚙️'}</span>
                    <div className={dashStyles.prefLabelGroup}>
                      <span className={dashStyles.prefLabel}>{pref.label}</span>
                      <span className={dashStyles.prefSub}>{pref.category} · {pref.usageCount}× used</span>
                    </div>
                    <span className={dashStyles.prefValue}>{pref.value}</span>
                    {pref.aiLearned && <span className={dashStyles.aiLearnedDot} title="AI Learned" />}
                  </div>
                  {i < arr.length - 1 && <div className={dashStyles.prefDivider} />}
                </React.Fragment>
              ))
            }
          </div>
        );
      }

      default:
        return <MemoryDashboard />;
    }
  }

  return (
    <div className={styles.screen}>

      {/* ── Fixed header ───────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            <span>IBM watsonx.ai</span>
          </div>
          <h1 className={styles.headerTitle}>Creator Memory</h1>
          <p className={styles.headerSub}>
            {profile?.name ?? 'Creator'} · AI Confidence {profile?.aiConfidenceScore ?? 0}%
          </p>
        </div>
        <div className={styles.headerAvatar}>
          {profile?.avatarInitials ?? '??'}
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        <div className={styles.statPill}>
          <span className={styles.statVal}>{creatorStats.totalSessions}</span>
          <span className={styles.statLbl}>Sessions</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal}>{creatorStats.totalAIAccepted}</span>
          <span className={styles.statLbl}>AI Accepted</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal}>{creatorStats.averageQualityScore}</span>
          <span className={styles.statLbl}>Avg Quality</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal} style={{ color: '#4ade80' }}>
            +{creatorStats.averageQualityImprovement}
          </span>
          <span className={styles.statLbl}>Avg Gain</span>
        </div>
      </div>

      {/* ── View tabs ──────────────────────────────────────────────── */}
      <div className={styles.viewTabs}>
        {VIEW_TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.viewTab} ${activeView === tab.id ? styles.viewTabActive : ''}`}
            onClick={() => setActiveView(tab.id)}
            aria-pressed={activeView === tab.id}
          >
            <span className={styles.viewTabIcon}>{tab.icon}</span>
            <span className={styles.viewTabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Scrollable view content ─────────────────────────────────── */}
      <div className={styles.scroll}>
        {renderActiveView()}
        <div style={{ height: 100 }} />
      </div>

      <BottomNavBar />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// CreatorMemoryProvider is now an ancestor at App level (Module 8.7),
// so this screen no longer needs to wrap itself.
// ─────────────────────────────────────────────────────────────────────────────
export default function CreatorMemoryScreen() {
  return <MemoryContent />;
}

/**
 * analytics/components/AnalyticsScreen.jsx
 *
 * Module 8.8 — AnalyticsProvider is now lifted to App.jsx (app root).
 * This screen renders directly into the shared provider — no self-wrap.
 */
import React, { useEffect } from 'react';
import styles from './AnalyticsScreen.module.css';

import { useAnalytics } from '../hooks/useAnalytics';

import AnalyticsDashboard, {
  PlatformAnalytics,
  WorkflowAnalytics,
} from './AnalyticsDashboard';
import PerformanceChart from './PerformanceChart';
import InsightCard from './InsightCard';
import AnalyticsEmptyState from './AnalyticsEmptyState';

import BottomNavBar from '../../camera/components/BottomNavBar';

const VIEW_TABS = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'insights', label: 'Insights' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'platforms', label: 'Platforms' },
];

function AnalyticsLoadingScreen() {
  return (
    <div className={styles.centreShell}>
      <div className={styles.loadingRing}>
        <div className={styles.loadingSpinner} />
      </div>
      <p className={styles.loadingLabel}>Loading Analytics…</p>
      <p className={styles.loadingSub}>IBM watsonx.ai is processing your sessions</p>
    </div>
  );
}

function AnalyticsErrorScreen({ message, onRetry }) {
  return (
    <div className={styles.centreShell}>
      <p className={styles.errorLabel}>Failed to load analytics</p>
      <p className={styles.errorSub}>{message ?? 'Unknown error. Please try again.'}</p>
      <button className={styles.retryBtn} onClick={onRetry}>Retry</button>
    </div>
  );
}

function PerformanceView() {
  return (
    <>
      <PerformanceChart type="quality" title="Quality Over Time" height={210} />
      <PerformanceChart type="weekly" title="Weekly Performance" height={190} />
      <PerformanceChart type="monthly" title="Monthly Performance" height={190} />
      <PerformanceChart type="acceptance" title="AI Acceptance Trend" height={190} />
      <PerformanceChart type="growth" title="Creator Growth" height={190} />
    </>
  );
}

function AnalyticsScreenInner() {
  const {
    state,
    creatorScore,
    avgQualityScore,
    avgImprovementDelta,
    activeInsights,
    setActiveView,
    loadAnalytics,
    dismissInsight,
  } = useAnalytics();

  const { loadState, errorMessage, activeView, statistics } = state;

  useEffect(() => {
    if (loadState === 'idle') {
      loadAnalytics();
    }
  }, [loadState, loadAnalytics]);

  if (loadState === 'idle' || loadState === 'loading') {
    return (
      <div className={styles.screen}>
        <AnalyticsLoadingScreen />
        <BottomNavBar />
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className={styles.screen}>
        <AnalyticsErrorScreen message={errorMessage} onRetry={loadAnalytics} />
        <BottomNavBar />
      </div>
    );
  }

  if (state.sessions.length === 0) {
    return (
      <div className={styles.screen}>
        <div className={styles.emptyShell}><AnalyticsEmptyState /></div>
        <BottomNavBar />
      </div>
    );
  }

  function renderView() {
    switch (activeView) {
      case 'performance':
        return <PerformanceView />;

      case 'insights':
        return (
          <div className={styles.insightsList}>
            {activeInsights.length === 0 ? (
              <p className={styles.emptyMsg}>No active insights right now.</p>
            ) : (
              activeInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onDismiss={dismissInsight}
                />
              ))
            )}
          </div>
        );

      case 'workflows':
        return <WorkflowAnalytics />;

      case 'platforms':
        return <PlatformAnalytics />;

      default:
        return <AnalyticsDashboard />;
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            <span>IBM watsonx.ai</span>
          </div>
          <h1 className={styles.headerTitle}>Creator Analytics</h1>
          <p className={styles.headerSub}>
            {statistics?.totalSessions ?? 0} sessions · Score {creatorScore}
          </p>
        </div>

        <div className={styles.headerScore}>
          <span className={styles.headerScoreVal}>{creatorScore}</span>
          <span className={styles.headerScoreLbl}>Score</span>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statPill}>
          <span className={styles.statVal}>{statistics?.totalSessions ?? 0}</span>
          <span className={styles.statLbl}>Sessions</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal}>{avgQualityScore}</span>
          <span className={styles.statLbl}>Avg Quality</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal} style={{ color: '#4ade80' }}>+{avgImprovementDelta}</span>
          <span className={styles.statLbl}>Avg Gain</span>
        </div>
        <div className={styles.statPillSep} />
        <div className={styles.statPill}>
          <span className={styles.statVal} style={{ color: '#a5b4fc' }}>
            {statistics?.overallAcceptanceRate ?? 0}%
          </span>
          <span className={styles.statLbl}>AI Accepted</span>
        </div>
      </div>

      <div className={styles.viewTabs}>
        {VIEW_TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.viewTab} ${activeView === tab.id ? styles.viewTabActive : ''}`}
            onClick={() => setActiveView(tab.id)}
            aria-pressed={activeView === tab.id}
          >
            <span className={styles.viewTabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <main className={styles.scroll}>
        {renderView()}
        <div style={{ height: 100 }} />
      </main>

      <BottomNavBar />
    </div>
  );
}

// AnalyticsProvider is an ancestor at App level (Module 8.8).
export default function AnalyticsScreen() {
  return <AnalyticsScreenInner />;
}
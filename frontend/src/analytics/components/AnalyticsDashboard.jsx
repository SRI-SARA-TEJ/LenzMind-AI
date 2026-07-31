import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import PerformanceChart from './PerformanceChart';
import InsightCard from './InsightCard';
import styles from './AnalyticsDashboard.module.css';

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const paths = {
    sessions: <><path d="M4 19.5V9.75A1.75 1.75 0 0 1 5.75 8h12.5A1.75 1.75 0 0 1 20 9.75v9.75" /><path d="M3 19.5h18" /><path d="M8 8V5.75A1.75 1.75 0 0 1 9.75 4h4.5A1.75 1.75 0 0 1 16 5.75V8" /></>,
    spark: <><path d="m4 16 5-5 3 3 7-8" /><path d="M14 6h5v5" /></>,
    quality: <><path d="M12 3 4.5 7v5c0 4.7 3.2 7.95 7.5 9 4.3-1.05 7.5-4.3 7.5-9V7L12 3Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>,
    time: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    growth: <><path d="M4 18 10 12l4 3 6-8" /><path d="M16 7h4v4" /></>,
    platform: <><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.2 2.35 3.3 5.18 3.3 8.5S14.2 18.15 12 20.5C9.8 18.15 8.7 15.32 8.7 12S9.8 5.85 12 3.5Z" /></>,
    workflow: <><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="M8 9h8M8 13h5" /></>,
    edit: <><path d="m5 19 3.5-.75L18.2 8.6a2.1 2.1 0 0 0-3-3l-9.7 9.65L5 19Z" /><path d="m13.8 7 3 3" /></>,
    insight: <><path d="M9 18h6M10 21h4M8.4 15.4A6.2 6.2 0 1 1 15.6 15.4c-.95.7-1.55 1.56-1.7 2.6h-3.8c-.15-1.04-.75-1.9-1.7-2.6Z" /></>,
    accepted: <><path d="m5 12 4.2 4.2L19 6.5" /></>,
  };

  return <svg {...common}>{paths[name] ?? paths.sessions}</svg>;
}

function SectionTitle({ icon, title, sub, action }) {
  return (
    <div className={styles.sectionHeading}>
      <div className={styles.sectionTitleGroup}>
        <span className={styles.sectionIcon}><Icon name={icon} size={16} /></span>
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function TrendBadge({ trend = 'up', value }) {
  const symbol = trend === 'down' ? '↓' : trend === 'flat' ? '→' : '↑';
  return (
    <span className={`${styles.trendBadge} ${trend === 'down' ? styles.trendDown : ''}`}>
      {symbol} {value}
    </span>
  );
}

function ScoreRing({ score }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <div className={styles.scoreRing}>
      <svg viewBox="0 0 124 124" role="img" aria-label={`Creator score ${score} out of 100`}>
        <defs>
          <linearGradient id="creatorScoreGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle className={styles.scoreTrack} cx="62" cy="62" r={radius} />
        <circle
          className={styles.scoreProgress}
          cx="62"
          cy="62"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.scoreCenter}>
        <strong>{score}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, suffix = '', progress, tone = 'indigo' }) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricTop}>
        <span className={`${styles.metricIcon} ${styles[`tone${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
          <Icon name={icon} size={17} />
        </span>
        <span className={styles.metricLabel}>{label}</span>
      </div>
      <strong className={styles.metricValue}>{value}<small>{suffix}</small></strong>
      <div className={styles.miniTrack}>
        <span className={`${styles.miniFill} ${styles[`fill${tone[0].toUpperCase()}${tone.slice(1)}`]}`} style={{ width: `${Math.min(Math.max(progress, 4), 100)}%` }} />
      </div>
    </article>
  );
}

export function WorkflowAnalytics({ compact = false }) {
  const { state } = useAnalytics();
  const workflows = [...state.workflowMetrics].sort((a, b) => b.usageCount - a.usageCount);
  const maxUsage = Math.max(...workflows.map(item => item.usageCount), 1);

  return (
    <section className={styles.section}>
      <SectionTitle icon="workflow" title="Workflow Analytics" sub="Your most effective creation workflows" />
      <div className={styles.workflowList}>
        {workflows.slice(0, compact ? 3 : workflows.length).map((workflow, index) => (
          <article className={styles.workflowCard} key={workflow.workflowId}>
            <span className={styles.rank}>0{index + 1}</span>
            <div className={styles.workflowBody}>
              <div className={styles.workflowTop}>
                <div>
                  <h3>{workflow.workflowName}</h3>
                  <p>{workflow.category} · {workflow.usageCount} uses</p>
                </div>
                <span className={styles.scorePill}>{workflow.avgQualityScore}</span>
              </div>
              <div className={styles.workflowTrack}>
                <span style={{ width: `${(workflow.usageCount / maxUsage) * 100}%` }} />
              </div>
              <div className={styles.workflowStats}>
                <span>Quality <b>{workflow.avgQualityScore}</b></span>
                <span>Improvement <b>+{workflow.avgImprovementDelta}</b></span>
                <span>AI accepted <b>{workflow.totalAIAccepted}</b></span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PlatformAnalytics({ compact = false }) {
  const { state, monthlyTrend } = useAnalytics();
  const platforms = state.platformMetrics.filter(platform => platform.exportCount > 0);
  const maxExports = Math.max(...platforms.map(item => item.exportCount), 1);

  return (
    <section className={styles.section}>
      <SectionTitle
        icon="platform"
        title="Platform Analytics"
        sub="Export performance by destination"
        action={<TrendBadge trend={monthlyTrend} value="Monthly" />}
      />
      <div className={styles.platformGrid}>
        {platforms.slice(0, compact ? 3 : platforms.length).map(platform => (
          <article className={styles.platformCard} key={platform.platform}>
            <div className={styles.platformTop}>
              <div>
                <h3>{platform.platform}</h3>
                <p>{platform.exportCount} exports</p>
              </div>
              <TrendBadge trend="up" value={`+${platform.avgImprovementDelta}`} />
            </div>
            <div className={styles.platformQuality}>
              <span>Average quality</span>
              <strong>{platform.avgQualityScore}</strong>
            </div>
            <div className={styles.platformTrack}>
              <span style={{ width: `${(platform.exportCount / maxExports) * 100}%` }} />
            </div>
            <div className={styles.platformMeta}>
              <span>{platform.favoriteFormat}</span>
              <span>{platform.favoriteResolution}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EditingMetrics() {
  const { state } = useAnalytics();
  const metrics = [...state.editingMetrics].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
  const maxUsage = Math.max(...metrics.map(item => item.usageCount), 1);

  return (
    <section className={styles.section}>
      <SectionTitle icon="edit" title="Editing Metrics" sub="AI-assisted edits that drive quality" />
      <div className={styles.editList}>
        {metrics.map(metric => (
          <article className={styles.editRow} key={metric.editType}>
            <div className={styles.editHeader}>
              <div>
                <h3>{metric.editType}</h3>
                <p>{metric.category} · {metric.usageCount} uses</p>
              </div>
              <span className={styles.acceptance}>{metric.acceptanceRate}% accepted</span>
            </div>
            <div className={styles.editTrack}>
              <span style={{ width: `${(metric.usageCount / maxUsage) * 100}%` }} />
            </div>
            <div className={styles.editFooter}>
              <span>Average gain <b>+{metric.avgQualityGain}</b></span>
              <span>Acceptance <b>{metric.acceptanceRate}%</b></span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentSessions() {
  const { recentSessions } = useAnalytics();

  return (
    <section className={styles.section}>
      <SectionTitle icon="sessions" title="Recent Sessions" sub="Latest completed creator work" />
      <div className={styles.sessionList}>
        {recentSessions.slice(0, 5).map(session => (
          <article className={styles.sessionCard} key={session.id}>
            <div className={styles.sessionMain}>
              <div>
                <h3>{session.projectTitle || session.title}</h3>
                <p>{session.type} · {session.exportPlatform} · {session.durationMinutes} min</p>
              </div>
              <span className={styles.sessionQuality}>{session.qualityScoreAfter ?? '—'}</span>
            </div>
            <div className={styles.sessionFooter}>
              <span className={styles.improvement}>+{session.improvementDelta} quality</span>
              {session.aiAccepted > 0 && (
                <span className={styles.aiAccepted}><Icon name="accepted" size={12} /> AI accepted</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AnalyticsDashboard() {
  const {
    state,
    creatorScore,
    growthScore,
    avgQualityScore,
    avgImprovementDelta,
    totalAIAccepted,
    overallAcceptanceRate,
    bestPerformingPlatform,
    recentSessions,
    activeInsights,
    dismissInsight,
  } = useAnalytics();

  const statistics = state.statistics ?? {};
  const timeSavedHours = Math.round((statistics.totalTimeSavedMinutes ?? 0) / 60);
  const weeklyTrend = statistics.weeklyTrend ?? 'flat';
  const weeklyTrendPct = statistics.weeklyTrendPct ?? 0;

  const metrics = [
    { icon: 'sessions', label: 'Total Sessions', value: statistics.totalSessions ?? 0, progress: Math.min((statistics.totalSessions ?? 0) * 2, 100), tone: 'indigo' },
    { icon: 'accepted', label: 'AI Accepted', value: totalAIAccepted, progress: overallAcceptanceRate, tone: 'green' },
    { icon: 'quality', label: 'Average Quality', value: avgQualityScore, suffix: '/100', progress: avgQualityScore, tone: 'violet' },
    { icon: 'spark', label: 'Average Improvement', value: `+${avgImprovementDelta}`, progress: avgImprovementDelta * 3, tone: 'sky' },
    { icon: 'accepted', label: 'Acceptance Rate', value: overallAcceptanceRate, suffix: '%', progress: overallAcceptanceRate, tone: 'green' },
    { icon: 'time', label: 'Time Saved', value: timeSavedHours, suffix: 'h', progress: Math.min(timeSavedHours * 3, 100), tone: 'amber' },
    { icon: 'growth', label: 'Growth Score', value: `+${growthScore}`, progress: Math.min(growthScore * 2.5, 100), tone: 'violet' },
    { icon: 'platform', label: 'Best Platform', value: bestPerformingPlatform?.platform ?? '—', progress: bestPerformingPlatform?.avgQualityScore ?? 0, tone: 'sky' },
  ];

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.ibmBadge}><span /> Google Gemini AI</div>
          <p className={styles.eyebrow}>CREATOR INTELLIGENCE</p>
          <h1>Creator Score</h1>
          <p className={styles.heroSub}>Your creative performance is building momentum.</p>
          <TrendBadge trend={weeklyTrend} value={`${weeklyTrendPct}% this week`} />
        </div>
        <ScoreRing score={creatorScore} />
      </section>

      <section className={styles.metricsGrid} aria-label="Creator performance metrics">
        {metrics.map(metric => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className={styles.section}>
        <SectionTitle icon="quality" title="Quality Overview" sub="Quality history and performance trends" />
        <div className={styles.chartCard}>
          <PerformanceChart type="quality" title="Quality history" height={176} />
        </div>
        <div className={styles.trendCharts}>
          <div className={styles.chartCard}><PerformanceChart type="weekly" title="Weekly trend" height={150} /></div>
          <div className={styles.chartCard}><PerformanceChart type="monthly" title="Monthly trend" height={150} /></div>
        </div>
      </section>

      <WorkflowAnalytics compact />
      <PlatformAnalytics compact />
      <EditingMetrics />
      <RecentSessions />

      <section className={styles.section}>
        <SectionTitle icon="insight" title="Top AI Insights" sub="Personalized recommendations from your creative data" />
        <div className={styles.insights}>
          {activeInsights.slice(0, 3).map(insight => (
            <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
          ))}
        </div>
      </section>

      {recentSessions.length === 0 && <p className={styles.emptyText}>No completed sessions available.</p>}
    </div>
  );
}
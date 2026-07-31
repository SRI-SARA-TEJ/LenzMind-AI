/**
 * pages/AnalyticsPage.jsx — Creator Analytics Intelligence Dashboard
 *
 * Displays AI recommendation performance metrics:
 *   - Summary stat cards (total, accepted, dismissed, pending)
 *   - Acceptance / dismissal rate rings
 *   - Per-agent horizontal bar breakdown
 *   - Confidence statistics
 *   - 7-day activity trend (pure SVG — no external chart library)
 *   - Top accepted tags
 *   - AI insight: most responsive agent
 *
 * Data source: GET /api/v1/analytics/dashboard  (single round-trip)
 * All charts are pure SVG so no chart library install is needed.
 */

import React, { useEffect, useState } from 'react';
import { getAnalyticsDashboard }      from '../services/api';
import StatCard                        from '../components/ui/StatCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import AIDisclaimer                    from '../components/ui/AIDisclaimer';
import styles                          from './AnalyticsPage.module.css';

// ── Agent display metadata ────────────────────────────────────────────────────
const AGENT_META = {
  'camera-intelligence':  { label: 'Camera Intelligence',  color: 'var(--agent-camera)'    },
  'editing-intelligence': { label: 'Editing Intelligence', color: 'var(--agent-editing)'   },
  'content-optimization': { label: 'Content Optimization', color: 'var(--agent-optimize)'  },
  'creator-memory':       { label: 'Creator Memory',       color: 'var(--color-accent)'    },
  'analytics':            { label: 'Analytics',            color: 'var(--agent-analytics)' },
};

function agentLabel(type) {
  return AGENT_META[type]?.label || type;
}
function agentColor(type) {
  return AGENT_META[type]?.color || 'var(--color-text-muted)';
}

// ── Donut ring chart (pure SVG) ────────────────────────────────────────────────
function DonutRing({ percentage, color, label, sublabel }) {
  const r         = 36;
  const circ      = 2 * Math.PI * r;
  const dash      = (percentage / 100) * circ;
  const gap       = circ - dash;

  return (
    <div className={styles.ringWrap}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        {/* Track */}
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        {/* Fill — rotated so start is at top (−90 deg) */}
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
        {/* Centre text */}
        <text x="48" y="44" textAnchor="middle" dominantBaseline="middle"
          fontSize="14" fontWeight="700" fill="var(--color-text)">
          {percentage}%
        </text>
        <text x="48" y="60" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="var(--color-text-muted)">
          {sublabel}
        </text>
      </svg>
      <div className={styles.ringLabel}>{label}</div>
    </div>
  );
}

// ── Agent horizontal bar row ──────────────────────────────────────────────────
function AgentBar({ agentType, accepted, dismissed, pending, total, acceptanceRate }) {
  const color       = agentColor(agentType);
  const label       = agentLabel(agentType);
  const acceptedPct = total > 0 ? (accepted  / total) * 100 : 0;
  const dismissPct  = total > 0 ? (dismissed / total) * 100 : 0;
  const pendingPct  = total > 0 ? (pending   / total) * 100 : 0;

  return (
    <div className={styles.agentRow}>
      <div className={styles.agentRowHeader}>
        <span className={styles.agentDot} style={{ background: color }} />
        <span className={styles.agentRowLabel}>{label}</span>
        <span className={styles.agentRowRate} style={{ color }}>{acceptanceRate}%</span>
        <span className={styles.agentRowTotal}>{total} recs</span>
      </div>
      <div className={styles.barTrack}>
        <div className={styles.barSegmentAccepted}  style={{ width: `${acceptedPct}%` }} title={`Accepted: ${accepted}`} />
        <div className={styles.barSegmentDismissed} style={{ width: `${dismissPct}%`  }} title={`Dismissed: ${dismissed}`} />
        <div className={styles.barSegmentPending}   style={{ width: `${pendingPct}%`  }} title={`Pending: ${pending}`} />
      </div>
    </div>
  );
}

// ── 7-day trend chart (pure SVG) ──────────────────────────────────────────────
function TrendChart({ data }) {
  if (!data || data.length === 0) return null;

  const W   = 560;
  const H   = 120;
  const PAD = { top: 12, right: 16, bottom: 28, left: 28 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.accepted + d.dismissed), 1);
  const step   = chartW / (data.length - 1 || 1);

  function xOf(i)        { return PAD.left + i * step; }
  function yOf(v)        { return PAD.top  + chartH - (v / maxVal) * chartH; }
  function pathOf(key)   {
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(d[key]).toFixed(1)}`)
      .join(' ');
  }

  // Short weekday label (Mon, Tue…)
  function dayLabel(dateStr) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.trendSvg}
      aria-label="7-day recommendation activity"
    >
      {/* Gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = PAD.top + chartH * (1 - frac);
        return (
          <line key={frac} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
            stroke="var(--color-border)" strokeWidth="0.5" />
        );
      })}

      {/* Dismissed line */}
      <path d={pathOf('dismissed')} fill="none"
        stroke="var(--color-error)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />

      {/* Accepted line */}
      <path d={pathOf('accepted')} fill="none"
        stroke="var(--color-success)" strokeWidth="2" />

      {/* Accepted dots */}
      {data.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.accepted)}
          r="3" fill="var(--color-success)" />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - 4}
          textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
          {dayLabel(d.date)}
        </text>
      ))}
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getAnalyticsDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.center}>
        <LoadingSpinner size={32} />
        <p className={styles.loadingText}>Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>Failed to load analytics: {error}</p>
      </div>
    );
  }

  const { summary, agents, confidence, insights } = data;
  const hasData   = summary.total > 0;
  const hasAgents = agents && agents.length > 0;

  return (
    <div className={styles.page}>

      {/* ── AI mode notice ──────────────────────────────────────── */}
      <AIDisclaimer variant="info" />

      {/* ── Summary stat cards ───────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.statsGrid}>
          <StatCard
            label="Total Recommendations"
            value={summary.total}
            accentColor="var(--color-accent)"
          />
          <StatCard
            label="Accepted"
            value={summary.accepted}
            accentColor="var(--color-success)"
          />
          <StatCard
            label="Dismissed"
            value={summary.dismissed}
            accentColor="var(--color-error)"
          />
          <StatCard
            label="Pending Review"
            value={summary.pending}
            accentColor="var(--color-warning)"
          />
        </div>
      </section>

      {/* ── Acceptance / dismissal rings ─────────────────────────── */}
      {hasData && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Decision Rates</h2>
          <div className={styles.ringsRow}>
            <DonutRing
              percentage={summary.acceptanceRate}
              color="var(--color-success)"
              label="Acceptance Rate"
              sublabel="accepted"
            />
            <DonutRing
              percentage={summary.dismissalRate}
              color="var(--color-error)"
              label="Dismissal Rate"
              sublabel="dismissed"
            />
            {confidence.count > 0 && (
              <DonutRing
                percentage={Math.round((confidence.avg || 0) * 100)}
                color="var(--color-accent)"
                label="Avg Confidence"
                sublabel="of model"
              />
            )}
          </div>
        </section>
      )}

      {/* ── Per-agent breakdown ──────────────────────────────────── */}
      {hasAgents && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Agent Performance</h2>
          <p className={styles.sectionSub}>
            Stacked bars show accepted (green) / dismissed (red) / pending (grey) proportions.
          </p>
          <div className={styles.agentList}>
            {agents.map((ag) => (
              <AgentBar key={ag.agentType} {...ag} />
            ))}
          </div>

          {/* Legend */}
          <div className={styles.barLegend}>
            <span className={styles.legendDot} style={{ background: 'var(--color-success)' }} />
            <span>Accepted</span>
            <span className={styles.legendDot} style={{ background: 'var(--color-error)' }} />
            <span>Dismissed</span>
            <span className={styles.legendDot} style={{ background: 'var(--color-border)' }} />
            <span>Pending</span>
          </div>
        </section>
      )}

      {/* ── 7-day trend chart ────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7-Day Activity</h2>
        <p className={styles.sectionSub}>
          <span className={styles.trendLegendLine} style={{ background: 'var(--color-success)' }} /> Accepted &nbsp;
          <span className={styles.trendLegendDash} style={{ background: 'var(--color-error)' }}   /> Dismissed
        </p>
        <div className={styles.trendWrap}>
          {insights.weeklyTrend && insights.weeklyTrend.length > 0
            ? <TrendChart data={insights.weeklyTrend} />
            : <p className={styles.emptyText}>No activity in the last 7 days.</p>
          }
        </div>
      </section>

      {/* ── Confidence stats ─────────────────────────────────────── */}
      {confidence.count > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Confidence Scores</h2>
          <p className={styles.sectionSub}>
            Computed from {confidence.count} recommendation{confidence.count !== 1 ? 's' : ''} with a model confidence score.
          </p>
          <div className={styles.confidenceRow}>
            <div className={styles.confidenceStat}>
              <span className={styles.confLabel}>Average</span>
              <span className={styles.confValue} style={{ color: 'var(--color-accent)' }}>
                {Math.round((confidence.avg || 0) * 100)}%
              </span>
            </div>
            <div className={styles.confidenceStat}>
              <span className={styles.confLabel}>Highest</span>
              <span className={styles.confValue} style={{ color: 'var(--color-success)' }}>
                {Math.round((confidence.highest || 0) * 100)}%
              </span>
            </div>
            <div className={styles.confidenceStat}>
              <span className={styles.confLabel}>Lowest</span>
              <span className={styles.confValue} style={{ color: 'var(--color-text-muted)' }}>
                {Math.round((confidence.lowest || 0) * 100)}%
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Creator insights ─────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Creator Insights</h2>

        {!hasData ? (
          <p className={styles.emptyText}>
            No recommendations yet. Run AI analysis on a project to start building insights.
          </p>
        ) : (
          <div className={styles.insightsGrid}>

            {/* Most accepted agent */}
            {insights.mostAcceptedAgent && (
              <div className={styles.insightCard}>
                <span className={styles.insightIcon}>🏆</span>
                <div>
                  <div className={styles.insightTitle}>Most Accepted Agent</div>
                  <div
                    className={styles.insightValue}
                    style={{ color: agentColor(insights.mostAcceptedAgent) }}
                  >
                    {agentLabel(insights.mostAcceptedAgent)}
                  </div>
                </div>
              </div>
            )}

            {/* Top accepted tags */}
            {insights.topTags && insights.topTags.length > 0 && (
              <div className={styles.insightCard}>
                <span className={styles.insightIcon}>🏷</span>
                <div>
                  <div className={styles.insightTitle}>Top Accepted Tags</div>
                  <div className={styles.tagCloud}>
                    {insights.topTags.map(({ tag, count }) => (
                      <span key={tag} className={styles.tagPill}>
                        {tag} <span className={styles.tagCount}>{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </section>

    </div>
  );
}

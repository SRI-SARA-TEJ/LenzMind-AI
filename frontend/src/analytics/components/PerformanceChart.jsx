/**
 * analytics/components/PerformanceChart.jsx
 *
 * Pure SVG charts — no external charting libraries.
 * Responsive via viewBox. Animated path drawing on mount.
 *
 * Supported `type` values:
 *   'quality'    — line chart: quality score over time (qualityHistory)
 *   'weekly'     — bar chart: sessions + avg quality per week
 *   'monthly'    — bar chart: sessions + avg quality per month
 *   'acceptance' — line chart: AI acceptance rate over time
 *   'growth'     — area + line: creator score over 6 months
 *   'editing'    — horizontal bar: edit type usage count + quality gain
 *   'platform'   — grouped bar: platform export count + avg quality
 *
 * Props:
 *   type    string  — chart type (default 'quality')
 *   title   string  — optional heading (shown above chart)
 *   height  number  — SVG height in px (default 160)
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import styles from './PerformanceChart.module.css';

// ── Colour palette ─────────────────────────────────────────────────────────────
const C = {
  indigo:   '#6366f1',
  violet:   '#8b5cf6',
  green:    '#4ade80',
  amber:    '#fbbf24',
  rose:     '#f87171',
  sky:      '#38bdf8',
  muted:    'rgba(255,255,255,0.12)',
  mutedTxt: 'rgba(255,255,255,0.25)',
  gridLine: 'rgba(255,255,255,0.06)',
  axisLine: 'rgba(255,255,255,0.1)',
};

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Map a value from [inMin,inMax] to [outMin,outMax] */
function mapRange(v, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return (outMin + outMax) / 2;
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Build an SVG polyline points string from [{x,y}] */
function pointsStr(pts) {
  return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

/** Build a smooth cubic-bezier SVG path from [{x,y}] */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx  = ((prev.x + curr.x) / 2).toFixed(1);
    d += ` C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

/** Short month label from ISO date string */
function shortMonth(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('en', { month: 'short' });
}

/** Short date label MM/DD */
function shortDate(isoStr) {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── AnimatedPath — draws stroke on mount ──────────────────────────────────────
function AnimatedPath({ d, stroke, strokeWidth = 2, fill = 'none', duration = 900 }) {
  const ref  = useRef(null);
  const [len, setLen] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const l = ref.current.getTotalLength?.() ?? 0;
      setLen(l);
    }
  }, [d]);

  return (
    <path
      ref={ref}
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={len || 2000}
      strokeDashoffset={len || 2000}
      style={{
        transition: len > 0 ? `stroke-dashoffset ${duration}ms cubic-bezier(.4,0,.2,1)` : 'none',
        strokeDashoffset: 0,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART: Quality line
// ─────────────────────────────────────────────────────────────────────────────
function QualityLineChart({ data, W, H, pad }) {
  const inner = { w: W - pad.l - pad.r, h: H - pad.t - pad.b };
  const scores = data.map(d => d.score);
  const minS = Math.max(0, Math.min(...scores) - 5);
  const maxS = Math.min(100, Math.max(...scores) + 5);

  const pts = data.map((d, i) => ({
    x: pad.l + mapRange(i, 0, data.length - 1, 0, inner.w),
    y: pad.t + mapRange(d.score, minS, maxS, inner.h, 0),
  }));

  const areaD = pts.length > 1
    ? smoothPath(pts) + ` L ${pts[pts.length - 1].x.toFixed(1)} ${(pad.t + inner.h).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.t + inner.h).toFixed(1)} Z`
    : '';

  // Grid lines
  const gridVals = [60, 70, 80, 90, 100].filter(v => v >= minS && v <= maxS);

  // X-axis labels: show every ~5th point
  const step = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <g>
      {/* Grid */}
      {gridVals.map(v => {
        const gy = pad.t + mapRange(v, minS, maxS, inner.h, 0);
        return (
          <g key={v}>
            <line x1={pad.l} y1={gy} x2={pad.l + inner.w} y2={gy} stroke={C.gridLine} strokeWidth={1} />
            <text x={pad.l - 4} y={gy + 3} fontSize={8} fill={C.mutedTxt} textAnchor="end">{v}</text>
          </g>
        );
      })}

      {/* Area fill */}
      {areaD && (
        <path d={areaD} fill="url(#qualityGrad)" opacity={0.25} />
      )}

      {/* Line */}
      {pts.length > 1 && (
        <AnimatedPath d={smoothPath(pts)} stroke={C.indigo} strokeWidth={2} />
      )}

      {/* Dots on last point */}
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4} fill={C.indigo} stroke="#0f1117" strokeWidth={2} />
      )}

      {/* X labels */}
      {xLabels.map((d, i) => {
        const idx  = data.indexOf(d);
        const px   = pad.l + mapRange(idx, 0, data.length - 1, 0, inner.w);
        return (
          <text key={i} x={px} y={H - 2} fontSize={7.5} fill={C.mutedTxt} textAnchor="middle">
            {shortDate(d.date)}
          </text>
        );
      })}

      {/* Gradient def */}
      <defs>
        <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.indigo} stopOpacity={0.6} />
          <stop offset="100%" stopColor={C.indigo} stopOpacity={0}   />
        </linearGradient>
      </defs>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART: Weekly / Monthly bar
// ─────────────────────────────────────────────────────────────────────────────
function BarChart({ data, W, H, pad, barColor = C.indigo, lineColor = C.green }) {
  const inner = { w: W - pad.l - pad.r, h: H - pad.t - pad.b };

  const counts   = data.map(d => d.sessionsCount);
  const maxCount = Math.max(...counts, 1);
  const scores   = data.map(d => d.avgQualityScore).filter(s => s > 0);
  const minScore = scores.length ? Math.max(0, Math.min(...scores) - 5) : 0;
  const maxScore = scores.length ? Math.min(100, Math.max(...scores) + 5) : 100;

  const barW   = clamp((inner.w / data.length) * 0.55, 4, 22);
  const groupW = inner.w / data.length;

  const linePts = data
    .map((d, i) => d.avgQualityScore > 0 ? {
      x: pad.l + i * groupW + groupW / 2,
      y: pad.t + mapRange(d.avgQualityScore, minScore, maxScore, inner.h, 0),
    } : null)
    .filter(Boolean);

  return (
    <g>
      {/* Y grid */}
      {[0, 25, 50, 75, 100].filter(v => v <= maxCount).map(v => {
        const gy = pad.t + mapRange(v, 0, maxCount, inner.h, 0);
        return (
          <line key={v} x1={pad.l} y1={gy} x2={pad.l + inner.w} y2={gy} stroke={C.gridLine} strokeWidth={1} />
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bx = pad.l + i * groupW + groupW / 2 - barW / 2;
        const bh = mapRange(d.sessionsCount, 0, maxCount, 0, inner.h);
        const by = pad.t + inner.h - bh;
        return (
          <rect
            key={i}
            x={bx} y={by} width={barW} height={Math.max(bh, 1)}
            rx={3}
            fill={barColor}
            opacity={0.75}
          />
        );
      })}

      {/* Quality overlay line */}
      {linePts.length > 1 && (
        <AnimatedPath d={smoothPath(linePts)} stroke={lineColor} strokeWidth={1.5} duration={1100} />
      )}
      {linePts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={lineColor} opacity={0.9} />
      ))}

      {/* X labels */}
      {data.map((d, i) => {
        const px = pad.l + i * groupW + groupW / 2;
        const label = d.periodLabel?.slice(-5) ?? '';   // last 5 chars of week/month key
        return (
          <text key={i} x={px} y={H - 2} fontSize={7} fill={C.mutedTxt} textAnchor="middle">
            {label}
          </text>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${pad.l}, ${pad.t - 10})`}>
        <rect x={0} y={0} width={8} height={8} rx={2} fill={barColor} opacity={0.75} />
        <text x={11} y={7} fontSize={8} fill={C.mutedTxt}>Sessions</text>
        <circle cx={60} cy={4} r={3} fill={lineColor} />
        <text x={65} y={7} fontSize={8} fill={C.mutedTxt}>Avg Quality</text>
      </g>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART: AI Acceptance line
// ─────────────────────────────────────────────────────────────────────────────
function AcceptanceLineChart({ data, W, H, pad }) {
  const inner = { w: W - pad.l - pad.r, h: H - pad.t - pad.b };
  // Use last 20 points for clarity
  const slice = data.slice(-20);
  const rates = slice.map(d => d.acceptanceRate);
  const minR  = Math.max(0,  Math.min(...rates) - 5);
  const maxR  = Math.min(100, Math.max(...rates) + 5);

  const pts = slice.map((d, i) => ({
    x: pad.l + mapRange(i, 0, slice.length - 1, 0, inner.w),
    y: pad.t + mapRange(d.acceptanceRate, minR, maxR, inner.h, 0),
  }));

  const gridVals = [50, 60, 70, 80, 90, 100].filter(v => v >= minR && v <= maxR);

  return (
    <g>
      {gridVals.map(v => {
        const gy = pad.t + mapRange(v, minR, maxR, inner.h, 0);
        return (
          <g key={v}>
            <line x1={pad.l} y1={gy} x2={pad.l + inner.w} y2={gy} stroke={C.gridLine} strokeWidth={1} />
            <text x={pad.l - 4} y={gy + 3} fontSize={8} fill={C.mutedTxt} textAnchor="end">{v}%</text>
          </g>
        );
      })}

      {/* Area */}
      {pts.length > 1 && (
        <path
          d={smoothPath(pts) + ` L ${pts[pts.length - 1].x.toFixed(1)} ${(pad.t + inner.h).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.t + inner.h).toFixed(1)} Z`}
          fill="url(#accGrad)"
          opacity={0.2}
        />
      )}

      {pts.length > 1 && (
        <AnimatedPath d={smoothPath(pts)} stroke={C.green} strokeWidth={2} />
      )}
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4} fill={C.green} stroke="#0f1117" strokeWidth={2} />
      )}

      {/* X: every 4th */}
      {slice.filter((_, i) => i % 4 === 0).map((d, i) => {
        const origIdx = slice.findIndex(x => x === d);
        const px = pad.l + mapRange(origIdx, 0, slice.length - 1, 0, inner.w);
        return (
          <text key={i} x={px} y={H - 2} fontSize={7.5} fill={C.mutedTxt} textAnchor="middle">
            {shortDate(d.date)}
          </text>
        );
      })}

      <defs>
        <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.green} stopOpacity={0.7} />
          <stop offset="100%" stopColor={C.green} stopOpacity={0}   />
        </linearGradient>
      </defs>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART: Growth area (creator score over 6 months)
// ─────────────────────────────────────────────────────────────────────────────
function GrowthAreaChart({ data, W, H, pad }) {
  const inner = { w: W - pad.l - pad.r, h: H - pad.t - pad.b };
  const minS = 0;
  const maxS = 100;

  const fieldSets = [
    { key: 'creatorScore',        color: C.indigo, label: 'Creator' },
    { key: 'qualityScore',        color: C.green,  label: 'Quality' },
    { key: 'aiCollaborationScore',color: C.violet, label: 'AI Collab' },
  ];

  return (
    <g>
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(v => {
        const gy = pad.t + mapRange(v, minS, maxS, inner.h, 0);
        return (
          <g key={v}>
            <line x1={pad.l} y1={gy} x2={pad.l + inner.w} y2={gy} stroke={C.gridLine} strokeWidth={1} />
            <text x={pad.l - 4} y={gy + 3} fontSize={8} fill={C.mutedTxt} textAnchor="end">{v}</text>
          </g>
        );
      })}

      {/* Lines */}
      {fieldSets.map(({ key, color }) => {
        const pts = data.map((d, i) => ({
          x: pad.l + mapRange(i, 0, data.length - 1, 0, inner.w),
          y: pad.t + mapRange(d[key] ?? 0, minS, maxS, inner.h, 0),
        }));
        return (
          <g key={key}>
            <AnimatedPath d={smoothPath(pts)} stroke={color} strokeWidth={2} duration={1000} />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={3.5} fill={color} stroke="#0f1117" strokeWidth={1.5} />
          </g>
        );
      })}

      {/* X labels */}
      {data.map((d, i) => {
        const px = pad.l + mapRange(i, 0, data.length - 1, 0, inner.w);
        return (
          <text key={i} x={px} y={H - 2} fontSize={7.5} fill={C.mutedTxt} textAnchor="middle">
            {shortMonth(d.date)}
          </text>
        );
      })}

      {/* Legend */}
      {fieldSets.map(({ color, label }, i) => (
        <g key={label} transform={`translate(${pad.l + i * 62}, ${pad.t - 10})`}>
          <line x1={0} y1={4} x2={10} y2={4} stroke={color} strokeWidth={2} />
          <text x={13} y={7} fontSize={8} fill={C.mutedTxt}>{label}</text>
        </g>
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART: Editing horizontal bar
// ─────────────────────────────────────────────────────────────────────────────
function EditingHBarChart({ data, W, H, pad }) {
  // Show top 8 by usageCount
  const sorted = [...data].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8);
  const maxCount = Math.max(...sorted.map(d => d.usageCount), 1);
  const rowH = (H - pad.t - pad.b) / sorted.length;
  const barH = clamp(rowH * 0.45, 5, 14);

  return (
    <g>
      {sorted.map((d, i) => {
        const barW = mapRange(d.usageCount, 0, maxCount, 0, W - pad.l - pad.r - 40);
        const y    = pad.t + i * rowH + rowH / 2;
        const qPct = d.avgQualityGain / 25; // 25 = approx max gain
        const barColor = qPct > 0.7 ? C.indigo : qPct > 0.4 ? C.violet : C.sky;

        return (
          <g key={d.editType}>
            <text x={pad.l - 4} y={y + 4} fontSize={8} fill={C.mutedTxt} textAnchor="end">
              {d.editType.length > 12 ? d.editType.slice(0, 11) + '…' : d.editType}
            </text>
            {/* Background track */}
            <rect x={pad.l} y={y - barH / 2} width={W - pad.l - pad.r - 40} height={barH} rx={3} fill={C.muted} />
            {/* Filled bar */}
            <rect x={pad.l} y={y - barH / 2} width={barW} height={barH} rx={3} fill={barColor} opacity={0.8} />
            {/* Count label */}
            <text x={pad.l + barW + 4} y={y + 3.5} fontSize={8} fill={C.mutedTxt}>{d.usageCount}</text>
          </g>
        );
      })}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART: Platform grouped bar
// ─────────────────────────────────────────────────────────────────────────────
function PlatformBarChart({ data, W, H, pad }) {
  const active = data.filter(p => p.exportCount > 0);
  const inner  = { w: W - pad.l - pad.r, h: H - pad.t - pad.b };
  const maxExp = Math.max(...active.map(d => d.exportCount), 1);
  const groupW = inner.w / active.length;
  const barW   = clamp(groupW * 0.5, 5, 20);

  const platformColors = [C.indigo, C.violet, C.sky, C.green, C.amber, C.rose];

  return (
    <g>
      {/* Grid */}
      {[0, 5, 10, 15, 20, 25].filter(v => v <= maxExp + 2).map(v => {
        const gy = pad.t + mapRange(v, 0, maxExp, inner.h, 0);
        return (
          <g key={v}>
            <line x1={pad.l} y1={gy} x2={pad.l + inner.w} y2={gy} stroke={C.gridLine} strokeWidth={1} />
            <text x={pad.l - 4} y={gy + 3} fontSize={8} fill={C.mutedTxt} textAnchor="end">{v}</text>
          </g>
        );
      })}

      {active.map((d, i) => {
        const bx = pad.l + i * groupW + (groupW - barW) / 2;
        const bh = mapRange(d.exportCount, 0, maxExp, 0, inner.h);
        const by = pad.t + inner.h - bh;
        const color = platformColors[i % platformColors.length];
        return (
          <g key={d.platform}>
            <rect x={bx} y={by} width={barW} height={Math.max(bh, 2)} rx={3} fill={color} opacity={0.8} />
            <text
              x={bx + barW / 2}
              y={H - 2}
              fontSize={7}
              fill={C.mutedTxt}
              textAnchor="middle"
            >
              {d.platform.split(' ')[0]}
            </text>
            <text x={bx + barW / 2} y={by - 3} fontSize={8} fill={color} textAnchor="middle">{d.exportCount}</text>
          </g>
        );
      })}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function PerformanceChart({ type = 'quality', title, height = 160 }) {
  const { state } = useAnalytics();

  const W   = 340; // viewBox width — scales to 100% container width
  const H   = height;
  const pad = type === 'editing'
    ? { t: 18, r: 14, b: 14, l: 84 }
    : { t: 18, r: 14, b: 16, l: 26 };

  const chartContent = useMemo(() => {
    switch (type) {
      case 'quality':
        if (!state.qualityHistory.length) return null;
        return <QualityLineChart data={state.qualityHistory} W={W} H={H} pad={pad} />;

      case 'weekly': {
        const d = state.weeklyPerformance.slice(-12);
        if (!d.length) return null;
        return <BarChart data={d} W={W} H={H} pad={pad} barColor={C.indigo} lineColor={C.green} />;
      }

      case 'monthly': {
        const d = state.monthlyPerformance;
        if (!d.length) return null;
        return <BarChart data={d} W={W} H={H} pad={pad} barColor={C.violet} lineColor={C.amber} />;
      }

      case 'acceptance':
        if (!state.recommendationHistory.length) return null;
        return <AcceptanceLineChart data={state.recommendationHistory} W={W} H={H} pad={pad} />;

      case 'growth':
        if (!state.growthHistory.length) return null;
        return <GrowthAreaChart data={state.growthHistory} W={W} H={H} pad={pad} />;

      case 'editing':
        if (!state.editingMetrics.length) return null;
        return <EditingHBarChart data={state.editingMetrics} W={W} H={H} pad={pad} />;

      case 'platform':
        if (!state.platformMetrics.length) return null;
        return <PlatformBarChart data={state.platformMetrics} W={W} H={H} pad={pad} />;

      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, state.qualityHistory, state.weeklyPerformance, state.monthlyPerformance,
      state.recommendationHistory, state.growthHistory, state.editingMetrics, state.platformMetrics]);

  if (!chartContent) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📊</span>
        <span className={styles.emptyLabel}>No data yet</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {title && <p className={styles.chartTitle}>{title}</p>}
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={title ?? type}
      >
        {chartContent}
      </svg>
    </div>
  );
}

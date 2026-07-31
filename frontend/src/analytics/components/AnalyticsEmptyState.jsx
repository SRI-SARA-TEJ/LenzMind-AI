/**
 * analytics/components/AnalyticsEmptyState.jsx
 *
 * Professional empty state — shown when creator has no analytics sessions yet.
 * Animated SVG bar-chart illustration, feature list, and CTA.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AnalyticsEmptyState.module.css';

// ── Animated SVG bar-chart illustration ───────────────────────────────────────
function BarChartIllustration() {
  const bars = [
    { x: 18,  h: 28, color: 'rgba(99,102,241,0.35)', delay: '0s'    },
    { x: 36,  h: 48, color: 'rgba(99,102,241,0.5)',  delay: '0.1s'  },
    { x: 54,  h: 38, color: 'rgba(139,92,246,0.4)',  delay: '0.2s'  },
    { x: 72,  h: 58, color: 'rgba(99,102,241,0.55)', delay: '0.3s'  },
    { x: 90,  h: 45, color: 'rgba(139,92,246,0.5)',  delay: '0.4s'  },
    { x: 108, h: 68, color: 'rgba(99,102,241,0.65)', delay: '0.5s'  },
    { x: 126, h: 52, color: 'rgba(139,92,246,0.55)', delay: '0.6s'  },
  ];
  const baseY = 90;
  const bw    = 12;

  return (
    <svg className={styles.illustration} viewBox="0 0 160 110" fill="none" aria-hidden="true">
      {/* Grid lines */}
      {[30, 55, 80].map(y => (
        <line key={y} x1="10" y1={y} x2="150" y2={y}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Base line */}
      <line x1="10" y1={baseY} x2="150" y2={baseY}
        stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* Animated bars */}
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x} y={baseY - b.h} width={bw} height={b.h}
          rx="3" fill={b.color}
          className={styles.bar}
          style={{ animationDelay: b.delay }}
        />
      ))}

      {/* Trend line over bars */}
      <polyline
        points="24,62 42,42 60,52 78,32 96,45 114,22 132,38"
        stroke="rgba(99,102,241,0.7)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className={styles.trendLine}
      />

      {/* Dots on trend line */}
      {[[24,62],[42,42],[60,52],[78,32],[96,45],[114,22],[132,38]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3"
          fill="#6366f1"
          className={styles.trendDot}
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}

      {/* IBM badge */}
      <rect x="48" y="6" width="64" height="14" rx="7"
        fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.3)" strokeWidth="0.8" />
      <circle cx="58" cy="13" r="2.5" fill="#6366f1" className={styles.ibmDotAnim} />
      <text x="64" y="17" fontSize="6" fill="rgba(165,180,252,0.85)"
        fontWeight="700" letterSpacing="0.5">watsonx.ai</text>
    </svg>
  );
}

const FEATURES = [
  { icon: '📊', label: 'Track quality improvement over time' },
  { icon: '📈', label: 'Visualise weekly and monthly trends' },
  { icon: '🤝', label: 'Measure AI collaboration rate' },
  { icon: '⚙️', label: 'Analyse workflow performance' },
  { icon: '🌐', label: 'Compare platform quality scores' },
];

export default function AnalyticsEmptyState() {
  const navigate = useNavigate();
  return (
    <div className={styles.root}>
      <BarChartIllustration />

      <div className={styles.ibmBadge}>
        <span className={styles.ibmDot} />
        <span>IBM watsonx.ai</span>
      </div>

      <h2 className={styles.title}>No Analytics Data Yet</h2>
      <p className={styles.sub}>
        Complete your first AI editing session and IBM watsonx.ai will start tracking your quality, performance, and growth analytics.
      </p>

      <div className={styles.featureList}>
        {FEATURES.map(f => (
          <div key={f.label} className={styles.featureItem}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <span className={styles.featureLabel}>{f.label}</span>
          </div>
        ))}
      </div>

      <button className={styles.ctaBtn} onClick={() => navigate('/editing')}>
        Start Creating →
      </button>

      <p className={styles.privacy}>
        🔒 All analytics are computed on-device. No cloud required.
      </p>
    </div>
  );
}

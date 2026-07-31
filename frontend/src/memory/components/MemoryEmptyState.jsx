/**
 * memory/components/MemoryEmptyState.jsx
 *
 * Professional empty state shown when the creator has no sessions.
 * Features an animated SVG brain illustration, explanation, and a CTA.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MemoryEmptyState.module.css';

// ── Animated SVG brain / memory illustration ──────────────────────────────────
function BrainIllustration() {
  return (
    <svg
      className={styles.illustration}
      viewBox="0 0 140 120"
      fill="none"
      aria-hidden="true"
    >
      {/* Outer glow ring */}
      <circle cx="70" cy="60" r="52" stroke="rgba(99,102,241,0.12)" strokeWidth="1.5" strokeDasharray="6 4" />
      <circle cx="70" cy="60" r="42" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />

      {/* Brain left hemisphere */}
      <path
        d="M70 30 C52 30 38 42 38 57 C38 68 46 76 56 78 C58 84 64 88 70 88"
        stroke="rgba(99,102,241,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        className={styles.brainPath}
      />
      {/* Brain right hemisphere */}
      <path
        d="M70 30 C88 30 102 42 102 57 C102 68 94 76 84 78 C82 84 76 88 70 88"
        stroke="rgba(139,92,246,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        className={styles.brainPath}
      />
      {/* Centre divider */}
      <line x1="70" y1="30" x2="70" y2="88" stroke="rgba(165,180,252,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Left hemisphere detail folds */}
      <path d="M48 50 C44 54 44 62 48 66" stroke="rgba(99,102,241,0.35)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M54 42 C50 46 50 50 54 54" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Right hemisphere detail folds */}
      <path d="M92 50 C96 54 96 62 92 66" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M86 42 C90 46 90 50 86 54" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Neural dots */}
      <circle cx="55" cy="57" r="3" fill="rgba(99,102,241,0.6)" className={styles.dot1} />
      <circle cx="70" cy="50" r="3" fill="rgba(165,180,252,0.7)" className={styles.dot2} />
      <circle cx="85" cy="57" r="3" fill="rgba(139,92,246,0.6)" className={styles.dot3} />
      <circle cx="62" cy="70" r="2.5" fill="rgba(99,102,241,0.4)" className={styles.dot1} />
      <circle cx="78" cy="70" r="2.5" fill="rgba(139,92,246,0.4)" className={styles.dot2} />

      {/* Connecting lines */}
      <line x1="55" y1="57" x2="70" y2="50" stroke="rgba(165,180,252,0.25)" strokeWidth="1" />
      <line x1="70" y1="50" x2="85" y2="57" stroke="rgba(165,180,252,0.25)" strokeWidth="1" />
      <line x1="55" y1="57" x2="62" y2="70" stroke="rgba(165,180,252,0.2)" strokeWidth="1" />
      <line x1="85" y1="57" x2="78" y2="70" stroke="rgba(165,180,252,0.2)" strokeWidth="1" />

      {/* IBM badge at top */}
      <rect x="50" y="14" width="40" height="12" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.28)" strokeWidth="0.8" />
      <circle cx="59" cy="20" r="2" fill="#6366f1" className={styles.ibmDotAnim} />
      <text x="64" y="23.5" fontSize="5.5" fill="rgba(165,180,252,0.8)" fontWeight="700" letterSpacing="0.5">watsonx.ai</text>
    </svg>
  );
}

// ── Feature preview items ─────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🎨', label: 'Learn your colour grade style' },
  { icon: '🎙', label: 'Detect your audio preferences' },
  { icon: '📊', label: 'Track quality improvements over time' },
  { icon: '💡', label: 'Generate personalised AI insights' },
  { icon: '🏆', label: 'Unlock creator milestones' },
];

export default function MemoryEmptyState() {
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <BrainIllustration />

      <div className={styles.ibmBadge}>
        <span className={styles.ibmDot} />
        <span>IBM watsonx.ai</span>
      </div>

      <h2 className={styles.title}>No Creator Memory Yet</h2>
      <p className={styles.sub}>
        Complete your first AI editing session and IBM watsonx.ai will start building a personalised creator profile — learning your style, preferences, and habits.
      </p>

      {/* Feature list */}
      <div className={styles.featureList}>
        {FEATURES.map(f => (
          <div key={f.label} className={styles.featureItem}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <span className={styles.featureLabel}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button className={styles.ctaBtn} onClick={() => navigate('/editing')}>
        Start First Session →
      </button>

      {/* Privacy note */}
      <p className={styles.privacy}>
        🔒 Your data stays on your device. No cloud sync required.
      </p>
    </div>
  );
}

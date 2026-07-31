/**
 * coach/components/CreatorCoachScreen.jsx
 *
 * Module 10.3 — Realis Creator Coach Engine
 *
 * Full-screen AI coaching view. Consumes CreatorCoachContext (written by
 * CoachBridge) and renders the latest coaching session. Zero business logic
 * lives here — all data flows from useCreatorCoach().
 *
 * ── Sections ──────────────────────────────────────────────────────────────────
 *   1. Fixed header      — IBM badge, title ("AI Coach"), refresh button
 *   2. Score hero        — animated arc, coach score, delta indicator
 *   3. Focus badge       — coloured focus area label
 *   4. Feedback summary  — 1–2 sentence overall assessment card
 *   5. Strengths         — up to 3 green-highlighted positive signals
 *   6. Improvements      — up to 3 areas with priority indicator
 *   7. Action Plan       — tappable action rows (complete = checked)
 *   8. Session Insight   — one key insight highlighted sentence
 *   9. Confidence meter  — how confident the AI is in this session
 *  10. BottomNavBar
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   Camera capture
 *     → CameraMemoryBridge   → CreatorMemoryContext
 *     → AnalyticsBridge      → AnalyticsContext
 *     → LearningBridge       → CreatorLearningContext
 *     → AssistantBridge      → CreatorAssistantContext
 *     → MissionBridge        → CreatorMissionContext
 *     → CoachBridge          → CreatorCoachContext  ← coachSession
 */

import React, { useCallback }  from 'react';
import { useNavigate }          from 'react-router-dom';
import styles                   from './CreatorCoachScreen.module.css';

import { useCreatorCoach }      from '../hooks/useCreatorCoach';
import { COACHING_FOCUS_META }  from '../models/coachModel';

import BottomNavBar from '../../camera/components/BottomNavBar';

// ── SVG arc constants ─────────────────────────────────────────────────────────
const ARC_R = 44;
const ARC_C = 2 * Math.PI * ARC_R;

// ── Score colour helper ───────────────────────────────────────────────────────
function scoreColor(n) {
  if (!n) return 'rgba(255,255,255,0.2)';
  if (n >= 75) return '#4ade80';
  if (n >= 50) return '#fcd34d';
  return '#f87171';
}

// ── Animated coach score arc ──────────────────────────────────────────────────
function ScoreArc({ value = 0 }) {
  const clamped = Math.min(100, Math.max(0, value));
  const offset  = ARC_C * (1 - clamped / 100);
  const color   = scoreColor(clamped);
  return (
    <svg viewBox="0 0 100 100" className={styles.arcSvg} aria-hidden="true">
      <circle cx="50" cy="50" r={ARC_R}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle cx="50" cy="50" r={ARC_R}
        fill="none" stroke={color}
        strokeWidth="8" strokeLinecap="round"
        strokeDasharray={ARC_C} strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
    </svg>
  );
}

// ── Confidence arc (smaller) ──────────────────────────────────────────────────
const CONF_R = 30;
const CONF_C = 2 * Math.PI * CONF_R;

function ConfidenceArc({ value = 0 }) {
  const clamped = Math.min(100, Math.max(0, value));
  const offset  = CONF_C * (1 - clamped / 100);
  return (
    <svg viewBox="0 0 70 70" className={styles.confArcSvg} aria-hidden="true">
      <circle cx="35" cy="35" r={CONF_R}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle cx="35" cy="35" r={CONF_R}
        fill="none" stroke="#6366f1"
        strokeWidth="6" strokeLinecap="round"
        strokeDasharray={CONF_C} strokeDashoffset={offset}
        transform="rotate(-90 35 35)"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
    </svg>
  );
}

// ── Priority colour map ───────────────────────────────────────────────────────
const PRIORITY_COLOR = {
  high:   '#f87171',
  medium: '#fcd34d',
  low:    '#4ade80',
};

// ── Section shell ─────────────────────────────────────────────────────────────
function Section({ title, accent, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel} style={accent ? { color: accent } : undefined}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Strength item ─────────────────────────────────────────────────────────────
function StrengthItem({ text, index }) {
  return (
    <div className={styles.strengthItem} style={{ animationDelay: `${index * 0.05}s` }}>
      <span className={styles.strengthCheck}>✓</span>
      <span className={styles.strengthText}>{text}</span>
    </div>
  );
}

// ── Improvement item ──────────────────────────────────────────────────────────
function ImprovementItem({ item, index }) {
  const color = PRIORITY_COLOR[item.priority] ?? PRIORITY_COLOR.medium;
  return (
    <div className={styles.improvementItem} style={{ animationDelay: `${index * 0.05}s` }}>
      <div className={styles.improvementHeader}>
        <span className={styles.improvementArea}>{item.area}</span>
        <span className={styles.priorityPill} style={{ color, borderColor: `${color}44`, background: `${color}14` }}>
          {item.priority}
        </span>
      </div>
      <p className={styles.improvementDetail}>{item.detail}</p>
    </div>
  );
}

// ── Action row ────────────────────────────────────────────────────────────────
function ActionRow({ item, onComplete, index }) {
  const handleClick = useCallback(() => {
    if (!item.completed) onComplete(item.id);
  }, [item, onComplete]);

  return (
    <button
      className={`${styles.actionRow} ${item.completed ? styles.actionRowDone : ''}`}
      onClick={handleClick}
      disabled={item.completed}
      aria-label={item.completed ? `${item.label} — done` : `Mark done: ${item.label}`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <span className={`${styles.actionCheck} ${item.completed ? styles.actionCheckDone : ''}`}
        aria-hidden="true">
        {item.completed ? '✓' : '○'}
      </span>
      <span className={styles.actionIcon} aria-hidden="true">{item.icon}</span>
      <span className={styles.actionLabel}>{item.label}</span>
    </button>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function CoachSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.skeletonBar} ${styles.skeletonBarWide}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonBarMed}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonBarNarrow}`} />
    </div>
  );
}

// ══ Main screen ════════════════════════════════════════════════════════════════

export default function CreatorCoachScreen() {
  const { coachSession, isGenerating, completeAction, refreshCoach } = useCreatorCoach();
  const navigate = useNavigate();

  const focusMeta = COACHING_FOCUS_META[coachSession.focus] ?? COACHING_FOCUS_META.growth;
  const hasSessions = coachSession.coachScore > 0 || coachSession.confidence > 0;

  const handleCTA = useCallback(() => navigate('/camera'), [navigate]);

  return (
    <div className={styles.screen}>

      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            IBM watsonx.ai
          </span>
          <h1 className={styles.headerTitle}>AI Coach</h1>
          <p className={styles.headerSub}>Your personalised growth analysis</p>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={refreshCoach}
          disabled={isGenerating}
          aria-label="Refresh coaching session"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" className={isGenerating ? styles.refreshSpin : undefined}
            width="18" height="18" aria-hidden="true">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div className={styles.scroll}>

        {isGenerating && <CoachSkeleton />}

        {/* 1 ── Score hero */}
        <div className={styles.scoreHero}>
          <div className={styles.scoreHeroGlow} aria-hidden="true" />

          <div className={styles.scoreArcWrap}>
            <ScoreArc value={coachSession.coachScore} />
            <div className={styles.scoreInner}>
              <span className={styles.scoreVal} style={{ color: scoreColor(coachSession.coachScore) }}>
                {coachSession.coachScore}
              </span>
              <span className={styles.scoreUnit}>/100</span>
            </div>
          </div>

          <div className={styles.scoreInfo}>
            <h2 className={styles.coachTitle}>{coachSession.coachTitle}</h2>

            {/* Focus badge */}
            <div className={styles.focusBadge}
              style={{
                color:       focusMeta.color,
                borderColor: `${focusMeta.color}44`,
                background:  `${focusMeta.color}14`,
              }}>
              <span className={styles.focusBadgeIcon}>{focusMeta.icon}</span>
              <span className={styles.focusBadgeLabel}>{focusMeta.label}</span>
            </div>

            {/* Score delta */}
            {hasSessions && coachSession.scoreDelta !== 0 && (
              <div className={styles.scoreDelta}
                style={{ color: coachSession.scoreDelta >= 0 ? '#4ade80' : '#f87171' }}>
                {coachSession.scoreDelta >= 0 ? '▲' : '▼'}
                {' '}{Math.abs(coachSession.scoreDelta)} pts
              </div>
            )}

            {/* Generated timestamp */}
            {coachSession.generatedAt && (
              <span className={styles.scoreTime}>
                {new Date(coachSession.generatedAt).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>

        {/* 2 ── Feedback summary */}
        <div className={styles.feedbackCard}>
          <p className={styles.feedbackSummary}>{coachSession.feedbackSummary}</p>
        </div>

        {/* 3 ── Strengths */}
        {coachSession.strengths?.length > 0 && (
          <Section title="Strengths" accent="#4ade80">
            <div className={styles.strengthsList}>
              {coachSession.strengths.map((s, i) => (
                <StrengthItem key={i} text={s} index={i} />
              ))}
            </div>
          </Section>
        )}

        {/* 4 ── Improvements */}
        {coachSession.improvements?.length > 0 && (
          <Section title="Areas to Improve" accent="#fcd34d">
            <div className={styles.improvementsList}>
              {coachSession.improvements.map((item, i) => (
                <ImprovementItem key={i} item={item} index={i} />
              ))}
            </div>
          </Section>
        )}

        {/* 5 ── Action plan */}
        {coachSession.actionPlan?.length > 0 && (
          <Section title="Your Action Plan" accent="#6366f1">
            <div className={styles.actionList} role="list">
              {coachSession.actionPlan.map((item, i) => (
                <div key={item.id} role="listitem">
                  <ActionRow item={item} onComplete={completeAction} index={i} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 6 ── Session insight */}
        <div className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <span className={styles.insightIcon}>✦</span>
            <span className={styles.insightTitle}>Key Insight</span>
          </div>
          <p className={styles.insightText}>{coachSession.sessionInsight}</p>
        </div>

        {/* 7 ── Confidence meter */}
        <div className={styles.confidenceCard}>
          <div className={styles.confArcContainer}>
            <ConfidenceArc value={coachSession.confidence} />
            <div className={styles.confArcInner}>
              <span className={styles.confVal}>{coachSession.confidence}</span>
              <span className={styles.confUnit}>%</span>
            </div>
          </div>
          <div className={styles.confInfo}>
            <p className={styles.confTitle}>AI Confidence</p>
            <p className={styles.confSub}>
              {coachSession.confidence >= 70
                ? 'High confidence — your profile is well established.'
                : coachSession.confidence >= 40
                  ? 'Building confidence — keep shooting to strengthen coaching data.'
                  : 'Low confidence — complete more sessions to unlock full coaching.'}
            </p>
          </div>
        </div>

        {/* 8 ── CTA */}
        <button
          className={styles.ctaBtn}
          onClick={handleCTA}
          aria-label="Start shooting session"
        >
          <span className={styles.ctaBtnLabel}>Start a Session</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" width="18" height="18" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <div style={{ height: 100 }} />
      </div>

      <BottomNavBar />
    </div>
  );
}

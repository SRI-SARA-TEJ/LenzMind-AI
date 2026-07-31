/**
 * growth/components/CreatorGrowthScreen.jsx
 *
 * Module 10.4 — Realis Creator Growth Engine
 *
 * Full-screen growth plan view. Consumes CreatorGrowthContext (written by
 * GrowthBridge) and renders the latest growth plan. Zero business logic
 * lives here — all data flows from useCreatorGrowth().
 *
 * ── Sections ──────────────────────────────────────────────────────────────────
 *   1. Fixed header       — IBM badge, title ("Growth Engine"), refresh button
 *   2. Growth score hero  — animated arc, score, delta, trajectory badge
 *   3. XP progress bar    — current XP, next level label, progress to next level
 *   4. Plan overview card — horizon, weekly target, plan title
 *   5. Growth insight     — key longitudinal observation
 *   6. Milestones list    — 3–5 ordered milestones with progress bars
 *   7. Skill gaps list    — up to 3 identified skill gaps with level bars
 *   8. Confidence meter   — AI confidence in this growth plan
 *   9. BottomNavBar
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   Camera capture
 *     → CameraMemoryBridge   → CreatorMemoryContext
 *     → AnalyticsBridge      → AnalyticsContext
 *     → LearningBridge       → CreatorLearningContext
 *     → AssistantBridge      → CreatorAssistantContext
 *     → MissionBridge        → CreatorMissionContext
 *     → CoachBridge          → CreatorCoachContext
 *     → GrowthBridge         → CreatorGrowthContext  ← growthPlan
 */

import React, { useCallback } from 'react';
import styles                  from './CreatorGrowthScreen.module.css';

import { useCreatorGrowth }    from '../hooks/useCreatorGrowth';
import { TRAJECTORY_META }     from '../models/growthModel';

import BottomNavBar from '../../camera/components/BottomNavBar';

// ── SVG arc constants ─────────────────────────────────────────────────────────
const ARC_R = 44;
const ARC_C = 2 * Math.PI * ARC_R;

// ── Colour helpers ────────────────────────────────────────────────────────────
function scoreColor(n) {
  if (!n) return 'rgba(255,255,255,0.2)';
  if (n >= 75) return '#4ade80';
  if (n >= 50) return '#fcd34d';
  return '#f87171';
}

// ── Animated growth score arc ─────────────────────────────────────────────────
function GrowthArc({ value = 0 }) {
  const clamped = Math.min(100, Math.max(0, value));
  const offset  = ARC_C * (1 - clamped / 100);
  const color   = scoreColor(clamped);
  return (
    <svg viewBox="0 0 100 100" className={styles.arcSvg} aria-hidden="true">
      <circle cx="50" cy="50" r={ARC_R}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
      <circle cx="50" cy="50" r={ARC_R}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={ARC_C}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
    </svg>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function GrowthSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.skeletonBar} ${styles.skeletonBarWide}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonBarMed}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonBarNarrow}`} />
    </div>
  );
}

// ── Section shell ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{title}</p>
      {children}
    </div>
  );
}

// ── Milestone row ─────────────────────────────────────────────────────────────
function MilestoneRow({ milestone, onComplete }) {
  const pct = milestone.targetValue > 0
    ? Math.min(100, Math.round((milestone.currentValue / milestone.targetValue) * 100))
    : 0;

  return (
    <button
      className={`${styles.milestoneRow} ${milestone.completed ? styles.milestoneRowDone : ''}`}
      onClick={() => !milestone.completed && onComplete(milestone.id)}
      disabled={milestone.completed}
      aria-label={milestone.label}
    >
      <div className={styles.milestoneCheck}>
        {milestone.completed ? '✓' : '○'}
      </div>
      <div className={styles.milestoneMeta}>
        <div className={styles.milestoneTop}>
          <span className={styles.milestoneLabel}>{milestone.label}</span>
          {!milestone.completed && milestone.daysEstimate > 0 && (
            <span className={styles.milestoneDays}>~{milestone.daysEstimate}d</span>
          )}
        </div>
        <p className={styles.milestoneDesc}>{milestone.description}</p>
        <div className={styles.milestoneTrack}>
          <div
            className={styles.milestoneFill}
            style={{
              width: `${pct}%`,
              background: milestone.completed ? '#4ade80' : '#6366f1',
            }}
          />
        </div>
        <div className={styles.milestoneFooter}>
          <span className={styles.milestoneCurrent}>{milestone.currentValue}</span>
          <span className={styles.milestoneSep}>/</span>
          <span className={styles.milestoneTarget}>{milestone.targetValue}</span>
          <span className={styles.milestonePct}>{pct}%</span>
        </div>
      </div>
    </button>
  );
}

// ── Skill gap row ─────────────────────────────────────────────────────────────
function SkillGapRow({ gap }) {
  const fillPct   = Math.min(100, gap.currentLevel);
  const targetPct = Math.min(100, gap.targetLevel);
  return (
    <div className={styles.skillGapRow}>
      <div className={styles.skillGapHeader}>
        <span className={styles.skillGapName}>{gap.skill}</span>
        <span className={styles.skillGapLevels}>
          {gap.currentLevel} → {gap.targetLevel}
        </span>
      </div>
      <p className={styles.skillGapDetail}>{gap.detail}</p>
      <div className={styles.skillGapTrack}>
        <div className={styles.skillGapTarget}  style={{ width: `${targetPct}%` }} />
        <div className={styles.skillGapCurrent} style={{ width: `${fillPct}%` }} />
      </div>
    </div>
  );
}

// ══ Main screen ════════════════════════════════════════════════════════════════

export default function CreatorGrowthScreen() {
  const {
    growthPlan,
    isGenerating,
    refreshGrowth,
    completeMilestone,
  } = useCreatorGrowth();

  const handleComplete = useCallback((id) => {
    completeMilestone(id);
  }, [completeMilestone]);

  const tmeta = TRAJECTORY_META[growthPlan.trajectory] ?? TRAJECTORY_META.steady;

  // XP progress percentage toward next level
  const totalXPForLevel = growthPlan.currentXP + growthPlan.xpToNextLevel;
  const xpPct = totalXPForLevel > 0
    ? Math.round((growthPlan.currentXP / totalXPForLevel) * 100)
    : 0;

  return (
    <div className={styles.screen}>

      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            IBM watsonx.ai
          </span>
          <h1 className={styles.headerTitle}>Growth Engine</h1>
          <p className={styles.headerSub}>Your personalised creator growth plan</p>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={refreshGrowth}
          disabled={isGenerating}
          aria-label="Refresh growth plan"
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

        {isGenerating && <GrowthSkeleton />}

        {/* 1 ── Growth score hero */}
        <div className={styles.scoreHero}>
          <div className={styles.scoreHeroGlow} aria-hidden="true" />
          <div className={styles.scoreArcWrap}>
            <GrowthArc value={growthPlan.growthScore} />
            <div className={styles.scoreInner}>
              <span className={styles.scoreVal}
                style={{ color: scoreColor(growthPlan.growthScore) }}>
                {growthPlan.growthScore}
              </span>
              <span className={styles.scoreUnit}>/100</span>
            </div>
          </div>

          <div className={styles.scoreInfo}>
            <h2 className={styles.planTitle}>{growthPlan.planTitle}</h2>
            <span
              className={styles.trajectoryBadge}
              style={{
                color:       tmeta.color,
                borderColor: tmeta.color + '44',
                background:  tmeta.color + '14',
              }}
            >
              {tmeta.icon} {tmeta.label}
            </span>
            {growthPlan.growthScoreDelta !== 0 && (
              <span className={styles.scoreDelta}
                style={{ color: growthPlan.growthScoreDelta >= 0 ? '#4ade80' : '#f87171' }}>
                {growthPlan.growthScoreDelta >= 0 ? '+' : ''}{growthPlan.growthScoreDelta} vs prior
              </span>
            )}
            {growthPlan.generatedAt && (
              <span className={styles.scoreTime}>
                {new Date(growthPlan.generatedAt).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>

        {/* 2 ── XP progress */}
        <div className={styles.xpCard}>
          <div className={styles.xpHeader}>
            <div className={styles.xpLeft}>
              <span className={styles.xpCurrentLabel}>Current XP</span>
              <span className={styles.xpCurrentVal}>{growthPlan.currentXP} XP</span>
            </div>
            <div className={styles.xpRight}>
              <span className={styles.xpNextLabel}>Next Level</span>
              <span className={styles.xpNextVal}>{growthPlan.nextLevelLabel}</span>
            </div>
          </div>
          <div className={styles.xpTrack}>
            <div
              className={styles.xpFill}
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className={styles.xpFooter}>
            <span className={styles.xpPct}>{xpPct}%</span>
            <span className={styles.xpRemaining}>
              {growthPlan.xpToNextLevel > 0
                ? `${growthPlan.xpToNextLevel} XP to go`
                : 'Level reached!'}
            </span>
          </div>
        </div>

        {/* 3 ── Plan overview */}
        <div className={styles.overviewCard}>
          <div className={styles.overviewRow}>
            <div className={styles.overviewCell}>
              <span className={styles.overviewVal}>{growthPlan.horizonDays}d</span>
              <span className={styles.overviewLbl}>Horizon</span>
            </div>
            <div className={styles.overviewDiv} />
            <div className={styles.overviewCell}>
              <span className={styles.overviewVal}>{growthPlan.weeklyTarget}×</span>
              <span className={styles.overviewLbl}>Per Week</span>
            </div>
            <div className={styles.overviewDiv} />
            <div className={styles.overviewCell}>
              <span className={styles.overviewVal}
                style={{ color: scoreColor(growthPlan.confidence) }}>
                {growthPlan.confidence}%
              </span>
              <span className={styles.overviewLbl}>AI Confidence</span>
            </div>
          </div>
        </div>

        {/* 4 ── Growth insight */}
        <div className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <span className={styles.insightIcon}>✦</span>
            <span className={styles.insightTitle}>Growth Insight</span>
          </div>
          <p className={styles.insightText}>{growthPlan.growthInsight}</p>
        </div>

        {/* 5 ── Milestones */}
        {growthPlan.milestones.length > 0 && (
          <Section title="Milestones">
            <div className={styles.milestonesList}>
              {growthPlan.milestones.map((m) => (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          </Section>
        )}

        {/* 6 ── Skill gaps */}
        {growthPlan.skillGaps.length > 0 && (
          <Section title="Skill Gaps">
            <div className={styles.skillGapsList}>
              {growthPlan.skillGaps.map((gap) => (
                <SkillGapRow key={gap.skill} gap={gap} />
              ))}
            </div>
          </Section>
        )}

        <div style={{ height: 100 }} />
      </div>

      <BottomNavBar />
    </div>
  );
}

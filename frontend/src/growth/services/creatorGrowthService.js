/**
 * growth/services/creatorGrowthService.js — Creator Growth Engine
 *
 * Module 10.4 — Realis Creator Growth Engine
 *
 * Pure-function service that generates a personalised CreatorGrowthPlan by
 * synthesising data from all six upstream intelligence layers:
 *   • CreatorLearningProfile  (from CreatorLearningContext)
 *   • AnalyticsStatistics     (from AnalyticsContext)
 *   • CreatorMemoryStats      (from CreatorMemoryContext — creatorStats derived)
 *   • CreatorBriefing         (from CreatorAssistantContext)
 *   • CreatorMission          (from CreatorMissionContext)
 *   • CreatorCoachSession     (from CreatorCoachContext)
 *
 * ── Design principles ─────────────────────────────────────────────────────────
 *   1. Pure functions only — no React, no side effects, no network calls.
 *   2. Each section builder is individually try/catch isolated — one failure
 *      cannot abort the rest of the plan.
 *   3. Every section degrades gracefully when data is sparse (0 sessions).
 *   4. [AI_FUTURE] Replace generateGrowthPlan() with a watsonx.ai API call.
 *
 * ── Output ────────────────────────────────────────────────────────────────────
 *   Returns a CreatorGrowthPlan (see growthModel.js).
 */

import { clamp } from '../../services/serviceUtils';
import { createBlankGrowthPlan, createBlankGrowthMilestone } from '../models/growthModel';

// ─────────────────────────────────────────────────────────────────────────────
// Section builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine the growth trajectory from confidence trend and capture velocity.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {'accelerating'|'steady'|'plateauing'|'declining'}
 */
function buildTrajectory(learningProfile, creatorStats) {
  const trend        = learningProfile?.confidenceTrend?.direction ?? 'stable';
  const capturesLast7  = learningProfile?.captureTimingPreferences?.capturesLast7  ?? 0;
  const capturesLast30 = learningProfile?.captureTimingPreferences?.capturesLast30 ?? 0;

  // Velocity ratio: recent week vs monthly average
  const monthlyAvgPerWeek = capturesLast30 / 4;
  const velocityRatio = monthlyAvgPerWeek > 0
    ? capturesLast7 / monthlyAvgPerWeek
    : capturesLast7 > 0 ? 1.5 : 0;

  if (trend === 'improving' && velocityRatio >= 1.2) return 'accelerating';
  if (trend === 'declining' || velocityRatio < 0.5)  return 'declining';
  if (trend === 'stable'    && velocityRatio < 0.8)  return 'plateauing';
  return 'steady';
}

/**
 * Build a 0–100 composite growth velocity score.
 *
 * @param {object} coachSession
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {number}
 */
function buildGrowthScore(coachSession, learningProfile, creatorStats) {
  const coachScore     = coachSession?.coachScore             ?? 0;
  const capturesLast7  = learningProfile?.captureTimingPreferences?.capturesLast7 ?? 0;
  const learningConf   = learningProfile?.learningConfidence  ?? 0;
  const acceptanceRate = learningProfile?.recommendationBehaviour?.acceptanceRate ?? 0;

  // Weighted composite: 40% coach score, 25% learning confidence,
  // 20% acceptance rate, 15% recent activity (capped at 5 sessions/week = full)
  const activityScore = clamp(capturesLast7 / 5, 0, 1) * 100;
  const score = Math.round(
    coachScore     * 0.40 +
    learningConf   * 0.25 +
    acceptanceRate * 0.20 +
    activityScore  * 0.15,
  );
  return clamp(score, 0, 100);
}

/**
 * Determine the planning horizon based on session data density.
 *
 * @param {number} totalSessions
 * @param {object} learningProfile
 * @returns {7|14|30}
 */
function buildHorizonDays(totalSessions, learningProfile) {
  const capturesLast7 = learningProfile?.captureTimingPreferences?.capturesLast7 ?? 0;
  if (totalSessions >= 15 && capturesLast7 >= 3) return 30;
  if (totalSessions >= 5  && capturesLast7 >= 1) return 14;
  return 7;
}

/**
 * Recommend sessions per week based on trajectory and recent activity.
 *
 * @param {string} trajectory
 * @param {object} learningProfile
 * @param {string} missionDifficulty
 * @returns {number}
 */
function buildWeeklyTarget(trajectory, learningProfile, missionDifficulty) {
  const capturesLast7 = learningProfile?.captureTimingPreferences?.capturesLast7 ?? 0;
  const base = capturesLast7 > 0 ? Math.max(capturesLast7, 2) : 3;

  const trajectoryBoost = {
    accelerating: 1,
    steady:       0,
    plateauing:  -1,
    declining:    1, // increase to break the plateau
  }[trajectory] ?? 0;

  const difficultyBoost = missionDifficulty === 'epic'   ?  1
                        : missionDifficulty === 'hard'   ?  0
                        : missionDifficulty === 'medium' ?  0
                        : -1; // easy — don't overwhelm

  return clamp(base + trajectoryBoost + difficultyBoost, 1, 7);
}

/**
 * Build 3–5 ordered growth milestones.
 *
 * @param {object} creatorStats
 * @param {object} coachSession
 * @param {number} totalSessions
 * @returns {GrowthMilestone[]}
 */
function buildMilestones(creatorStats, coachSession, totalSessions) {
  const quality    = creatorStats?.averageQualityScore ?? 0;
  const acceptance = creatorStats?.aiAcceptanceRate    ?? 0;
  const streak     = creatorStats?.currentStreak       ?? 0;
  const coachScore = coachSession?.coachScore          ?? 0;

  const milestones = [];

  // Milestone 1 — Sessions count
  const sessionTarget = totalSessions < 5 ? 5 : totalSessions < 10 ? 10 : totalSessions < 25 ? 25 : 50;
  milestones.push({
    ...createBlankGrowthMilestone('ms-1', 'Session Count'),
    description:  `Reach ${sessionTarget} total shooting sessions`,
    targetValue:  sessionTarget,
    currentValue: totalSessions,
    unit:         'sessions',
    completed:    totalSessions >= sessionTarget,
    daysEstimate: totalSessions >= sessionTarget
      ? 0
      : Math.ceil((sessionTarget - totalSessions) / Math.max(1, creatorStats?.totalSessions ? 0.5 : 0.2)),
  });

  // Milestone 2 — Quality score
  const qualityTarget = quality < 60 ? 60 : quality < 75 ? 75 : quality < 90 ? 90 : 100;
  milestones.push({
    ...createBlankGrowthMilestone('ms-2', 'Quality Score'),
    description:  `Achieve an average quality score of ${qualityTarget}`,
    targetValue:  qualityTarget,
    currentValue: quality,
    unit:         'quality_score',
    completed:    quality >= qualityTarget,
    daysEstimate: quality >= qualityTarget ? 0 : Math.ceil((qualityTarget - quality) / 3),
  });

  // Milestone 3 — AI acceptance rate
  const acceptTarget = acceptance < 50 ? 50 : acceptance < 70 ? 70 : acceptance < 85 ? 85 : 100;
  milestones.push({
    ...createBlankGrowthMilestone('ms-3', 'AI Acceptance'),
    description:  `Reach ${acceptTarget}% AI recommendation acceptance rate`,
    targetValue:  acceptTarget,
    currentValue: acceptance,
    unit:         'acceptance_rate',
    completed:    acceptance >= acceptTarget,
    daysEstimate: acceptance >= acceptTarget ? 0 : Math.ceil((acceptTarget - acceptance) / 5),
  });

  // Milestone 4 — Coach score (only if meaningful data)
  if (coachScore > 0) {
    const coachTarget = coachScore < 50 ? 50 : coachScore < 70 ? 70 : coachScore < 85 ? 85 : 100;
    milestones.push({
      ...createBlankGrowthMilestone('ms-4', 'Creator Health'),
      description:  `Reach a creator health score of ${coachTarget}`,
      targetValue:  coachTarget,
      currentValue: coachScore,
      unit:         'quality_score',
      completed:    coachScore >= coachTarget,
      daysEstimate: coachScore >= coachTarget ? 0 : Math.ceil((coachTarget - coachScore) / 4),
    });
  }

  // Milestone 5 — Streak (only if any streak history)
  if (streak > 0 || totalSessions >= 3) {
    const streakTarget = streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : 30;
    milestones.push({
      ...createBlankGrowthMilestone('ms-5', 'Consistency Streak'),
      description:  `Maintain a ${streakTarget}-day shooting streak`,
      targetValue:  streakTarget,
      currentValue: streak,
      unit:         'streak_days',
      completed:    streak >= streakTarget,
      daysEstimate: streak >= streakTarget ? 0 : streakTarget - streak,
    });
  }

  return milestones.slice(0, 5);
}

/**
 * Identify up to 3 skill gaps from the coaching session focus and learning signals.
 *
 * @param {object} coachSession
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {SkillGap[]}
 */
function buildSkillGaps(coachSession, learningProfile, creatorStats) {
  const gaps = [];
  const focus        = coachSession?.focus               ?? 'growth';
  const learningConf = learningProfile?.learningConfidence ?? 0;
  const acceptance   = learningProfile?.recommendationBehaviour?.acceptanceRate ?? 0;
  const trend        = learningProfile?.confidenceTrend?.direction ?? 'stable';
  const capturesLast7 = learningProfile?.captureTimingPreferences?.capturesLast7 ?? 0;

  // Gap 1 — Derived from coach focus
  if (focus === 'ai_adoption' || acceptance < 50) {
    gaps.push({
      skill:        'AI Collaboration',
      currentLevel: clamp(acceptance, 0, 100),
      targetLevel:  clamp(acceptance + 25, 0, 100),
      detail:       'Accept more AI recommendations to unlock personalised improvements.',
    });
  } else if (focus === 'consistency' || capturesLast7 < 2) {
    const consistencyScore = clamp(capturesLast7 / 5 * 100, 0, 100);
    gaps.push({
      skill:        'Shooting Consistency',
      currentLevel: Math.round(consistencyScore),
      targetLevel:  clamp(Math.round(consistencyScore) + 30, 0, 100),
      detail:       'Increase your weekly shooting frequency to build momentum.',
    });
  } else if (focus === 'technique' || trend === 'declining') {
    const qualityLevel = creatorStats?.averageQualityScore ?? 0;
    gaps.push({
      skill:        'Technical Quality',
      currentLevel: qualityLevel,
      targetLevel:  clamp(qualityLevel + 15, 0, 100),
      detail:       'Focus on applying your preferred settings consistently each session.',
    });
  }

  // Gap 2 — Profile completeness
  if (learningConf < 60) {
    gaps.push({
      skill:        'Creator Profile',
      currentLevel: learningConf,
      targetLevel:  clamp(learningConf + 25, 0, 100),
      detail:       'More sessions build a richer AI profile and better recommendations.',
    });
  }

  // Gap 3 — Workflow mastery (if workflows data present)
  const topWorkflow = learningProfile?.preferredWorkflows?.[0];
  if (topWorkflow && (topWorkflow.score ?? 0) < 60) {
    gaps.push({
      skill:        `${topWorkflow.workflowName} Mastery`,
      currentLevel: topWorkflow.score ?? 0,
      targetLevel:  clamp((topWorkflow.score ?? 0) + 20, 0, 100),
      detail:       `Use ${topWorkflow.workflowName} more consistently to deepen your expertise.`,
    });
  }

  return gaps.slice(0, 3);
}

/**
 * Build a single key longitudinal growth insight string.
 *
 * @param {string} trajectory
 * @param {object} coachSession
 * @param {object} learningProfile
 * @returns {string}
 */
function buildGrowthInsight(trajectory, coachSession, learningProfile) {
  const coachScore    = coachSession?.coachScore ?? 0;
  const capturesLast30 = learningProfile?.captureTimingPreferences?.capturesLast30 ?? 0;
  const delta         = coachSession?.scoreDelta ?? 0;
  const style         = learningProfile?.shootingHabits?.favoriteStyle;

  if (capturesLast30 === 0) {
    return 'Start shooting to unlock your personalised longitudinal growth plan.';
  }

  const trajectoryInsights = {
    accelerating: `You're accelerating — ${capturesLast30} sessions last month with a ${coachScore}/100 health score. Keep this momentum.`,
    steady:       delta >= 0
      ? `Steady progress with a ${coachScore}/100 creator health score${style ? ` in your ${style} style` : ''}.`
      : `Consistent effort — focus on quality over quantity to push your ${coachScore}/100 score higher.`,
    plateauing:   `Your growth has plateaued at ${coachScore}/100. A change in workflow or style could reignite momentum.`,
    declining:    `Recent activity dip detected. Returning to your ${capturesLast30}-session monthly rhythm will reverse the trend.`,
  };

  return trajectoryInsights[trajectory] ?? 'Keep shooting to grow your creator profile.';
}

/**
 * Compute current XP, XP to next level, and next-level label.
 *
 * @param {number} totalSessions
 * @param {object} creatorStats
 * @param {object} coachSession
 * @returns {{ currentXP: number, xpToNextLevel: number, nextLevelLabel: string }}
 */
function buildXPLevel(totalSessions, creatorStats, coachSession) {
  const quality    = creatorStats?.averageQualityScore ?? 0;
  const coachScore = coachSession?.coachScore          ?? 0;
  const streak     = creatorStats?.currentStreak       ?? 0;

  // XP formula: sessions * 10 + quality bonus + coach score bonus + streak bonus
  const currentXP = Math.round(
    totalSessions * 10 +
    quality * 0.5 +
    coachScore * 0.3 +
    streak * 5,
  );

  // Level thresholds
  const LEVELS = [
    { xp: 0,    label: 'Emerging Creator' },
    { xp: 50,   label: 'Active Creator' },
    { xp: 150,  label: 'Developing Creator' },
    { xp: 300,  label: 'Skilled Creator' },
    { xp: 500,  label: 'Advanced Creator' },
    { xp: 800,  label: 'Expert Creator' },
    { xp: 1200, label: 'Master Creator' },
    { xp: 2000, label: 'Elite Creator' },
  ];

  const currentLevelIdx = LEVELS.reduce((acc, lvl, i) => currentXP >= lvl.xp ? i : acc, 0);
  const nextLevelIdx    = Math.min(currentLevelIdx + 1, LEVELS.length - 1);
  const nextLevel       = LEVELS[nextLevelIdx];
  const xpToNextLevel   = Math.max(0, nextLevel.xp - currentXP);

  return {
    currentXP,
    xpToNextLevel,
    nextLevelLabel: nextLevel.label,
  };
}

/**
 * Compute confidence in the growth plan itself.
 *
 * @param {object} learningProfile
 * @param {number} totalSessions
 * @param {object} coachSession
 * @returns {number}  0–100
 */
function computeGrowthConfidence(learningProfile, totalSessions, coachSession) {
  const learningConf = learningProfile?.learningConfidence ?? 0;
  const coachConf    = coachSession?.confidence            ?? 0;

  // 50% from learning confidence, 30% from coach confidence, 20% from session density
  const sessionScore = clamp(totalSessions * 3, 0, 20);
  return clamp(
    Math.round(learningConf * 0.50 + coachConf * 0.30 + sessionScore),
    0, 100,
  );
}

/**
 * Build a plan title based on horizon and dominant style.
 *
 * @param {number} horizonDays
 * @param {object} learningProfile
 * @param {string} trajectory
 * @returns {string}
 */
function buildPlanTitle(horizonDays, learningProfile, trajectory) {
  const style    = learningProfile?.shootingHabits?.favoriteStyle;
  const workflow = learningProfile?.preferredWorkflows?.[0]?.workflowName;

  const prefix = style    ? `${style} ` :
                 workflow ? `${workflow} ` : '';

  const horizonLabel = `${horizonDays}-Day`;

  const trajectorySuffix = trajectory === 'accelerating' ? 'Acceleration Plan'
                         : trajectory === 'declining'    ? 'Recovery Plan'
                         : trajectory === 'plateauing'   ? 'Breakthrough Plan'
                         : 'Growth Path';

  return `${horizonLabel} ${prefix}${trajectorySuffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a personalised CreatorGrowthPlan from all available intelligence data.
 *
 * @param {object} learningProfile   — from CreatorLearningContext
 * @param {object} analyticsStats    — from AnalyticsContext.state.statistics
 * @param {object} creatorStats      — derived from CreatorMemoryContext
 * @param {object} briefing          — from CreatorAssistantContext
 * @param {object} mission           — from CreatorMissionContext
 * @param {object} coachSession      — from CreatorCoachContext
 * @returns {CreatorGrowthPlan}
 */
export function generateGrowthPlan(
  learningProfile,
  analyticsStats,
  creatorStats,
  briefing,
  mission,
  coachSession,
) {
  const profile    = learningProfile ?? {};
  const mStats     = creatorStats    ?? {};
  const coach      = coachSession    ?? {};
  const miss       = mission         ?? {};

  const totalSessions = mStats.totalSessions ?? 0;

  // Start from blank — each builder fills one section in isolation
  const plan = createBlankGrowthPlan();
  plan.generatedAt = new Date().toISOString();

  // Each builder is individually try/catch isolated — one failure cannot abort others.

  try {
    plan.trajectory = buildTrajectory(profile, mStats);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildTrajectory failed:', e.message);
  }

  try {
    plan.growthScore = buildGrowthScore(coach, profile, mStats);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildGrowthScore failed:', e.message);
  }

  try {
    // Delta: current score vs coach score as a rough prior (0 on first run)
    plan.growthScoreDelta = plan.growthScore - (coach.coachScore ?? plan.growthScore);
  } catch (e) {
    plan.growthScoreDelta = 0;
  }

  try {
    plan.horizonDays = buildHorizonDays(totalSessions, profile);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildHorizonDays failed:', e.message);
  }

  try {
    plan.weeklyTarget = buildWeeklyTarget(plan.trajectory, profile, miss.difficulty);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildWeeklyTarget failed:', e.message);
  }

  try {
    plan.milestones = buildMilestones(mStats, coach, totalSessions);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildMilestones failed:', e.message);
  }

  try {
    plan.skillGaps = buildSkillGaps(coach, profile, mStats);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildSkillGaps failed:', e.message);
  }

  try {
    plan.growthInsight = buildGrowthInsight(plan.trajectory, coach, profile);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildGrowthInsight failed:', e.message);
  }

  try {
    const xp = buildXPLevel(totalSessions, mStats, coach);
    plan.currentXP      = xp.currentXP;
    plan.xpToNextLevel  = xp.xpToNextLevel;
    plan.nextLevelLabel = xp.nextLevelLabel;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildXPLevel failed:', e.message);
  }

  try {
    plan.planTitle = buildPlanTitle(plan.horizonDays, profile, plan.trajectory);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] buildPlanTitle failed:', e.message);
  }

  try {
    plan.confidence = computeGrowthConfidence(profile, totalSessions, coach);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GrowthService] computeGrowthConfidence failed:', e.message);
  }

  return plan;
}

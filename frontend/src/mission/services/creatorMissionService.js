/**
 * mission/services/creatorMissionService.js — Creator Mission Engine
 *
 * Module 10.2 — Realis Creator Mission Engine
 *
 * Pure-function service that generates a personalised CreatorMission by
 * synthesising data from four intelligence layers:
 *   • CreatorLearningProfile  (from CreatorLearningContext)
 *   • AnalyticsStatistics     (from AnalyticsContext)
 *   • CreatorMemoryStats      (from CreatorMemoryContext — creatorStats derived)
 *   • CreatorBriefing         (from CreatorAssistantContext — today's briefing)
 *
 * ── Design principles ─────────────────────────────────────────────────────────
 *   1. Pure functions only — no React, no side effects, no network calls.
 *   2. Reads from existing derived data — no duplicate computation.
 *   3. Every section degrades gracefully when data is sparse.
 *   4. [AI_FUTURE] Replace generateMission() with a watsonx.ai API call.
 *
 * ── Output ────────────────────────────────────────────────────────────────────
 *   Returns a CreatorMission (see missionModel.js).
 */

import { createBlankReward } from '../models/missionModel';
import { clamp } from '../../services/serviceUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a task entry. */
function task(id, label, icon = '◻️') {
  return { id, label, completed: false, icon };
}

// ── Difficulty resolver ───────────────────────────────────────────────────────

/**
 * Determine mission difficulty from learning confidence and session count.
 * New creators get easy missions; expert creators get harder challenges.
 *
 * @param {number} learningConfidence  0–100
 * @param {number} totalSessions
 * @returns {'easy'|'medium'|'hard'|'epic'}
 */
function resolveDifficulty(learningConfidence, totalSessions) {
  if (learningConfidence >= 75 && totalSessions >= 20) return 'epic';
  if (learningConfidence >= 55 && totalSessions >= 10) return 'hard';
  if (learningConfidence >= 30 && totalSessions >= 3)  return 'medium';
  return 'easy';
}

// ── Task builders ─────────────────────────────────────────────────────────────

/**
 * Build a focused task list tailored to the creator's current state.
 * Returns 3–5 tasks, never fewer than 1.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @param {object} briefing          — today's AI briefing
 * @param {'easy'|'medium'|'hard'|'epic'} difficulty
 * @returns {import('../models/missionModel').MissionTask[]}
 */
function buildTasks(learningProfile, creatorStats, briefing, difficulty) {
  const tasks_ = [];
  const sessions      = creatorStats?.totalSessions       ?? 0;
  const avgQuality    = creatorStats?.averageQualityScore  ?? 0;
  const acceptance    = creatorStats?.aiAcceptanceRate     ?? 0;
  const workflow      = briefing?.recommendedWorkflow;
  const style         = learningProfile?.shootingHabits?.favoriteStyle;
  const movement      = learningProfile?.shootingHabits?.favoriteMovement;
  const scene         = learningProfile?.preferredScenes?.[0]?.scene;
  const window_       = learningProfile?.captureTimingPreferences?.mostActiveWindow;
  const trend         = learningProfile?.confidenceTrend?.direction;

  // ── Task 1 — always present: primary shoot task ──────────────────────────
  if (workflow) {
    tasks_.push(task('task-1',
      `Complete one ${workflow} shooting session`,
      '🎬'));
  } else {
    tasks_.push(task('task-1',
      'Complete a shooting session with AI guidance',
      '📸'));
  }

  // ── Task 2 — scene-specific or style ────────────────────────────────────
  if (scene) {
    tasks_.push(task('task-2',
      `Shoot at least 3 captures in a ${scene} environment`,
      '🌅'));
  } else if (style) {
    tasks_.push(task('task-2',
      `Apply your ${style} style in today's session`,
      '🎨'));
  } else {
    tasks_.push(task('task-2',
      'Experiment with a new shooting style today',
      '🎨'));
  }

  // ── Task 3 — AI acceptance / quality ────────────────────────────────────
  if (acceptance < 60 && sessions > 0) {
    tasks_.push(task('task-3',
      'Accept at least 2 AI recommendations during your session',
      '🤖'));
  } else if (avgQuality > 0) {
    const target = clamp(avgQuality + 5, 1, 100);
    tasks_.push(task('task-3',
      `Achieve a quality score of ${target} or higher`,
      '⭐'));
  } else {
    tasks_.push(task('task-3',
      'Complete your session and receive an AI quality score',
      '⭐'));
  }

  // ── Task 4 — medium / hard / epic: timing or movement ───────────────────
  if (difficulty !== 'easy') {
    if (window_ && movement) {
      tasks_.push(task('task-4',
        `Use ${movement} movement during your ${window_} session`,
        '🎥'));
    } else if (movement) {
      tasks_.push(task('task-4',
        `Incorporate ${movement} camera movement`,
        '🎥'));
    } else if (window_) {
      tasks_.push(task('task-4',
        `Shoot during your ${window_} peak window`,
        '⏱'));
    }
  }

  // ── Task 5 — hard / epic only: quality improvement ───────────────────────
  if ((difficulty === 'hard' || difficulty === 'epic') && trend === 'improving') {
    tasks_.push(task('task-5',
      'Beat your previous session quality score',
      '📈'));
  } else if (difficulty === 'epic') {
    tasks_.push(task('task-5',
      'Share your session output and log it in Projects',
      '🚀'));
  }

  return tasks_.slice(0, 5);
}

// ── Mission title builder ─────────────────────────────────────────────────────

/**
 * Generate a punchy mission title appropriate for the difficulty and context.
 *
 * @param {'easy'|'medium'|'hard'|'epic'} difficulty
 * @param {object} learningProfile
 * @param {object} briefing
 * @returns {string}
 */
function buildMissionTitle(difficulty, learningProfile, briefing) {
  const workflow = briefing?.recommendedWorkflow
                ?? learningProfile?.preferredWorkflows?.[0]?.workflowName;
  const scene    = learningProfile?.preferredScenes?.[0]?.scene;
  const style    = learningProfile?.shootingHabits?.favoriteStyle;

  const titleMap = {
    easy:   workflow ? `${workflow} Starter` : 'First Shot Mission',
    medium: scene    ? `${scene} Challenge`  : style ? `${style} Session` : 'Creative Challenge',
    hard:   workflow ? `Master the ${workflow}` : 'Precision Mission',
    epic:   style    ? `${style} Perfection` : 'Creator Epic',
  };

  return titleMap[difficulty] ?? 'Daily Creator Mission';
}

// ── Estimated improvement ─────────────────────────────────────────────────────

/**
 * Predict quality score improvement from completing the mission.
 *
 * @param {'easy'|'medium'|'hard'|'epic'} difficulty
 * @param {object} creatorStats
 * @param {number} briefingConfidence  0–100
 * @returns {number}  0–30
 */
function estimateImprovement(difficulty, creatorStats, briefingConfidence) {
  const base = { easy: 3, medium: 7, hard: 12, epic: 20 }[difficulty] ?? 5;
  const conf = clamp(briefingConfidence / 100, 0, 1);
  // Boost improvement estimate if AI confidence is high
  return clamp(Math.round(base * (0.8 + conf * 0.4)), 1, 30);
}

// ── Reward builder ────────────────────────────────────────────────────────────

/**
 * Build the completion reward object.
 *
 * @param {'easy'|'medium'|'hard'|'epic'} difficulty
 * @param {number} estimatedImprovement
 * @param {object} creatorStats
 * @returns {import('../models/missionModel').MissionReward}
 */
function buildReward(difficulty, estimatedImprovement, creatorStats) {
  const streak    = creatorStats?.currentStreak ?? 0;
  const sessions  = creatorStats?.totalSessions ?? 0;

  const rewardMap = {
    easy: {
      label: `+${estimatedImprovement} Quality Points`,
      icon:  '⭐',
      type:  'quality',
    },
    medium: {
      label: streak > 0
        ? `Extend your ${streak + 1}-day streak`
        : `+${estimatedImprovement} Quality Points`,
      icon:  '🔥',
      type:  'streak',
    },
    hard: {
      label: `Unlock Precision Shooter badge`,
      icon:  '🏆',
      type:  'badge',
    },
    epic: {
      label: sessions >= 10
        ? 'Elite Creator status upgrade'
        : `+${estimatedImprovement} Quality Points + Streak Boost`,
      icon:  '👑',
      type:  'badge',
    },
  };

  return rewardMap[difficulty] ?? createBlankReward();
}

// ── Reasoning builder ─────────────────────────────────────────────────────────

/**
 * Build 1–3 human-readable strings explaining why this mission was assigned.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @param {object} briefing
 * @param {'easy'|'medium'|'hard'|'epic'} difficulty
 * @returns {string[]}
 */
function buildReasoning(learningProfile, creatorStats, briefing, difficulty) {
  const reasons = [];
  const sessions  = creatorStats?.totalSessions ?? 0;
  const conf      = learningProfile?.learningConfidence ?? 0;
  const workflow  = briefing?.recommendedWorkflow;
  const wfScore   = learningProfile?.preferredWorkflows?.[0]?.score;
  const trend     = learningProfile?.confidenceTrend?.direction;

  if (sessions === 0) {
    reasons.push('Missions adapt as you shoot — this is your starter challenge.');
  } else {
    if (workflow && wfScore) {
      reasons.push(`You use ${workflow} in ${wfScore}% of your sessions — this mission deepens that skill.`);
    }
    if (difficulty === 'hard' || difficulty === 'epic') {
      reasons.push(`Your learning profile is at ${conf}/100 — you're ready for a harder challenge.`);
    }
    if (trend === 'improving') {
      reasons.push('Your quality scores are trending up — push further with a targeted mission.');
    } else if (trend === 'declining') {
      reasons.push('A focused mission will help reverse your recent quality dip.');
    }
  }

  return reasons.slice(0, 3).length > 0
    ? reasons.slice(0, 3)
    : ['Complete this mission to build your creator profile.'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a personalised CreatorMission from all available intelligence data.
 *
 * @param {import('../../learning/models/learningModel').CreatorLearningProfile} learningProfile
 * @param {object|null} analyticsStats   — AnalyticsContext.state.statistics
 * @param {object}      creatorStats     — derived from CreatorMemoryContext
 * @param {import('../../assistant/models/assistantModel').CreatorBriefing} briefing — today's briefing
 * @returns {import('../models/missionModel').CreatorMission}
 */
export function generateMission(learningProfile, analyticsStats, creatorStats, briefing) {
  const profile    = learningProfile ?? {};
  const mStats     = creatorStats    ?? {};
  const todayBrief = briefing        ?? {};

  const difficulty          = resolveDifficulty(
    profile.learningConfidence  ?? 0,
    mStats.totalSessions        ?? 0,
  );
  const tasks_               = buildTasks(profile, mStats, todayBrief, difficulty);
  const estimatedImprovement = estimateImprovement(difficulty, mStats, todayBrief.confidence ?? 0);
  const reward               = buildReward(difficulty, estimatedImprovement, mStats);

  // completionProgress is always 0 on generation — MissionCard tracks it locally
  const completionProgress = 0;

  return {
    generatedAt:          new Date().toISOString(),
    missionTitle:         buildMissionTitle(difficulty, profile, todayBrief),
    tasks:                tasks_,
    estimatedImprovement,
    difficulty,
    completionProgress,
    reward,
    reasoning:            buildReasoning(profile, mStats, todayBrief, difficulty),
  };
}

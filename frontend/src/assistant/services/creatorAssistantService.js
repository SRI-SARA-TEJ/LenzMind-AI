/**
 * assistant/services/creatorAssistantService.js — Creator Assistant Engine
 *
 * Module 10.1 — Realis AI Creator Assistant
 *
 * Pure-function service that generates a personalised daily CreatorBriefing
 * from three existing intelligence layers:
 *   • CreatorLearningProfile  (from CreatorLearningContext via LearningBridge)
 *   • AnalyticsStatistics     (from AnalyticsContext via AnalyticsBridge)
 *   • MemoryProfile + Stats   (from CreatorMemoryContext)
 *
 * ── Design principles ─────────────────────────────────────────────────────────
 *
 *   1. Pure functions only — no React, no side effects, no network calls.
 *   2. Never reads from or writes to any context — called by AssistantBridge.
 *   3. Graceful degradation — every section falls back to sensible defaults
 *      when data is sparse (new users with 0 sessions are handled correctly).
 *   4. No duplicate computation — reuses signals already derived by
 *      creatorLearningService (predictedNextWorkflow, personalizedPresetHint,
 *      cameraSettingPreferences, learningConfidence, confidenceTrend, etc.).
 *   5. [AI_FUTURE] Replace generateBriefing() with an async IBM watsonx.ai
 *      call that returns a richer, GPT-quality personalised briefing.
 *
 * ── Output ────────────────────────────────────────────────────────────────────
 *   Returns a CreatorBriefing (see assistantModel.js).
 */

import { clamp, cap } from '../../services/serviceUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Current hour (0–23). */
function currentHour() {
  return new Date().getHours();
}

/** Time-of-day greeting word. */
function timeGreeting() {
  const h = currentHour();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Hey';
}

// ── Greeting generator ────────────────────────────────────────────────────────

/**
 * Build a personalised greeting string.
 *
 * @param {string|null} creatorName
 * @param {object}      creatorStats   — from CreatorMemoryContext
 * @param {object}      learningProfile — from CreatorLearningContext
 * @returns {string}
 */
function buildGreeting(creatorName, creatorStats, learningProfile) {
  const firstName = creatorName?.split(' ')[0] ?? 'Creator';
  const base      = `${timeGreeting()}, ${firstName}.`;

  const streak    = creatorStats?.currentStreak ?? 0;
  const sessions  = creatorStats?.totalSessions ?? 0;
  const conf      = learningProfile?.learningConfidence ?? 0;

  if (sessions === 0) {
    return `${base} Welcome to Realis AI. Let's capture your first shot.`;
  }
  if (streak >= 7) {
    return `${base} You're on a ${streak}-day streak — incredible consistency!`;
  }
  if (conf >= 70) {
    return `${base} Your AI profile is strong. Here's today's personalised plan.`;
  }
  if (sessions < 5) {
    return `${base} You've got ${sessions} session${sessions !== 1 ? 's' : ''} in. Keep going — your profile is building.`;
  }
  return `${base} Ready to create something great today?`;
}

// ── Recommendation builder ────────────────────────────────────────────────────

/**
 * Build the primary AI recommendation sentence.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {string}
 */
function buildRecommendation(learningProfile, creatorStats) {
  const workflow   = learningProfile?.predictedNextWorkflow
                  ?? learningProfile?.preferredWorkflows?.[0]?.workflowName;
  const style      = learningProfile?.shootingHabits?.favoriteStyle;
  const window_    = learningProfile?.captureTimingPreferences?.mostActiveWindow;
  const trend      = learningProfile?.confidenceTrend?.direction;
  const quality    = creatorStats?.averageQualityScore ?? 0;

  const parts = [];

  if (workflow) {
    parts.push(`AI recommends the <strong>${workflow}</strong> workflow for today`);
  } else {
    parts.push('Start a shooting session to activate AI recommendations');
  }

  if (style) {
    parts.push(`matching your ${style} style`);
  }

  if (window_ && workflow) {
    parts.push(`during your peak ${window_} window`);
  }

  if (trend === 'improving' && quality > 0) {
    parts.push(`— your quality score is trending up to ${quality}`);
  }

  return cap(parts.join(' ')) + '.';
}

// ── Expected quality predictor ────────────────────────────────────────────────

/**
 * Predict the expected quality score for the recommended session.
 * Uses best historical score weighted toward the learning confidence level.
 *
 * @param {object} creatorStats
 * @param {object} learningProfile
 * @returns {number}  0–100
 */
function predictQuality(creatorStats, learningProfile) {
  const best  = creatorStats?.bestQualityScore       ?? 0;
  const avg   = creatorStats?.averageQualityScore    ?? 0;
  const trend = learningProfile?.confidenceTrend;
  const conf  = learningProfile?.learningConfidence  ?? 0;

  if (best === 0) return 0;

  // Weight: 60% avg, 40% best, boosted slightly when improving
  let predicted = Math.round(avg * 0.6 + best * 0.4);
  if (trend?.direction === 'improving' && trend?.delta > 0) {
    predicted = Math.min(100, predicted + Math.round(trend.delta * 0.5));
  }
  // If confidence < 30 the estimate is rough — pull toward avg
  if (conf < 30) {
    predicted = Math.round((predicted + avg) / 2);
  }
  return clamp(predicted, 0, 100);
}

// ── Briefing confidence ───────────────────────────────────────────────────────

/**
 * Compute confidence in the briefing itself (how good the data is).
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {number}  0–100
 */
function computeBriefingConfidence(learningProfile, creatorStats) {
  const lc       = learningProfile?.learningConfidence ?? 0;
  const sessions = creatorStats?.totalSessions ?? 0;
  const hasWf    = !!learningProfile?.predictedNextWorkflow;
  const hasPrefs = !!learningProfile?.cameraSettingPreferences;

  let score = Math.round(lc * 0.6);                         // up to 60 from learning
  score += clamp(sessions * 2, 0, 20);                      // up to 20 from sessions
  if (hasWf)    score += 10;
  if (hasPrefs) score += 10;
  return clamp(score, 0, 100);
}

// ── Reasons builder ───────────────────────────────────────────────────────────

/**
 * Build an array of human-readable reason strings explaining the briefing.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {string[]}  up to 5 reasons
 */
function buildReasons(learningProfile, creatorStats) {
  const reasons = [];
  const wf      = learningProfile?.preferredWorkflows?.[0];
  const scene   = learningProfile?.preferredScenes?.[0];
  const timing  = learningProfile?.captureTimingPreferences;
  const habits  = learningProfile?.shootingHabits;
  const behav   = learningProfile?.recommendationBehaviour;
  const trend   = learningProfile?.confidenceTrend;
  const qual    = creatorStats?.averageQualityScore ?? 0;

  if (wf?.workflowName && wf.score > 0) {
    reasons.push(`You use ${wf.workflowName} in ${wf.score}% of your sessions.`);
  }
  if (scene?.scene) {
    reasons.push(`Your most-shot environment is ${scene.scene} (${scene.pct}% of sessions).`);
  }
  if (timing?.mostActiveWindow && timing?.preferredDayOfWeek) {
    reasons.push(`You shoot best on ${timing.preferredDayOfWeek} ${timing.mostActiveWindow}s.`);
  }
  if (habits?.favoriteStyle) {
    reasons.push(`Your shooting style — ${habits.favoriteStyle} — pairs well with this workflow.`);
  }
  if (behav?.acceptanceRate >= 60) {
    reasons.push(`You accept ${behav.acceptanceRate}% of AI recommendations — high alignment.`);
  }
  if (trend?.direction === 'improving' && trend?.delta > 0) {
    reasons.push(`Your quality score is improving (+${trend.delta} points recent vs prior).`);
  }
  if (qual >= 70 && reasons.length < 5) {
    reasons.push(`Your average quality score is ${qual} — above the creator average.`);
  }

  return reasons.slice(0, 5);
}

// ── Daily goal builder ────────────────────────────────────────────────────────

/**
 * Generate a short, motivational daily creative goal.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {string}
 */
function buildDailyGoal(learningProfile, creatorStats) {
  const wf       = learningProfile?.predictedNextWorkflow;
  const sessions = creatorStats?.totalSessions ?? 0;
  const streak   = creatorStats?.currentStreak ?? 0;
  const best     = creatorStats?.bestQualityScore ?? 0;
  const window_  = learningProfile?.captureTimingPreferences?.mostActiveWindow;

  if (sessions === 0) {
    return 'Complete your first AI-guided shooting session today.';
  }
  if (wf && window_) {
    return `Shoot one ${wf} session during your ${window_} window and beat your best score of ${best}.`;
  }
  if (wf) {
    return `Complete one ${wf} session and aim for a quality score above ${Math.min(best + 5, 100)}.`;
  }
  if (streak > 0) {
    return `Extend your ${streak}-day streak with a focused creative session today.`;
  }
  return 'Capture at least one session today and let AI help you improve your score.';
}

// ── Priority tier ─────────────────────────────────────────────────────────────

function resolvePriority(confidence, sessions) {
  if (confidence >= 65 && sessions >= 5) return 'high';
  if (confidence >= 35 || sessions >= 2) return 'medium';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a personalised CreatorBriefing from all available intelligence data.
 *
 * @param {import('../../learning/models/learningModel').CreatorLearningProfile} learningProfile
 * @param {object|null}  analyticsStats   — AnalyticsContext.state.statistics
 * @param {object|null}  memoryProfile    — CreatorMemoryContext.state.profile
 * @param {object}       creatorStats     — derived from CreatorMemoryContext
 * @returns {import('../models/assistantModel').CreatorBriefing}
 */
export function generateBriefing(learningProfile, analyticsStats, memoryProfile, creatorStats) {
  const profile  = learningProfile ?? {};
  const mStats   = creatorStats    ?? {};
  const mProfile = memoryProfile   ?? {};

  const recommendedWorkflow    = profile.predictedNextWorkflow
                              ?? profile.preferredWorkflows?.[0]?.workflowName
                              ?? null;
  const recommendedWorkflowId  = profile.preferredWorkflows?.find(
    w => w.workflowName === recommendedWorkflow,
  )?.workflowId ?? null;

  const recommendedCameraSettings = profile.personalizedPresetHint?.settings
                                 ?? profile.cameraSettingPreferences
                                 ?? null;

  const confidence  = computeBriefingConfidence(profile, mStats);
  const priority    = resolvePriority(confidence, mStats.totalSessions ?? 0);

  return {
    generatedAt:               new Date().toISOString(),
    greeting:                  buildGreeting(mProfile.name, mStats, profile),
    aiRecommendation:          buildRecommendation(profile, mStats),
    recommendedWorkflow,
    recommendedWorkflowId,
    recommendedCameraSettings,
    expectedQuality:           predictQuality(mStats, profile),
    confidence,
    reasons:                   buildReasons(profile, mStats),
    dailyGoal:                 buildDailyGoal(profile, mStats),
    ctaLabel:                  recommendedWorkflow ? `Start ${recommendedWorkflow}` : 'Open Camera',
    ctaPath:                   '/camera',
    priority,
  };
}

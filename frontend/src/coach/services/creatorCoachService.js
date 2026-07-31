/**
 * coach/services/creatorCoachService.js — Creator Coach Engine
 *
 * Module 10.3 — Realis Creator Coach Engine
 *
 * Pure-function service that generates a personalised CreatorCoachSession by
 * synthesising data from all five upstream intelligence layers:
 *   • CreatorLearningProfile  (from CreatorLearningContext)
 *   • AnalyticsStatistics     (from AnalyticsContext)
 *   • CreatorMemoryStats      (from CreatorMemoryContext — creatorStats derived)
 *   • CreatorBriefing         (from CreatorAssistantContext)
 *   • CreatorMission          (from CreatorMissionContext)
 *
 * ── Design principles ─────────────────────────────────────────────────────────
 *   1. Pure functions only — no React, no side effects, no network calls.
 *   2. Never reads from or writes to any context — called exclusively by CoachBridge.
 *   3. Reads from existing derived data — no duplicate computation.
 *   4. Every section degrades gracefully when data is sparse (0 sessions handled).
 *   5. Each section builder is individually try/catch isolated — one failure
 *      never aborts the rest of the session.
 *   6. [AI_FUTURE] Replace generateCoachSession() with an async IBM watsonx.ai
 *      call that returns a richer, GPT-quality personalised coaching session.
 *
 * ── Output ────────────────────────────────────────────────────────────────────
 *   Returns a CreatorCoachSession (see coachModel.js).
 */

import { clamp, cap } from '../../services/serviceUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a CoachAction entry. */
function action(id, label, icon = '▶') {
  return { id, label, icon, completed: false };
}

// ── Focus resolver ────────────────────────────────────────────────────────────

/**
 * Determine the primary coaching focus area based on the weakest signal.
 * Priority: ai_adoption → consistency → technique → growth.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {'technique'|'consistency'|'ai_adoption'|'growth'}
 */
function buildFocus(learningProfile, creatorStats) {
  const acceptanceRate = learningProfile?.recommendationBehaviour?.acceptanceRate ?? 100;
  const capturesLast7  = learningProfile?.captureTimingPreferences?.capturesLast7  ?? 1;
  const trend          = learningProfile?.confidenceTrend?.direction;
  const sessions       = creatorStats?.totalSessions ?? 0;

  if (sessions === 0) return 'growth';
  if (acceptanceRate < 50)  return 'ai_adoption';
  if (capturesLast7 < 2)    return 'consistency';
  if (trend === 'declining') return 'technique';
  return 'growth';
}

// ── Coach title builder ───────────────────────────────────────────────────────

/**
 * Generate a coaching session title based on focus and context.
 *
 * @param {'technique'|'consistency'|'ai_adoption'|'growth'} focus
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {string}
 */
function buildCoachTitle(focus, learningProfile, creatorStats) {
  const workflow = learningProfile?.preferredWorkflows?.[0]?.workflowName;
  const style    = learningProfile?.shootingHabits?.favoriteStyle;
  const sessions = creatorStats?.totalSessions ?? 0;

  if (sessions === 0) return 'Welcome to Your Creator Coach';

  const titleMap = {
    technique:   workflow ? `${workflow} Technique Review` : style ? `${cap(style)} Technique Review` : 'Technique Deep Dive',
    consistency: 'Consistency Challenge',
    ai_adoption: 'AI Collaboration Review',
    growth:      workflow ? `${workflow} Mastery Path` : 'Creator Growth Review',
  };

  return titleMap[focus] ?? 'Creator Coach Session';
}

// ── Feedback summary builder ──────────────────────────────────────────────────

/**
 * Build a 1–2 sentence personalised overall assessment.
 *
 * @param {'technique'|'consistency'|'ai_adoption'|'growth'} focus
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {string}
 */
function buildFeedbackSummary(focus, learningProfile, creatorStats) {
  const sessions  = creatorStats?.totalSessions      ?? 0;
  const quality   = creatorStats?.averageQualityScore ?? 0;
  const streak    = creatorStats?.currentStreak       ?? 0;
  const conf      = learningProfile?.learningConfidence ?? 0;
  const trend     = learningProfile?.confidenceTrend?.direction;
  const workflow  = learningProfile?.preferredWorkflows?.[0]?.workflowName;

  if (sessions === 0) {
    return 'Your coaching profile is ready. Complete your first session to unlock personalised feedback and an AI growth plan.';
  }

  const qualityStr = quality > 0 ? ` with an average quality score of ${quality}` : '';
  const opener     = `You've completed ${sessions} session${sessions !== 1 ? 's' : ''}${qualityStr}.`;

  const focusMap = {
    technique:   trend === 'declining'
      ? `${opener} Your quality scores have dipped recently — let's sharpen your ${workflow ?? 'shooting'} technique today.`
      : `${opener} Your technique foundation is solid${workflow ? ` with ${workflow}` : ''} — time to refine the details.`,
    consistency: streak > 0
      ? `${opener} You have a ${streak}-day active streak — but your capture frequency last week was lower than your peak. Let's keep momentum.`
      : `${opener} Building a consistent daily shooting habit is your highest-leverage improvement right now.`,
    ai_adoption: `${opener} You're not yet fully leveraging the AI recommendation system — accepting more suggestions will significantly accelerate your quality growth.`,
    growth:      conf >= 70
      ? `${opener} Your AI profile is strong and your patterns are clear. This session focuses on expanding your creative range.`
      : `${opener} Your profile is developing well. ${conf > 0 ? `AI confidence is at ${conf}/100` : 'Keep shooting to strengthen your profile'} — here's your growth plan.`,
  };

  return focusMap[focus] ?? opener;
}

// ── Strengths builder ─────────────────────────────────────────────────────────

/**
 * Build up to 3 positive signal strings from the creator's data.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @param {object} briefing
 * @returns {string[]}
 */
function buildStrengths(learningProfile, creatorStats, briefing) {
  const strengths = [];
  const quality      = creatorStats?.averageQualityScore    ?? 0;
  const best         = creatorStats?.bestQualityScore        ?? 0;
  const streak       = creatorStats?.currentStreak           ?? 0;
  const acceptRate   = creatorStats?.aiAcceptanceRate        ?? 0;
  const sessions     = creatorStats?.totalSessions           ?? 0;
  const conf         = learningProfile?.learningConfidence   ?? 0;
  const trend        = learningProfile?.confidenceTrend;
  const topWorkflow  = learningProfile?.preferredWorkflows?.[0];
  const timing       = learningProfile?.captureTimingPreferences;
  const briefConf    = briefing?.confidence                  ?? 0;

  if (trend?.direction === 'improving' && trend?.delta > 0) {
    strengths.push(`Quality score improving +${trend.delta} points over recent sessions.`);
  } else if (quality >= 70) {
    strengths.push(`Strong average quality score of ${quality}/100.`);
  }

  if (streak >= 3) {
    strengths.push(`Active ${streak}-day shooting streak — excellent consistency.`);
  } else if (sessions >= 10) {
    strengths.push(`${sessions} sessions completed — solid body of work.`);
  }

  if (acceptRate >= 70) {
    strengths.push(`${acceptRate}% AI recommendation acceptance rate — great AI collaboration.`);
  } else if (topWorkflow?.score >= 60) {
    strengths.push(`Strong specialisation in ${topWorkflow.workflowName} (${topWorkflow.score}% of sessions).`);
  }

  if (strengths.length < 3 && conf >= 50) {
    strengths.push(`AI learning profile at ${conf}/100 — sufficient data for reliable coaching.`);
  }

  if (strengths.length < 3 && best >= 80) {
    strengths.push(`Best quality score of ${best} — demonstrates peak capability.`);
  }

  if (strengths.length < 3 && timing?.mostActiveWindow) {
    strengths.push(`Consistent ${timing.mostActiveWindow} shooting window — disciplined schedule.`);
  }

  if (strengths.length < 3 && briefConf >= 60) {
    strengths.push('AI briefing confidence is high — your patterns are well established.');
  }

  return strengths.slice(0, 3);
}

// ── Improvements builder ──────────────────────────────────────────────────────

/**
 * Build up to 3 improvement areas, each with an area label, detail, and priority.
 *
 * @param {'technique'|'consistency'|'ai_adoption'|'growth'} focus
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {import('../models/coachModel').CoachImprovement[]}
 */
function buildImprovements(focus, learningProfile, creatorStats) {
  const improvements = [];
  const sessions      = creatorStats?.totalSessions       ?? 0;
  const acceptRate    = creatorStats?.aiAcceptanceRate     ?? 0;
  const quality       = creatorStats?.averageQualityScore  ?? 0;
  const streak        = creatorStats?.currentStreak        ?? 0;
  const capturesLast7 = learningProfile?.captureTimingPreferences?.capturesLast7 ?? 1;
  const wfCount       = learningProfile?.preferredWorkflows?.length ?? 0;
  const trend         = learningProfile?.confidenceTrend?.direction;
  const behaviour     = learningProfile?.recommendationBehaviour;

  if (sessions === 0) {
    improvements.push({
      area:     'Profile Building',
      detail:   'Complete at least 3 sessions to unlock full personalised coaching.',
      priority: 'high',
    });
    return improvements;
  }

  // Primary focus improvement is always first
  if (focus === 'ai_adoption' || acceptRate < 60) {
    improvements.push({
      area:     'AI Recommendation Adoption',
      detail:   behaviour?.acceptanceRate != null
        ? `Your acceptance rate is ${behaviour.acceptanceRate}% — try accepting every AI suggestion in your next session.`
        : 'Engage with AI recommendations more often to accelerate your quality growth.',
      priority: acceptRate < 40 ? 'high' : 'medium',
    });
  }

  if (focus === 'consistency' || capturesLast7 < 2) {
    improvements.push({
      area:     'Shooting Consistency',
      detail:   capturesLast7 === 0
        ? 'You haven\'t captured any sessions this week. Even one session drives measurable improvement.'
        : `Only ${capturesLast7} capture${capturesLast7 !== 1 ? 's' : ''} in the last 7 days — aim for at least 3 per week.`,
      priority: capturesLast7 === 0 ? 'high' : 'medium',
    });
  }

  if (focus === 'technique' || trend === 'declining') {
    improvements.push({
      area:     'Shot Quality',
      detail:   quality > 0
        ? `Average quality score of ${quality} — focus on composition, lighting, and stability to push above ${Math.min(quality + 10, 100)}.`
        : 'Complete a session with AI quality scoring enabled to establish your baseline.',
      priority: trend === 'declining' ? 'high' : 'medium',
    });
  }

  // Fill remaining slots with secondary improvements
  if (improvements.length < 3 && wfCount < 3) {
    improvements.push({
      area:     'Workflow Variety',
      detail:   'Experimenting with more workflow types will improve your AI profile and expand your creative range.',
      priority: 'low',
    });
  }

  if (improvements.length < 3 && streak === 0 && sessions > 0) {
    improvements.push({
      area:     'Streak Building',
      detail:   'Start a multi-day shooting streak to build consistent momentum and improve AI coaching accuracy.',
      priority: 'medium',
    });
  }

  return improvements.slice(0, 3);
}

// ── Action plan builder ───────────────────────────────────────────────────────

/**
 * Build 2–4 concrete next steps tailored to the coaching focus.
 *
 * @param {'technique'|'consistency'|'ai_adoption'|'growth'} focus
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @param {object} briefing
 * @param {object} mission
 * @returns {import('../models/coachModel').CoachAction[]}
 */
function buildActionPlan(focus, learningProfile, creatorStats, briefing, mission) {
  const actions_   = [];
  const sessions   = creatorStats?.totalSessions      ?? 0;
  const workflow   = briefing?.recommendedWorkflow     ?? learningProfile?.preferredWorkflows?.[0]?.workflowName;
  const window_    = learningProfile?.captureTimingPreferences?.mostActiveWindow;
  const style      = learningProfile?.shootingHabits?.favoriteStyle;
  const difficulty = mission?.difficulty               ?? 'easy';

  if (sessions === 0) {
    actions_.push(action('action-1', 'Complete your first AI-guided shooting session', '📸'));
    actions_.push(action('action-2', 'Open the Workflow Library and select a starter workflow', '⚙️'));
    return actions_;
  }

  // Action 1 — always: shoot a session with the recommended workflow
  if (workflow) {
    actions_.push(action('action-1', `Shoot a ${workflow} session${window_ ? ` during your ${window_} window` : ''}`, '🎬'));
  } else {
    actions_.push(action('action-1', 'Complete a shooting session with AI guidance active', '📸'));
  }

  // Action 2 — focus-specific
  const focusActionMap = {
    ai_adoption:  action('action-2', 'Accept every AI recommendation in your next session', '🤖'),
    consistency:  action('action-2', 'Schedule a session for tomorrow and set a reminder', '📅'),
    technique:    action('action-3', style
      ? `Study one ${style}-style reference video before shooting`
      : 'Review your last session quality report and identify one area to improve', '📚'),
    growth:       action('action-2', 'Try one new workflow you\'ve never used before', '🌱'),
  };
  if (focusActionMap[focus]) actions_.push(focusActionMap[focus]);

  // Action 3 — difficulty-scaled challenge
  if (difficulty === 'hard' || difficulty === 'epic') {
    actions_.push(action('action-3', 'Beat your personal best quality score this week', '📈'));
  } else {
    actions_.push(action('action-3', 'Complete your Daily Mission tasks before the next session', '✅'));
  }

  // Action 4 — always: review the assistant briefing
  actions_.push(action('action-4', 'Review your AI Assistant briefing before shooting', '✦'));

  return actions_.slice(0, 4);
}

// ── Coach score ───────────────────────────────────────────────────────────────

/**
 * Compute an overall creator health score (0–100) across four dimensions:
 * quality (40 pts), consistency (30 pts), AI adoption (20 pts), variety (10 pts).
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {number}  0–100
 */
function computeCoachScore(learningProfile, creatorStats) {
  const quality      = creatorStats?.averageQualityScore  ?? 0;
  const captLast7    = learningProfile?.captureTimingPreferences?.capturesLast7 ?? 0;
  const acceptRate   = creatorStats?.aiAcceptanceRate     ?? 0;
  const sessions     = creatorStats?.totalSessions        ?? 0;
  const wfCount      = learningProfile?.preferredWorkflows?.length ?? 0;

  if (sessions === 0) return 0;

  // Quality component: 0–40 pts (quality score maps 0–100 → 0–40)
  const qualityPts = clamp(Math.round(quality * 0.4), 0, 40);

  // Consistency component: 0–30 pts (capturesLast7 ≥ 5 = full score, tapers down)
  const consistencyPts = clamp(Math.round((captLast7 / 5) * 30), 0, 30);

  // AI adoption component: 0–20 pts
  const adoptionPts = clamp(Math.round(acceptRate * 0.2), 0, 20);

  // Variety component: 0–10 pts (3+ workflows = full score)
  const varietyPts = clamp(Math.round((wfCount / 3) * 10), 0, 10);

  return clamp(qualityPts + consistencyPts + adoptionPts + varietyPts, 0, 100);
}

/**
 * Estimate a score delta relative to a previous approximation.
 * Uses the confidence trend delta as a proxy when no history is available.
 *
 * @param {number} currentScore
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @returns {number}  delta (can be negative)
 */
function computeScoreDelta(currentScore, learningProfile, creatorStats) {
  const trend    = learningProfile?.confidenceTrend;
  const sessions = creatorStats?.totalSessions ?? 0;

  if (sessions < 2 || currentScore === 0) return 0;

  // Use quality trend delta weighted toward coach score scale
  if (trend?.delta != null && trend.delta !== 0) {
    return clamp(Math.round(trend.delta * 0.4), -20, 20);
  }

  // Flat if no trend information
  return 0;
}

// ── Session insight builder ───────────────────────────────────────────────────

/**
 * Generate a single standout insight sentence.
 *
 * @param {'technique'|'consistency'|'ai_adoption'|'growth'} focus
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @param {number} coachScore
 * @returns {string}
 */
function buildSessionInsight(focus, learningProfile, creatorStats, coachScore) {
  const sessions   = creatorStats?.totalSessions        ?? 0;
  const quality    = creatorStats?.averageQualityScore  ?? 0;
  const conf       = learningProfile?.learningConfidence ?? 0;
  const workflow   = learningProfile?.preferredWorkflows?.[0]?.workflowName;
  const trend      = learningProfile?.confidenceTrend;
  const behaviour  = learningProfile?.recommendationBehaviour;

  if (sessions === 0) {
    return 'Complete your first session — every great creator starts with shot #1.';
  }

  if (focus === 'ai_adoption' && behaviour?.acceptanceRate != null) {
    return `Increasing your AI acceptance rate from ${behaviour.acceptanceRate}% to 70% is the single highest-leverage action you can take this week.`;
  }

  if (focus === 'consistency') {
    return 'Creators who shoot at least 3 times per week improve quality scores 2× faster than those who shoot once.';
  }

  if (focus === 'technique' && trend?.direction === 'declining' && trend?.delta < 0) {
    return `Your quality score dropped ${Math.abs(trend.delta)} points recently — one focused technique session can reverse this trend.`;
  }

  if (coachScore >= 75) {
    return `Coach score ${coachScore}/100 — you're in the top tier. Your next focus: consistency and creative range.`;
  }

  if (workflow && conf >= 50) {
    return `You've built a strong ${workflow} foundation. AI confidence ${conf}/100 — your coaching data is reliable.`;
  }

  if (quality >= 70) {
    return `Quality score of ${quality} shows real skill. Keep shooting to maintain momentum and unlock harder challenges.`;
  }

  return `Your coach score is ${coachScore}/100 — targeted practice in ${focus.replace('_', ' ')} will drive the most growth.`;
}

// ── Confidence ────────────────────────────────────────────────────────────────

/**
 * Compute confidence in this coaching session (0–100).
 * Based on learning confidence, session count, and briefing confidence.
 *
 * @param {object} learningProfile
 * @param {object} creatorStats
 * @param {object} briefing
 * @returns {number}
 */
function computeSessionConfidence(learningProfile, creatorStats, briefing) {
  const lc       = learningProfile?.learningConfidence ?? 0;
  const sessions = creatorStats?.totalSessions         ?? 0;
  const bc       = briefing?.confidence                ?? 0;

  let score = Math.round(lc * 0.5);            // up to 50 from learning confidence
  score += clamp(sessions * 2, 0, 30);          // up to 30 from session count
  score += Math.round(bc * 0.2);               // up to 20 from briefing confidence
  return clamp(score, 0, 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a personalised CreatorCoachSession from all available intelligence data.
 *
 * @param {object|null} learningProfile   — CreatorLearningContext.profile
 * @param {object|null} analyticsStats    — AnalyticsContext.state.statistics
 * @param {object|null} creatorStats      — derived stats from CreatorMemoryContext
 * @param {object|null} briefing          — CreatorAssistantContext.briefing
 * @param {object|null} mission           — CreatorMissionContext.mission
 * @returns {import('../models/coachModel').CreatorCoachSession}
 */
export function generateCoachSession(learningProfile, analyticsStats, creatorStats, briefing, mission) {
  const profile   = learningProfile ?? {};
  const mStats    = creatorStats    ?? {};
  const brief     = briefing        ?? {};
  const miss      = mission         ?? {};

  // ── Section builders — each isolated in try/catch ──────────────────────────
  const session = { generatedAt: new Date().toISOString() };

  try { session.focus = buildFocus(profile, mStats); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] buildFocus failed:', err.message); session.focus = 'growth'; }

  try { session.coachTitle = buildCoachTitle(session.focus, profile, mStats); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] buildCoachTitle failed:', err.message); session.coachTitle = 'Creator Coach Session'; }

  try { session.feedbackSummary = buildFeedbackSummary(session.focus, profile, mStats); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] buildFeedbackSummary failed:', err.message); session.feedbackSummary = 'Keep shooting to build your coaching profile.'; }

  try { session.strengths = buildStrengths(profile, mStats, brief); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] buildStrengths failed:', err.message); session.strengths = []; }

  try { session.improvements = buildImprovements(session.focus, profile, mStats); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] buildImprovements failed:', err.message); session.improvements = []; }

  try { session.actionPlan = buildActionPlan(session.focus, profile, mStats, brief, miss); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] buildActionPlan failed:', err.message); session.actionPlan = []; }

  try { session.coachScore = computeCoachScore(profile, mStats); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] computeCoachScore failed:', err.message); session.coachScore = 0; }

  try { session.scoreDelta = computeScoreDelta(session.coachScore, profile, mStats); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] computeScoreDelta failed:', err.message); session.scoreDelta = 0; }

  try { session.sessionInsight = buildSessionInsight(session.focus, profile, mStats, session.coachScore); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] buildSessionInsight failed:', err.message); session.sessionInsight = 'Keep creating to build your coaching profile.'; }

  try { session.confidence = computeSessionConfidence(profile, mStats, brief); }
  catch (err) { /* eslint-disable-next-line no-console */ console.warn('[CreatorCoach] computeSessionConfidence failed:', err.message); session.confidence = 0; }

  return session;
}

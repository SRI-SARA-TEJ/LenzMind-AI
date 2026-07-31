/**
 * coach/models/coachModel.js — Creator Coach Model
 *
 * Module 10.3 — Realis Creator Coach Engine
 *
 * Defines the canonical shape of a CreatorCoachSession and its improvement /
 * action sub-types, and provides factory functions for safe blank instances
 * used as initial context state before the first generation run.
 *
 * ── Typedefs ───────────────────────────────────────────────────────────────────
 *
 * @typedef {'technique'|'consistency'|'ai_adoption'|'growth'} CoachingFocus
 *
 * @typedef {object} CoachImprovement
 * @property {string}              area      Short label for the skill area
 * @property {string}              detail    One-sentence explanation
 * @property {'high'|'medium'|'low'} priority Urgency of this improvement
 *
 * @typedef {object} CoachAction
 * @property {string}  id        Unique identifier (e.g. 'action-1')
 * @property {string}  label     Short action description shown in the UI
 * @property {string}  icon      Emoji / icon character
 * @property {boolean} completed Whether the creator has completed this action
 *
 * @typedef {object} CreatorCoachSession
 * @property {string|null}       generatedAt      ISO timestamp (null before first generation)
 * @property {string}            coachTitle       e.g. "Cinematic Mastery Review"
 * @property {CoachingFocus}     focus            Primary coaching focus area
 * @property {string}            feedbackSummary  1–2 sentence overall assessment
 * @property {string[]}          strengths        Up to 3 positive signal strings
 * @property {CoachImprovement[]} improvements    Up to 3 areas to work on
 * @property {CoachAction[]}     actionPlan       2–4 concrete next steps
 * @property {number}            coachScore       0–100 overall creator health score
 * @property {number}            scoreDelta       Change since previous estimate (can be negative)
 * @property {string}            sessionInsight   One key insight sentence
 * @property {number}            confidence       0–100 AI confidence in this coaching session
 */

// ── Focus area visual metadata ─────────────────────────────────────────────────

/**
 * Visual metadata keyed by coaching focus.
 * Mirrors the role of DIFFICULTY_META in missionModel.js.
 */
export const COACHING_FOCUS_META = {
  technique:    { label: 'Technique',    color: '#6366f1', icon: '🎯' },
  consistency:  { label: 'Consistency',  color: '#fcd34d', icon: '🔥' },
  ai_adoption:  { label: 'AI Adoption',  color: '#22d3ee', icon: '🤖' },
  growth:       { label: 'Growth',       color: '#4ade80', icon: '📈' },
};

// ── Factories ─────────────────────────────────────────────────────────────────

/**
 * Returns a blank CoachAction with safe defaults.
 * @param {string} id
 * @param {string} label
 * @returns {CoachAction}
 */
export function createBlankCoachAction(id = 'action-0', label = '') {
  return { id, label, icon: '◻️', completed: false };
}

/**
 * Returns a blank CoachImprovement with safe defaults.
 * @returns {CoachImprovement}
 */
export function createBlankCoachImprovement() {
  return { area: '', detail: '', priority: 'medium' };
}

/**
 * Returns a blank CreatorCoachSession with all fields set to their safe empty
 * defaults.  Used as initial context state before the first generation run.
 *
 * @returns {CreatorCoachSession}
 */
export function createBlankCoachSession() {
  return {
    generatedAt:     null,
    coachTitle:      'Your Creator Coach',
    focus:           'growth',
    feedbackSummary: 'Capture your first session to unlock personalised AI coaching.',
    strengths:       [],
    improvements:    [],
    actionPlan:      [],
    coachScore:      0,
    scoreDelta:      0,
    sessionInsight:  'Start shooting to build your coaching profile.',
    confidence:      0,
  };
}

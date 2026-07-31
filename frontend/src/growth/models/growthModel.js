/**
 * growth/models/growthModel.js — Creator Growth Model
 *
 * Module 10.4 — Realis Creator Growth Engine
 *
 * Defines the canonical shape of a CreatorGrowthPlan and its milestone /
 * skill-gap sub-types, and provides factory functions for safe blank instances
 * used as initial context state before the first generation run.
 *
 * ── Typedefs ───────────────────────────────────────────────────────────────────
 *
 * @typedef {'accelerating'|'steady'|'plateauing'|'declining'} GrowthTrajectory
 *
 * @typedef {object} GrowthMilestone
 * @property {string}  id           Unique identifier (e.g. 'ms-1')
 * @property {string}  label        Short milestone name
 * @property {string}  description  One-sentence description
 * @property {number}  targetValue  Numeric goal
 * @property {number}  currentValue Current progress toward target
 * @property {string}  unit         'sessions' | 'quality_score' | 'acceptance_rate' | 'streak_days'
 * @property {boolean} completed    Whether the milestone has been reached
 * @property {number}  daysEstimate Estimated days remaining to completion
 *
 * @typedef {object} SkillGap
 * @property {string} skill        Skill area name
 * @property {number} currentLevel 0–100 current proficiency
 * @property {number} targetLevel  0–100 target proficiency
 * @property {string} detail       One-sentence explanation
 *
 * @typedef {object} CreatorGrowthPlan
 * @property {string|null}       generatedAt       ISO timestamp (null before first run)
 * @property {string}            planTitle         e.g. "30-Day Cinematic Growth Path"
 * @property {number}            horizonDays       7 | 14 | 30
 * @property {number}            growthScore       0–100 velocity composite
 * @property {number}            growthScoreDelta  Change vs previous estimate
 * @property {GrowthTrajectory}  trajectory        Long-term direction
 * @property {number}            weeklyTarget      Recommended sessions per week
 * @property {GrowthMilestone[]} milestones        3–5 ordered milestones
 * @property {SkillGap[]}        skillGaps         Up to 3 identified skill gaps
 * @property {string}            growthInsight     One key longitudinal observation
 * @property {string}            nextLevelLabel    e.g. "Advanced Cinematographer"
 * @property {number}            xpToNextLevel     Abstract XP points needed
 * @property {number}            currentXP         Abstract current XP
 * @property {number}            confidence        0–100
 */

// ── Trajectory visual metadata ─────────────────────────────────────────────────

/**
 * Visual metadata keyed by trajectory value.
 */
export const TRAJECTORY_META = {
  accelerating: { label: 'Accelerating', color: '#4ade80', icon: '🚀' },
  steady:       { label: 'Steady',       color: '#a5b4fc', icon: '📈' },
  plateauing:   { label: 'Plateauing',   color: '#fcd34d', icon: '➡️' },
  declining:    { label: 'Declining',    color: '#f87171', icon: '📉' },
};

// ── Factories ─────────────────────────────────────────────────────────────────

/**
 * Returns a blank GrowthMilestone with safe defaults.
 * @param {string} id
 * @param {string} label
 * @returns {GrowthMilestone}
 */
export function createBlankGrowthMilestone(id = 'ms-0', label = '') {
  return {
    id,
    label,
    description:  '',
    targetValue:  0,
    currentValue: 0,
    unit:         'sessions',
    completed:    false,
    daysEstimate: 0,
  };
}

/**
 * Returns a blank CreatorGrowthPlan with all fields set to safe empty defaults.
 * Used as initial context state before the first generation run.
 *
 * @returns {CreatorGrowthPlan}
 */
export function createBlankGrowthPlan() {
  return {
    generatedAt:      null,
    planTitle:        'Your Creator Growth Plan',
    horizonDays:      7,
    growthScore:      0,
    growthScoreDelta: 0,
    trajectory:       'steady',
    weeklyTarget:     3,
    milestones:       [],
    skillGaps:        [],
    growthInsight:    'Start shooting to build your personalised growth plan.',
    nextLevelLabel:   'Emerging Creator',
    xpToNextLevel:    100,
    currentXP:        0,
    confidence:       0,
  };
}

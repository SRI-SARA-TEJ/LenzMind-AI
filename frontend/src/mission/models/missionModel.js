/**
 * mission/models/missionModel.js — Creator Mission Model
 *
 * Module 10.2 — Realis Creator Mission Engine
 *
 * Defines the canonical shape of a CreatorMission and its task entries, and
 * provides factory functions for safe blank instances used as initial context
 * state before the first generation run.
 *
 * ── Typedefs ───────────────────────────────────────────────────────────────────
 *
 * @typedef {'easy'|'medium'|'hard'|'epic'} MissionDifficulty
 *
 * @typedef {object} MissionTask
 * @property {string}  id          Unique task identifier (e.g. 'task-0')
 * @property {string}  label       Short task description shown in the UI
 * @property {boolean} completed   Whether the creator has completed this task
 * @property {string}  [icon]      Optional emoji / icon character
 *
 * @typedef {object} MissionReward
 * @property {string} label        Display label (e.g. "+12 Quality Points")
 * @property {string} icon         Emoji icon for the reward
 * @property {string} type         Reward category: 'quality'|'streak'|'skill'|'badge'
 *
 * @typedef {object} CreatorMission
 * @property {string}            generatedAt         ISO timestamp
 * @property {string}            missionTitle        Short punchy mission title
 * @property {MissionTask[]}     tasks               Ordered list of tasks to complete
 * @property {number}            estimatedImprovement Expected quality score gain (0–30)
 * @property {MissionDifficulty} difficulty          Overall difficulty rating
 * @property {number}            completionProgress  0–100 percentage of tasks completed
 * @property {MissionReward}     reward              What the creator earns on completion
 * @property {string[]}          reasoning           Why this mission was assigned (1–3 strings)
 */

// ── Difficulty meta ────────────────────────────────────────────────────────────

/** Visual metadata keyed by difficulty tier. */
export const DIFFICULTY_META = {
  easy:   { label: 'Easy',   color: '#4ade80', stars: 1 },
  medium: { label: 'Medium', color: '#fcd34d', stars: 2 },
  hard:   { label: 'Hard',   color: '#f87171', stars: 3 },
  epic:   { label: 'Epic',   color: '#a78bfa', stars: 4 },
};

// ── Factories ─────────────────────────────────────────────────────────────────

/**
 * Returns a blank MissionTask with safe defaults.
 * @param {string} id
 * @param {string} label
 * @returns {MissionTask}
 */
export function createBlankTask(id = 'task-0', label = '') {
  return { id, label, completed: false, icon: '◻️' };
}

/**
 * Returns a blank MissionReward with safe defaults.
 * @returns {MissionReward}
 */
export function createBlankReward() {
  return {
    label: 'Complete your first mission',
    icon:  '⭐',
    type:  'quality',
  };
}

/**
 * Returns a blank CreatorMission with all fields set to their safe empty
 * defaults.  Used as initial context state before the first generation.
 *
 * @returns {CreatorMission}
 */
export function createBlankMission() {
  return {
    generatedAt:          null,
    missionTitle:         'Your First Mission',
    tasks:                [],
    estimatedImprovement: 0,
    difficulty:           'easy',
    completionProgress:   0,
    reward:               createBlankReward(),
    reasoning:            ['Capture your first session to unlock a personalised mission.'],
  };
}

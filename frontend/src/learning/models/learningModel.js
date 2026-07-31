/**
 * learning/models/learningModel.js — Creator Learning Profile Model
 *
 * Module 8.9 — Creator Learning Intelligence
 *
 * Defines the canonical shape of a CreatorLearningProfile and provides
 * a factory function that returns a safe blank instance.
 *
 * All fields default to null / empty structures — no hard-coded content.
 *
 * ── Typedefs ───────────────────────────────────────────────────────────────────
 *
 * @typedef {object} WorkflowSignal
 * @property {string}      workflowName
 * @property {string|null} workflowId
 * @property {number}      count
 * @property {number}      score   0–100
 *
 * @typedef {object} SceneSignal
 * @property {string} scene
 * @property {number} count
 * @property {number} pct  0–100
 *
 * @typedef {object} CameraSettingPreferences
 * @property {string|null}  resolution
 * @property {number|null}  fps
 * @property {boolean|null} hdr
 * @property {string|null}  flash
 * @property {string|null}  stabilization
 * @property {string|null}  focusMode
 * @property {string|null}  whiteBalance
 * @property {number}       confidence  0–100
 *
 * @typedef {object} RecommendationBehaviour
 * @property {number} acceptanceRate  0–100
 * @property {number} totalOffered
 * @property {number} totalAccepted
 * @property {'improving'|'declining'|'stable'} trend
 *
 * @typedef {object} ShootingHabits
 * @property {string|null} favoriteStyle
 * @property {string|null} favoriteMovement
 * @property {number}      avgSessionMinutes
 * @property {number}      uniqueProjects
 * @property {number|null} shootEditRatio
 *
 * @typedef {object} CaptureTimingPreferences
 * @property {number|null} preferredHour
 * @property {string|null} preferredDayOfWeek
 * @property {string|null} mostActiveWindow   'Morning'|'Afternoon'|'Evening'|'Night'
 * @property {number}      capturesLast7
 * @property {number}      capturesLast30
 *
 * @typedef {object} ConfidenceTrend
 * @property {number}                           current
 * @property {number}                           previous
 * @property {'improving'|'declining'|'stable'} direction
 * @property {number}                           delta
 *
 * @typedef {object} PersonalizedPresetHint
 * @property {string} workflowHint
 * @property {object} settings
 *
 * @typedef {object} CreatorLearningProfile
 * @property {string}                      computedAt              ISO timestamp
 * @property {WorkflowSignal[]}            preferredWorkflows
 * @property {SceneSignal[]}               preferredScenes
 * @property {CameraSettingPreferences|null} cameraSettingPreferences
 * @property {RecommendationBehaviour}     recommendationBehaviour
 * @property {ShootingHabits}              shootingHabits
 * @property {CaptureTimingPreferences}    captureTimingPreferences
 * @property {ConfidenceTrend}             confidenceTrend
 * @property {number}                      learningConfidence      0–100
 * @property {string}                      aiStyleProfile
 * @property {string|null}                 predictedNextWorkflow
 * @property {PersonalizedPresetHint|null} personalizedPresetHint
 */

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Returns a blank CreatorLearningProfile with all fields set to their
 * safe empty defaults.  Used as the initial state of CreatorLearningContext
 * before the first computation runs.
 *
 * @returns {CreatorLearningProfile}
 */
export function createBlankLearningProfile() {
  return {
    computedAt: null,

    preferredWorkflows:       [],
    preferredScenes:          [],
    cameraSettingPreferences: null,

    recommendationBehaviour: {
      acceptanceRate: 0,
      totalOffered:   0,
      totalAccepted:  0,
      trend:          'stable',
    },

    shootingHabits: {
      favoriteStyle:      null,
      favoriteMovement:   null,
      avgSessionMinutes:  0,
      uniqueProjects:     0,
      shootEditRatio:     null,
    },

    captureTimingPreferences: {
      preferredHour:      null,
      preferredDayOfWeek: null,
      mostActiveWindow:   null,
      capturesLast7:      0,
      capturesLast30:     0,
    },

    confidenceTrend: {
      current:   0,
      previous:  0,
      direction: 'stable',
      delta:     0,
    },

    learningConfidence:    0,
    aiStyleProfile:        'Not enough data to build a style profile yet.',
    predictedNextWorkflow: null,
    personalizedPresetHint: null,
  };
}

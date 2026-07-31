/**
 * director/models/directorModel.js
 *
 * Canonical shape of all Director Mode objects:
 *   CinematicStep    — one guided step in AI Guided mode
 *   CinematicTemplate — full template (collection of steps)
 *   ShotMarker       — user-created shot in Create My Own mode
 *   DirectorMap      — completed ordered collection of ShotMarkers
 *
 * Future AI integration points are marked with // [AI_FUTURE]
 */

// ── Cinematic techniques ──────────────────────────────────────────────────────
export const CINEMATIC_TECHNIQUES = [
  'Wide Shot',
  'Medium Shot',
  'Close-up',
  'Tracking Shot',
  'Push In',
  'Pull Out',
  'Pan',
  'Tilt',
  'Orbit',
  'Reveal Shot',
  'Whip Pan',
  'Barrel Roll',
  'Static Shot',
  'Match Cut',
  'Dynamic Transition',
  'Kinetic Transition',
  'Motion Match Cut',
  'Dutch Angle',
  'Over the Shoulder',
  'Bird\'s Eye',
  'Low Angle',
];

// ── Camera movements ──────────────────────────────────────────────────────────
export const CAMERA_MOVEMENTS = [
  'Stationary',
  'Slow Walk',
  'Fast Walk',
  'Side Slide',
  'Push Forward',
  'Pull Back',
  'Pan Left',
  'Pan Right',
  'Tilt Up',
  'Tilt Down',
  'Orbit CW',
  'Orbit CCW',
  'Whip Right',
  'Whip Left',
  'Handheld',
  'Crane Up',
];

// ── Transitions ───────────────────────────────────────────────────────────────
export const TRANSITIONS = [
  'Cut',
  'Whip Pan',
  'Match Cut',
  'Motion Blur',
  'Fade to Black',
  'Cross Dissolve',
  'Spin Transition',
  'Zoom Blur',
  'Natural Cut',
  'L-Cut',
  'J-Cut',
];

// ── Difficulty levels ─────────────────────────────────────────────────────────
export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

/**
 * @typedef {Object} CinematicStep
 * @property {string}   id
 * @property {number}   order
 * @property {string}   technique        — from CINEMATIC_TECHNIQUES
 * @property {string}   title            — e.g. "Wide Establishing Shot"
 * @property {string}   instruction      — beginner-friendly main instruction
 * @property {string[]} tips             — short tip bullets
 * @property {string}   whyItWorks       — single sentence explaining the technique
 * @property {number}   durationSeconds  — estimated clip duration
 * @property {string}   movement         — camera movement cue
 * @property {string}   transition       — transition to next step
 * @property {string}   difficulty       — 'Beginner' | 'Intermediate' | 'Advanced'
 * @property {string}   motionIcon       — emoji representing the motion
 */

/**
 * @typedef {Object} CinematicTemplate
 * @property {string}           id
 * @property {string}           name
 * @property {string}           category     — matches project categories
 * @property {string}           icon
 * @property {string}           coverColor
 * @property {string}           description
 * @property {string}           targetAudience
 * @property {string}           estimatedDuration  — e.g. "2–3 minutes"
 * @property {string[]}         tags
 * @property {CinematicStep[]}  steps
 * @property {string}           aiInsight    — [AI_FUTURE] placeholder
 */

/**
 * @typedef {Object} ShotMarker
 * @property {string}   id
 * @property {number}   order
 * @property {string}   name
 * @property {string}   technique
 * @property {string}   movement
 * @property {string}   transition
 * @property {string}   notes
 * @property {number}   durationSeconds
 * @property {string}   difficulty
 * @property {string[]} tags
 * @property {string}   createdAt
 */

/**
 * @typedef {Object} DirectorMap
 * @property {string}        id
 * @property {string}        name
 * @property {string}        description
 * @property {ShotMarker[]}  shots
 * @property {string|null}   workflowId      — workflow this map is saved into
 * @property {string|null}   workflowName
 * @property {string|null}   projectId
 * @property {string}        createdAt
 * @property {string}        updatedAt
 * @property {Object}        aiAnalysis      — [AI_FUTURE] placeholder
 * @property {Object}        creatorMemory   — [AI_FUTURE] placeholder
 */

/** Factory — creates a blank ShotMarker. */
export function createBlankShotMarker(order = 1) {
  return {
    id:              `sm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    order,
    name:            '',
    technique:       'Wide Shot',
    movement:        'Stationary',
    transition:      'Cut',
    notes:           '',
    durationSeconds: 5,
    difficulty:      'Beginner',
    tags:            [],
    createdAt:       new Date().toISOString(),
  };
}

/** Factory — creates a blank DirectorMap. */
export function createBlankDirectorMap(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id:           `dm-${Date.now()}`,
    name:         'My Director Map',
    description:  '',
    shots:        [],
    workflowId:   null,
    workflowName: null,
    projectId:    null,
    createdAt:    now,
    updatedAt:    now,
    // [AI_FUTURE] — These will be populated by IBM watsonx.ai analysis
    aiAnalysis: {
      cinematicScore:  null,
      flowRating:      null,
      suggestions:     [],
      detectedStyle:   null,
    },
    // [AI_FUTURE] — Creator Memory Agent will build this over time
    creatorMemory: {
      preferredTechniques: [],
      learningProgress:    {},
      sessionsCompleted:   0,
    },
    ...overrides,
  };
}

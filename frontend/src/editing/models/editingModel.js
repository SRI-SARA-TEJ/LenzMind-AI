/**
 * editing/models/editingModel.js
 *
 * Canonical shape of all AI Editing Intelligence objects:
 *
 *   EditSuggestion   — one AI-detected improvement for a clip / project
 *   AnalysisResult   — the full set of suggestions for one analysis run
 *   EditSession      — a user's active editing session (analysis + applied edits)
 *   ExportSettings   — settings used when exporting the finished video
 *   EditHistoryEntry — audit record of an applied or dismissed edit
 *
 * Future AI integration points are marked with // [AI_FUTURE]
 */

// ── Edit categories ───────────────────────────────────────────────────────────
export const EDIT_CATEGORIES = [
  'Visual',
  'Audio',
  'Motion',
  'Text',
  'Export',
  'Colour',
];

// ── Edit types ────────────────────────────────────────────────────────────────
export const EDIT_TYPES = [
  'Lighting Fix',
  'Noise Reduction',
  'Stabilization',
  'Audio Cleanup',
  'Caption Generation',
  'Thumbnail Suggestion',
  'Color Grading',
  'Object Blur',
  'Face Blur',
  'White Balance',
  'Exposure',
  'Motion Stabilization',
  'Voice Enhancement',
  'Trim Beginning',
  'Trim Ending',
  'Background Music',
  'Subtitle Generation',
  'Scene Cut Detection',
  'Highlight Reel',
  'Slow Motion',
];

// ── Confidence levels ─────────────────────────────────────────────────────────
export const CONFIDENCE_LEVELS = ['Low', 'Medium', 'High', 'Very High'];

// ── Severity levels ───────────────────────────────────────────────────────────
export const SEVERITY_LEVELS = ['Minor', 'Moderate', 'Significant', 'Critical'];

// ── Analysis states ───────────────────────────────────────────────────────────
export const ANALYSIS_STATES = ['idle', 'scanning', 'analysing', 'complete', 'error'];

// ── Session states ────────────────────────────────────────────────────────────
export const SESSION_STATES = ['idle', 'analysing', 'reviewing', 'applying', 'exporting', 'complete'];

// ── Export formats ────────────────────────────────────────────────────────────
export const EXPORT_FORMATS = ['MP4', 'MOV', 'WebM', 'GIF'];

// ── Export resolutions ────────────────────────────────────────────────────────
export const EXPORT_RESOLUTIONS = ['480p', '720p', '1080p', '4K', '8K'];

// ── Export quality presets ────────────────────────────────────────────────────
export const QUALITY_PRESETS = ['Draft', 'Standard', 'High', 'Maximum'];

// ── Platform targets ──────────────────────────────────────────────────────────
export const PLATFORM_TARGETS = [
  'YouTube',
  'Instagram Reels',
  'TikTok',
  'Twitter / X',
  'LinkedIn',
  'Facebook',
  'Podcast',
  'Web',
  'Custom',
];

// ── Severity → colour map ─────────────────────────────────────────────────────
export const SEVERITY_COLORS = {
  Minor:       { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80',  border: 'rgba(34,197,94,0.25)' },
  Moderate:    { bg: 'rgba(245,158,11,0.12)',  text: '#fcd34d',  border: 'rgba(245,158,11,0.25)' },
  Significant: { bg: 'rgba(239,68,68,0.12)',   text: '#f87171',  border: 'rgba(239,68,68,0.25)' },
  Critical:    { bg: 'rgba(220,38,38,0.18)',   text: '#ef4444',  border: 'rgba(220,38,38,0.35)' },
};

// ── Confidence → colour map ───────────────────────────────────────────────────
export const CONFIDENCE_COLORS = {
  Low:       { text: '#94a3b8', bar: '#475569' },
  Medium:    { text: '#fcd34d', bar: '#f59e0b' },
  High:      { text: '#86efac', bar: '#22c55e' },
  'Very High': { text: '#a5b4fc', bar: '#6366f1' },
};

// ── Category → icon map ───────────────────────────────────────────────────────
export const CATEGORY_ICONS = {
  Visual:  '👁',
  Audio:   '🎙',
  Motion:  '🎥',
  Text:    '📝',
  Export:  '📤',
  Colour:  '🎨',
};

// ── Edit type → category map ──────────────────────────────────────────────────
export const EDIT_TYPE_CATEGORY = {
  'Lighting Fix':        'Visual',
  'Exposure':            'Visual',
  'White Balance':       'Colour',
  'Color Grading':       'Colour',
  'Object Blur':         'Visual',
  'Face Blur':           'Visual',
  'Thumbnail Suggestion':'Visual',
  'Noise Reduction':     'Audio',
  'Audio Cleanup':       'Audio',
  'Voice Enhancement':   'Audio',
  'Background Music':    'Audio',
  'Stabilization':       'Motion',
  'Motion Stabilization':'Motion',
  'Slow Motion':         'Motion',
  'Scene Cut Detection': 'Motion',
  'Caption Generation':  'Text',
  'Subtitle Generation': 'Text',
  'Highlight Reel':      'Text',
  'Trim Beginning':      'Motion',
  'Trim Ending':         'Motion',
};

// ─────────────────────────────────────────────────────────────────────────────
// JSDoc Typedefs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} EditSuggestion
 * @property {string}   id
 * @property {string}   type          — from EDIT_TYPES
 * @property {string}   category      — from EDIT_CATEGORIES
 * @property {string}   title         — short display title
 * @property {string}   description   — what was detected and what will be fixed
 * @property {string}   reason        — why this edit improves the content
 * @property {string}   severity      — 'Minor' | 'Moderate' | 'Significant' | 'Critical'
 * @property {string}   confidence    — 'Low' | 'Medium' | 'High' | 'Very High'
 * @property {number}   confidenceScore — 0–100
 * @property {string}   status        — 'pending' | 'applied' | 'dismissed' | 'applying'
 * @property {boolean}  autoApplicable — can be applied without user input
 * @property {Object}   params        — edit parameters (type-specific) [AI_FUTURE]
 * @property {number|null} clipStart  — seconds — null = whole clip
 * @property {number|null} clipEnd    — seconds
 * @property {string}   icon
 * @property {string}   beforePreview — [AI_FUTURE] preview description
 * @property {string}   afterPreview  — [AI_FUTURE] preview description
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {string}           id
 * @property {string}           projectId
 * @property {string}           projectTitle
 * @property {string}           state        — from ANALYSIS_STATES
 * @property {number}           progress     — 0–100
 * @property {string}           startedAt
 * @property {string|null}      completedAt
 * @property {EditSuggestion[]} suggestions
 * @property {Object}           scores       — [AI_FUTURE] overall quality scores
 * @property {string}           aiSummary    — [AI_FUTURE] narrative summary
 * @property {string|null}      errorMessage
 */

/**
 * @typedef {Object} EditHistoryEntry
 * @property {string} id
 * @property {string} suggestionId
 * @property {string} type
 * @property {string} title
 * @property {string} action   — 'applied' | 'dismissed' | 'undone'
 * @property {string} timestamp
 */

/**
 * @typedef {Object} ExportSettings
 * @property {string}   format       — from EXPORT_FORMATS
 * @property {string}   resolution   — from EXPORT_RESOLUTIONS
 * @property {string}   quality      — from QUALITY_PRESETS
 * @property {number}   fps          — 24 | 30 | 60
 * @property {boolean}  includeAudio
 * @property {boolean}  includeCaptions
 * @property {string}   platform     — from PLATFORM_TARGETS
 * @property {boolean}  optimizeForPlatform
 * @property {string}   filename
 */

/**
 * @typedef {Object} EditSession
 * @property {string}           id
 * @property {string}           projectId
 * @property {string}           projectTitle
 * @property {string}           state         — from SESSION_STATES
 * @property {AnalysisResult|null} analysis
 * @property {string[]}         appliedIds    — IDs of applied suggestions
 * @property {string[]}         dismissedIds  — IDs of dismissed suggestions
 * @property {EditHistoryEntry[]} history
 * @property {number}           editProgress  — 0–100 (applied / total)
 * @property {ExportSettings}   exportSettings
 * @property {string}           createdAt
 * @property {string}           updatedAt
 */

// ─────────────────────────────────────────────────────────────────────────────
// Factory functions
// ─────────────────────────────────────────────────────────────────────────────

/** Factory — creates a blank EditSuggestion. */
export function createBlankSuggestion(overrides = {}) {
  return {
    id:               `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type:             'Lighting Fix',
    category:         'Visual',
    title:            '',
    description:      '',
    reason:           '',
    severity:         'Moderate',
    confidence:       'High',
    confidenceScore:  75,
    status:           'pending',
    autoApplicable:   true,
    params:           {},      // [AI_FUTURE] AI-populated edit parameters
    clipStart:        null,
    clipEnd:          null,
    icon:             '✨',
    beforePreview:    '',      // [AI_FUTURE] before-state description
    afterPreview:     '',      // [AI_FUTURE] after-state description
    ...overrides,
  };
}

/** Factory — creates default ExportSettings. */
export function createDefaultExportSettings(overrides = {}) {
  return {
    format:              'MP4',
    resolution:          '1080p',
    quality:             'High',
    fps:                 30,
    includeAudio:        true,
    includeCaptions:     false,
    platform:            'YouTube',
    optimizeForPlatform: true,
    filename:            'export',
    ...overrides,
  };
}

/** Factory — creates a blank AnalysisResult. */
export function createBlankAnalysis(projectId = null, projectTitle = '') {
  return {
    id:           `analysis-${Date.now()}`,
    projectId,
    projectTitle,
    state:        'idle',
    progress:     0,
    startedAt:    new Date().toISOString(),
    completedAt:  null,
    suggestions:  [],
    // [AI_FUTURE] — Populated by IBM watsonx.ai vision and audio models
    scores: {
      overall:        null,
      visual:         null,
      audio:          null,
      pacing:         null,
      colourGrade:    null,
      stability:      null,
    },
    aiSummary:    '', // [AI_FUTURE] — Natural language summary from watsonx.ai
    errorMessage: null,
  };
}

/** Factory — creates a blank EditSession. */
export function createBlankEditSession(projectId = null, projectTitle = '') {
  const now = new Date().toISOString();
  return {
    id:             `session-${Date.now()}`,
    projectId,
    projectTitle,
    state:          'idle',
    analysis:       null,
    appliedIds:     [],
    dismissedIds:   [],
    history:        [],
    editProgress:   0,
    exportSettings: createDefaultExportSettings(),
    createdAt:      now,
    updatedAt:      now,
  };
}

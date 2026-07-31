/**
 * memory/models/creatorMemoryModel.js
 *
 * Canonical shape of all Creator Memory Intelligence objects.
 *
 * Typedefs:
 *   CreatorProfile        — who the creator is and their overall statistics
 *   MemorySession         — one completed editing/shooting/workflow session
 *   MemoryPreference      — a specific learned creator preference
 *   MemoryPattern         — a recurring behavioural pattern detected by AI
 *   MemoryInsight         — an AI-generated actionable insight
 *   CreatorMilestone      — an achievement or progression milestone
 *   FavoriteWorkflow      — a frequently used workflow with usage stats
 *   FavoriteEditingStyle  — a preferred editing style / preset
 *   FavoriteCameraStyle   — a preferred camera movement or technique
 *   MemoryStatistics      — aggregate numerical summary across all sessions
 *
 * Future AI integration points are marked with // [AI_FUTURE]
 */

// ── Session types ──────────────────────────────────────────────────────────────
export const SESSION_TYPES = [
  'Editing',
  'Shooting',
  'Workflow',
  'Export',
  'Review',
  'Director',
];

// ── Preference categories ─────────────────────────────────────────────────────
export const PREFERENCE_CATEGORIES = [
  'Export',
  'Editing',
  'Shooting',
  'Audio',
  'Colour',
  'Motion',
  'Platform',
  'Workflow',
];

// ── Pattern types ─────────────────────────────────────────────────────────────
export const PATTERN_TYPES = [
  'Style',
  'Behaviour',
  'Timing',
  'Quality',
  'Platform',
  'Genre',
];

// ── Insight types ─────────────────────────────────────────────────────────────
export const INSIGHT_TYPES = [
  'Quality Tip',
  'Efficiency',
  'Style Match',
  'Platform Fit',
  'Workflow Recommendation',
  'Milestone',
  'Trend',
];

// ── Insight priorities ────────────────────────────────────────────────────────
export const INSIGHT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// ── Milestone types ───────────────────────────────────────────────────────────
export const MILESTONE_TYPES = [
  'First Session',
  'Quality Achievement',
  'Consistency',
  'Volume',
  'Style Mastery',
  'Platform Expert',
  'AI Collaboration',
];

// ── Camera movement preferences ───────────────────────────────────────────────
export const CAMERA_MOVEMENTS = [
  'Stationary',
  'Slow Walk',
  'Tracking Shot',
  'Push In',
  'Pull Out',
  'Pan',
  'Orbit',
  'Handheld',
  'Whip Pan',
  'Crane Up',
];

// ── Shooting styles ───────────────────────────────────────────────────────────
export const SHOOTING_STYLES = [
  'Cinematic',
  'Documentary',
  'Run-and-Gun',
  'Studio',
  'Vlog',
  'Short-Form',
  'Long-Form',
  'Interview',
];

// ── Export formats ────────────────────────────────────────────────────────────
export const EXPORT_FORMATS = ['MP4', 'MOV', 'WebM', 'GIF'];

// ── Platforms ─────────────────────────────────────────────────────────────────
export const PLATFORMS = [
  'YouTube',
  'Instagram Reels',
  'TikTok',
  'LinkedIn',
  'Facebook',
  'Twitter / X',
  'Podcast',
  'Web',
];

// ── Memory load states ────────────────────────────────────────────────────────
export const MEMORY_STATES = ['idle', 'loading', 'loaded', 'error'];

// ─────────────────────────────────────────────────────────────────────────────
// JSDoc Typedefs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CreatorProfile
 * @property {string}   id
 * @property {string}   name                 — creator display name
 * @property {string}   handle               — @handle
 * @property {string}   avatarInitials        — 1–2 char initials for avatar placeholder
 * @property {string}   bio                  — short creator bio
 * @property {string[]} primaryGenres         — e.g. ['Travel', 'Lifestyle']
 * @property {string[]} targetPlatforms       — from PLATFORMS
 * @property {string}   preferredStyle        — from SHOOTING_STYLES
 * @property {number}   aiConfidenceScore     — 0–100 how well AI knows this creator [AI_FUTURE]
 * @property {string}   memberSince
 * @property {string}   lastActiveAt
 * @property {MemoryStatistics} statistics
 */

/**
 * @typedef {Object} MemorySession
 * @property {string}   id
 * @property {string}   type               — from SESSION_TYPES
 * @property {string}   title
 * @property {string}   projectId          — linked project (nullable)
 * @property {string}   projectTitle
 * @property {string}   workflowId         — linked workflow (nullable)
 * @property {string}   workflowName
 * @property {number}   durationMinutes     — session length
 * @property {number}   qualityScoreBefore  — 0–100 (nullable if no analysis)
 * @property {number}   qualityScoreAfter   — 0–100
 * @property {number}   improvementDelta    — scoreAfter - scoreBefore
 * @property {number}   aiRecommendations   — total suggestions offered
 * @property {number}   aiAccepted          — suggestions the creator accepted
 * @property {string}   exportPlatform      — from PLATFORMS
 * @property {string}   exportFormat        — from EXPORT_FORMATS
 * @property {string}   exportResolution    — e.g. '1080p'
 * @property {string[]} editTypesApplied    — edit types used
 * @property {string[]} cameraMovements     — movements used in this shoot
 * @property {string}   shootingStyle       — from SHOOTING_STYLES
 * @property {string}   notes               — free-text session notes
 * @property {string}   createdAt
 * @property {string}   completedAt
 */

/**
 * @typedef {Object} MemoryPreference
 * @property {string}   id
 * @property {string}   category            — from PREFERENCE_CATEGORIES
 * @property {string}   key                 — machine-readable key
 * @property {string}   label               — human-readable label
 * @property {string}   value               — current preferred value
 * @property {string[]} alternatives        — other values tried
 * @property {number}   usageCount          — how many times used
 * @property {number}   confidenceScore     — AI confidence 0–100 [AI_FUTURE]
 * @property {boolean}  aiLearned           — true = AI detected; false = user set
 * @property {string}   learnedAt
 * @property {string}   lastUsedAt
 */

/**
 * @typedef {Object} MemoryPattern
 * @property {string}   id
 * @property {string}   type                — from PATTERN_TYPES
 * @property {string}   title
 * @property {string}   description         — what pattern was detected
 * @property {number}   occurrences         — how many times detected
 * @property {number}   confidenceScore     — 0–100 [AI_FUTURE]
 * @property {boolean}  isActive            — still occurring or historical
 * @property {string[]} relatedSessionIds
 * @property {string}   detectedAt
 * @property {string}   lastSeenAt
 */

/**
 * @typedef {Object} MemoryInsight
 * @property {string}   id
 * @property {string}   type                — from INSIGHT_TYPES
 * @property {string}   priority            — from INSIGHT_PRIORITIES
 * @property {string}   title
 * @property {string}   body                — detailed insight text
 * @property {string}   actionLabel         — CTA button label (optional)
 * @property {string}   actionRoute         — internal nav target (optional)
 * @property {boolean}  dismissed
 * @property {string}   generatedAt
 * @property {string|null} expiresAt
 */

/**
 * @typedef {Object} CreatorMilestone
 * @property {string}   id
 * @property {string}   type                — from MILESTONE_TYPES
 * @property {string}   title
 * @property {string}   description
 * @property {string}   icon
 * @property {boolean}  achieved
 * @property {string|null} achievedAt
 * @property {number}   progress            — 0–100 toward next milestone
 * @property {number}   targetValue         — e.g. 10 sessions, 80 quality score
 * @property {number}   currentValue
 */

/**
 * @typedef {Object} FavoriteWorkflow
 * @property {string}   workflowId
 * @property {string}   name
 * @property {string}   category
 * @property {string}   icon
 * @property {number}   usageCount
 * @property {number}   averageQualityGain
 * @property {string}   lastUsedAt
 * @property {string[]} associatedTags
 */

/**
 * @typedef {Object} FavoriteEditingStyle
 * @property {string}   id
 * @property {string}   label               — e.g. 'Cinematic Colour Grade'
 * @property {string}   category            — from PREFERENCE_CATEGORIES
 * @property {string[]} editTypes           — from EDIT_TYPES
 * @property {number}   usageCount
 * @property {number}   averageQualityScore
 * @property {string}   lastAppliedAt
 */

/**
 * @typedef {Object} FavoriteCameraStyle
 * @property {string}   id
 * @property {string}   movement            — from CAMERA_MOVEMENTS
 * @property {string}   technique           — e.g. 'Close-up'
 * @property {string}   shootingStyle       — from SHOOTING_STYLES
 * @property {number}   usageCount
 * @property {string[]} associatedGenres
 * @property {string}   lastUsedAt
 */

/**
 * @typedef {Object} MemoryStatistics
 * @property {number}   totalSessions
 * @property {number}   totalEditingSessions
 * @property {number}   totalShootingSessions
 * @property {number}   totalMinutesEdited
 * @property {number}   totalAIRecommendations
 * @property {number}   totalAIAccepted
 * @property {number}   aiAcceptanceRate        — 0–100 (%)
 * @property {number}   averageQualityScore
 * @property {number}   averageQualityImprovement
 * @property {number}   bestQualityScore
 * @property {string}   favoriteExportFormat
 * @property {string}   favoritePlatform
 * @property {string}   favoriteEditingType
 * @property {string}   favoriteShootingStyle
 * @property {string}   mostUsedWorkflowId
 * @property {string}   mostUsedWorkflowName
 * @property {number}   currentStreak           — consecutive active days
 * @property {number}   longestStreak
 */

// ─────────────────────────────────────────────────────────────────────────────
// Factory functions
// ─────────────────────────────────────────────────────────────────────────────

/** Creates a blank MemorySession with sensible defaults. */
export function createBlankMemorySession(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id:                   `mem-sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type:                 'Editing',
    title:                'Untitled Session',
    projectId:            null,
    projectTitle:         '',
    workflowId:           null,
    workflowName:         '',
    durationMinutes:      0,
    qualityScoreBefore:   null,
    qualityScoreAfter:    null,
    improvementDelta:     0,
    aiRecommendations:    0,
    aiAccepted:           0,
    exportPlatform:       'YouTube',
    exportFormat:         'MP4',
    exportResolution:     '1080p',
    editTypesApplied:     [],
    cameraMovements:      [],
    shootingStyle:        'Cinematic',
    notes:                '',
    createdAt:            now,
    completedAt:          now,
    ...overrides,
  };
}

/** Creates a blank MemoryInsight. */
export function createBlankInsight(overrides = {}) {
  return {
    id:           `insight-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type:         'Quality Tip',
    priority:     'Medium',
    title:        '',
    body:         '',
    actionLabel:  null,
    actionRoute:  null,
    dismissed:    false,
    generatedAt:  new Date().toISOString(),
    expiresAt:    null,
    ...overrides,
  };
}

/** Creates a blank MemoryPreference. */
export function createBlankPreference(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id:              `pref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category:        'Export',
    key:             '',
    label:           '',
    value:           '',
    alternatives:    [],
    usageCount:      1,
    confidenceScore: 50,   // [AI_FUTURE]
    aiLearned:       true,
    learnedAt:       now,
    lastUsedAt:      now,
    ...overrides,
  };
}

/** Creates a blank CreatorMilestone. */
export function createBlankMilestone(overrides = {}) {
  return {
    id:            `milestone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type:          'Volume',
    title:         '',
    description:   '',
    icon:          '🏆',
    achieved:      false,
    achievedAt:    null,
    progress:      0,
    targetValue:   10,
    currentValue:  0,
    ...overrides,
  };
}

/** Creates a default MemoryStatistics object. */
export function createBlankStatistics(overrides = {}) {
  return {
    totalSessions:               0,
    totalEditingSessions:        0,
    totalShootingSessions:       0,
    totalMinutesEdited:          0,
    totalAIRecommendations:      0,
    totalAIAccepted:             0,
    aiAcceptanceRate:            0,
    averageQualityScore:         0,
    averageQualityImprovement:   0,
    bestQualityScore:            0,
    favoriteExportFormat:        'MP4',
    favoritePlatform:            'YouTube',
    favoriteEditingType:         'Lighting Fix',
    favoriteShootingStyle:       'Cinematic',
    mostUsedWorkflowId:          null,
    mostUsedWorkflowName:        '',
    currentStreak:               0,
    longestStreak:               0,
    ...overrides,
  };
}

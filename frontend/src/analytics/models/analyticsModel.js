/**
 * analytics/models/analyticsModel.js
 *
 * Canonical shape of all Creator Analytics Intelligence objects.
 *
 * Typedefs:
 *   AnalyticsSession      — one data-sampled creator session (editing/shooting/workflow)
 *   QualityMetric         — a quality score data point over time
 *   PerformanceMetric     — a performance measurement (speed, efficiency, output)
 *   WorkflowMetric        — usage and quality stats for a specific workflow
 *   EditingMetric         — statistics for a specific edit type
 *   PlatformMetric        — per-platform export and quality data
 *   RecommendationMetric  — AI recommendation acceptance data point
 *   AnalyticsInsight      — an AI-generated analytics insight
 *   GrowthMetric          — creator growth over time (score, rank, improvement)
 *   AnalyticsStatistics   — aggregate summary across all analytics sessions
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

// ── Metric periods ────────────────────────────────────────────────────────────
export const METRIC_PERIODS = ['day', 'week', 'month', 'quarter', 'year'];

// ── Platform list ─────────────────────────────────────────────────────────────
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

// ── Export formats ────────────────────────────────────────────────────────────
export const EXPORT_FORMATS = ['MP4', 'MOV', 'WebM', 'GIF'];

// ── Insight priorities ────────────────────────────────────────────────────────
export const INSIGHT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// ── Insight categories ────────────────────────────────────────────────────────
export const INSIGHT_CATEGORIES = [
  'Quality',
  'Efficiency',
  'Growth',
  'Platform',
  'Workflow',
  'Editing',
  'AI Learning',
];

// ── Trend directions ──────────────────────────────────────────────────────────
export const TREND_DIRECTIONS = ['up', 'down', 'flat'];

// ── Content categories ────────────────────────────────────────────────────────
export const CONTENT_CATEGORIES = [
  'Travel',
  'Lifestyle',
  'Tech',
  'Short-Form',
  'Documentary',
  'Podcast',
  'Food',
  'Fitness',
  'Events',
  'Education',
];

// ─────────────────────────────────────────────────────────────────────────────
// JSDoc Typedefs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AnalyticsSession
 * @property {string}   id
 * @property {string}   type                  — from SESSION_TYPES
 * @property {string}   title
 * @property {string}   projectId
 * @property {string}   projectTitle
 * @property {string}   workflowId
 * @property {string}   workflowName
 * @property {string}   contentCategory       — from CONTENT_CATEGORIES
 * @property {number}   durationMinutes
 * @property {number|null} qualityScoreBefore  — 0–100
 * @property {number|null} qualityScoreAfter   — 0–100
 * @property {number}   improvementDelta       — scoreAfter - scoreBefore
 * @property {number}   aiRecommendations      — total suggestions offered
 * @property {number}   aiAccepted             — suggestions accepted
 * @property {number}   aiAcceptanceRate       — 0–100
 * @property {string}   exportPlatform         — from PLATFORMS
 * @property {string}   exportFormat           — from EXPORT_FORMATS
 * @property {string}   exportResolution       — e.g. '1080p'
 * @property {number}   estimatedTimeSavedMin  — minutes saved by AI
 * @property {string[]} editTypesApplied
 * @property {string[]} cameraMovements
 * @property {string}   shootingStyle
 * @property {string}   week                   — ISO week label e.g. '2024-W01'
 * @property {string}   month                  — e.g. '2024-01'
 * @property {string}   createdAt
 * @property {string}   completedAt
 */

/**
 * @typedef {Object} QualityMetric
 * @property {string}   id
 * @property {string}   date                  — ISO date string
 * @property {string}   week
 * @property {string}   month
 * @property {number}   score                 — 0–100
 * @property {number}   delta                 — change from previous period
 * @property {string}   sessionId
 * @property {string}   sessionTitle
 * @property {string}   contentCategory
 */

/**
 * @typedef {Object} PerformanceMetric
 * @property {string}   id
 * @property {string}   period                — from METRIC_PERIODS
 * @property {string}   periodLabel           — e.g. 'Week 12' or 'Mar 2024'
 * @property {number}   sessionsCount
 * @property {number}   totalMinutes
 * @property {number}   avgQualityScore
 * @property {number}   avgImprovementDelta
 * @property {number}   totalAIRecommendations
 * @property {number}   totalAIAccepted
 * @property {number}   aiAcceptanceRate
 * @property {number}   timeSavedMinutes
 * @property {string}   startDate
 * @property {string}   endDate
 */

/**
 * @typedef {Object} WorkflowMetric
 * @property {string}   workflowId
 * @property {string}   workflowName
 * @property {string}   category
 * @property {string}   icon
 * @property {number}   usageCount
 * @property {number}   avgQualityScore
 * @property {number}   avgImprovementDelta
 * @property {number}   totalAIAccepted
 * @property {string}   lastUsedAt
 * @property {string[]} associatedPlatforms
 */

/**
 * @typedef {Object} EditingMetric
 * @property {string}   editType              — e.g. 'Color Grading'
 * @property {string}   category              — e.g. 'Colour'
 * @property {number}   usageCount
 * @property {number}   avgQualityGain
 * @property {number}   acceptanceRate        — 0–100
 * @property {string}   lastUsedAt
 */

/**
 * @typedef {Object} PlatformMetric
 * @property {string}   platform              — from PLATFORMS
 * @property {number}   exportCount
 * @property {number}   avgQualityScore
 * @property {number}   avgImprovementDelta
 * @property {number}   aiOptimisationsApplied
 * @property {string}   favoriteFormat        — from EXPORT_FORMATS
 * @property {string}   favoriteResolution
 * @property {string}   lastExportedAt
 */

/**
 * @typedef {Object} RecommendationMetric
 * @property {string}   id
 * @property {string}   date
 * @property {string}   week
 * @property {string}   month
 * @property {number}   offered
 * @property {number}   accepted
 * @property {number}   dismissed
 * @property {number}   acceptanceRate        — 0–100
 * @property {string}   sessionId
 */

/**
 * @typedef {Object} AnalyticsInsight
 * @property {string}   id
 * @property {string}   category              — from INSIGHT_CATEGORIES
 * @property {string}   priority              — from INSIGHT_PRIORITIES
 * @property {string}   title
 * @property {string}   body
 * @property {number}   confidenceScore       — 0–100 [AI_FUTURE]
 * @property {string}   metric                — which metric triggered this insight
 * @property {number}   metricValue           — the metric value
 * @property {string}   trend                 — from TREND_DIRECTIONS
 * @property {boolean}  dismissed
 * @property {string}   generatedAt
 * @property {string|null} expiresAt
 */

/**
 * @typedef {Object} GrowthMetric
 * @property {string}   id
 * @property {string}   date
 * @property {string}   month
 * @property {number}   creatorScore          — 0–100 overall creator score
 * @property {number}   qualityScore          — 0–100
 * @property {number}   consistencyScore      — 0–100
 * @property {number}   aiCollaborationScore  — 0–100 [AI_FUTURE]
 * @property {number}   growthDelta           — change in creatorScore from prev period
 */

/**
 * @typedef {Object} AnalyticsStatistics
 * @property {number}   totalSessions
 * @property {number}   totalEditingSessions
 * @property {number}   totalShootingSessions
 * @property {number}   totalMinutes
 * @property {number}   totalTimeSavedMinutes
 * @property {number}   totalAIRecommendations
 * @property {number}   totalAIAccepted
 * @property {number}   overallAcceptanceRate
 * @property {number}   avgQualityScore
 * @property {number}   avgImprovementDelta
 * @property {number}   bestQualityScore
 * @property {number}   latestCreatorScore
 * @property {number}   creatorScoreGrowth
 * @property {string}   mostUsedWorkflowId
 * @property {string}   mostUsedWorkflowName
 * @property {string}   bestPerformingPlatform
 * @property {string}   favoriteExportFormat
 * @property {string}   favoriteContentCategory
 * @property {string}   weeklyTrend           — 'up' | 'down' | 'flat'
 * @property {number}   weeklyTrendPct        — % change week-over-week
 * @property {string}   monthlyTrend
 * @property {number}   monthlyTrendPct
 */

// ─────────────────────────────────────────────────────────────────────────────
// Factory functions
// ─────────────────────────────────────────────────────────────────────────────

/** Creates a blank AnalyticsSession. */
export function createBlankAnalyticsSession(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id:                    `as-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type:                  'Editing',
    title:                 'Untitled Session',
    projectId:             null,
    projectTitle:          '',
    workflowId:            null,
    workflowName:          '',
    contentCategory:       'Travel',
    durationMinutes:       0,
    qualityScoreBefore:    null,
    qualityScoreAfter:     null,
    improvementDelta:      0,
    aiRecommendations:     0,
    aiAccepted:            0,
    aiAcceptanceRate:      0,
    exportPlatform:        'YouTube',
    exportFormat:          'MP4',
    exportResolution:      '1080p',
    estimatedTimeSavedMin: 0,
    editTypesApplied:      [],
    cameraMovements:       [],
    shootingStyle:         'Cinematic',
    week:                  '',
    month:                 '',
    createdAt:             now,
    completedAt:           now,
    ...overrides,
  };
}

/** Creates a blank AnalyticsInsight. */
export function createBlankAnalyticsInsight(overrides = {}) {
  return {
    id:              `ai-ins-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category:        'Quality',
    priority:        'Medium',
    title:           '',
    body:            '',
    confidenceScore: 75,
    metric:          '',
    metricValue:     0,
    trend:           'flat',
    dismissed:       false,
    generatedAt:     new Date().toISOString(),
    expiresAt:       null,
    ...overrides,
  };
}

/** Creates a blank AnalyticsStatistics object. */
export function createBlankAnalyticsStatistics(overrides = {}) {
  return {
    totalSessions:            0,
    totalEditingSessions:     0,
    totalShootingSessions:    0,
    totalMinutes:             0,
    totalTimeSavedMinutes:    0,
    totalAIRecommendations:   0,
    totalAIAccepted:          0,
    overallAcceptanceRate:    0,
    avgQualityScore:          0,
    avgImprovementDelta:      0,
    bestQualityScore:         0,
    latestCreatorScore:       0,
    creatorScoreGrowth:       0,
    mostUsedWorkflowId:       null,
    mostUsedWorkflowName:     '',
    bestPerformingPlatform:   '',
    favoriteExportFormat:     'MP4',
    favoriteContentCategory:  'Travel',
    weeklyTrend:              'flat',
    weeklyTrendPct:           0,
    monthlyTrend:             'flat',
    monthlyTrendPct:          0,
    ...overrides,
  };
}

/** Creates a blank GrowthMetric. */
export function createBlankGrowthMetric(overrides = {}) {
  return {
    id:                   `gm-${Date.now()}`,
    date:                 new Date().toISOString(),
    month:                '',
    creatorScore:         0,
    qualityScore:         0,
    consistencyScore:     0,
    aiCollaborationScore: 0,
    growthDelta:          0,
    ...overrides,
  };
}

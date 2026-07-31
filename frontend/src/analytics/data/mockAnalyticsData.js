/**
 * analytics/data/mockAnalyticsData.js
 *
 * Realistic mock analytics data for IBM AI Creator OS — Module 7.
 *
 * Includes:
 *   MOCK_ANALYTICS_SESSIONS   — 40 creator sessions across 6 months
 *   MOCK_QUALITY_HISTORY      — 40 quality data points (one per session)
 *   MOCK_WEEKLY_PERFORMANCE   — 24 weeks of performance summaries
 *   MOCK_MONTHLY_PERFORMANCE  — 6 months of performance summaries
 *   MOCK_RECOMMENDATION_HISTORY — 40 recommendation data points
 *   MOCK_WORKFLOW_METRICS     — 6 workflow metric objects
 *   MOCK_PLATFORM_METRICS     — 6 platform metric objects
 *   MOCK_EDITING_METRICS      — 10 editing metric objects
 *   MOCK_GROWTH_HISTORY       — 6 monthly growth snapshots
 *   MOCK_ANALYTICS_INSIGHTS   — 8 AI-generated insights
 *   MOCK_ANALYTICS_STATISTICS — pre-computed aggregate stats
 *
 * No backend. No external calls.
 * [AI_FUTURE] — All data will eventually be computed by IBM watsonx.ai
 */

import {
  createBlankAnalyticsStatistics,
  createBlankGrowthMetric,
} from '../models/analyticsModel';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function isoWeek(isoStr) {
  const d = new Date(isoStr);
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function isoMonth(isoStr) {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_ANALYTICS_SESSIONS — 40 sessions over ~6 months
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_RAW = [
  // days ago, type, title, project, workflow, category, dur, qBefore, qAfter, aiRec, aiAcc, platform, format, res, timeSaved, edits, cam, style
  [1,   'Editing',  'Kyoto Temple Series — Final Cut',        'Japan Travel 2024',       'Travel Vlog Master',   'Travel',     68, 62, 91, 18, 16, 'YouTube',         'MP4', '4K',   22, ['Color Grading','Stabilization','Audio Cleanup','Subtitle Generation'],                ['Tracking Shot','Push In'],       'Cinematic'],
  [3,   'Editing',  'Shibuya Reel Cut',                       'Japan Travel 2024',       'Short-Form Reel',      'Short-Form', 22, 70, 88, 11, 10, 'Instagram Reels', 'MP4', '1080p',12, ['Color Grading','Trim Beginning','Audio Cleanup'],                                      ['Handheld','Whip Pan'],           'Run-and-Gun'],
  [5,   'Shooting', 'Mt Fuji Sunrise Shoot',                  'Japan Travel 2024',       'Travel Vlog Master',   'Travel',     95, null,82, 7,  6,  'YouTube',         'MP4', '4K',   8,  [],                                                                                      ['Stationary','Pan','Tilt Up'],    'Cinematic'],
  [8,   'Editing',  'Productivity Setup Tour',                'Tech Desk Review',        'Product Showcase',     'Tech',       41, 55, 84, 20, 17, 'YouTube',         'MP4', '1080p',18, ['Lighting Fix','White Balance','Noise Reduction','Caption Generation'],                  ['Stationary','Push In'],          'Studio'],
  [10,  'Editing',  'Lisbon Food Tour Edit',                  'Portugal Travel Series',  'Travel Vlog Master',   'Travel',     55, 58, 83, 14, 12, 'YouTube',         'MP4', '4K',   17, ['Color Grading','Stabilization','Audio Cleanup','Caption Generation'],                   ['Handheld','Push In','Orbit'],    'Cinematic'],
  [12,  'Workflow', 'Travel Vlog Workflow Review',            '',                        'Travel Vlog Master',   'Travel',     18, null,null,5, 4,  'YouTube',         'MP4', '4K',   6,  [],                                                                                      [],                                'Cinematic'],
  [15,  'Editing',  'Podcast Ep.12 Audio Deep Clean',         'Creator Conversations',   'Podcast Episode',      'Podcast',    32, 48, 79, 9,  9,  'Podcast',         'MP4', '1080p',14, ['Noise Reduction','Voice Enhancement','Audio Cleanup','Subtitle Generation'],            ['Stationary'],                    'Interview'],
  [18,  'Editing',  'Morning Routine TikTok Cut',             'Daily Life Series',       'Short-Form Reel',      'Lifestyle',  15, 65, 82, 8,  7,  'TikTok',          'MP4', '1080p',9,  ['Color Grading','Trim Beginning','Caption Generation'],                                  ['Handheld','Whip Pan','Push In'], 'Short-Form'],
  [20,  'Shooting', 'Porto Old Town Shoot',                   'Portugal Travel Series',  'Travel Vlog Master',   'Travel',     120,null,77, 9,  7,  'YouTube',         'MP4', '4K',   10, [],                                                                                      ['Slow Walk','Pan','Orbit'],       'Cinematic'],
  [22,  'Editing',  'Fitness Challenge Day 30 Reel',          '30-Day Fitness Challenge','Fitness Challenge',    'Fitness',    38, 60, 85, 15, 13, 'Instagram Reels', 'MP4', '1080p',15, ['Color Grading','Stabilization','Highlight Reel','Caption Generation'],                  ['Tracking Shot','Handheld'],      'Short-Form'],
  [25,  'Editing',  'Cooking Channel Ep.6 Overhead Edit',     'Home Chef Series',        'Product Showcase',     'Food',       47, 53, 80, 17, 14, 'YouTube',         'MP4', '1080p',16, ['Lighting Fix','White Balance','Color Grading','Subtitle Generation'],                   ['Stationary','Push In'],          'Studio'],
  [28,  'Editing',  'Wedding BTS Highlight',                  'Wedding Shoot BTS',       'Wedding & Events',     'Events',     72, 57, 89, 22, 20, 'YouTube',         'MOV', '4K',   25, ['Color Grading','Stabilization','Face Blur','Noise Reduction','Subtitle Generation'],    ['Orbit','Tracking Shot'],         'Documentary'],
  [30,  'Shooting', 'Bali Beach Sunrise Shoot',               'Bali Lifestyle Vlog',     'Travel Vlog Master',   'Travel',     88, null,85, 6,  6,  'YouTube',         'MP4', '4K',   9,  [],                                                                                      ['Stationary','Pan','Tilt Up'],    'Cinematic'],
  [33,  'Editing',  'Tech Review: Camera Drone',              'Tech Desk Review',        'Product Showcase',     'Tech',       58, 50, 82, 19, 16, 'YouTube',         'MP4', '1080p',20, ['Lighting Fix','White Balance','Color Grading','Caption Generation','Thumbnail Suggestion'],['Push In','Orbit'],              'Studio'],
  [36,  'Editing',  'Instagram Reel Pack Vol.1',              'Instagram Reel Pack',     'Short-Form Reel',      'Short-Form', 28, 64, 86, 13, 12, 'Instagram Reels', 'MP4', '1080p',13, ['Color Grading','Trim Ending','Caption Generation','Stabilization'],                     ['Handheld','Whip Pan'],           'Short-Form'],
  [38,  'Editing',  'Bali Sunset Walk Colour Grade',          'Bali Lifestyle Vlog',     'Travel Vlog Master',   'Travel',     44, 66, 90, 12, 11, 'YouTube',         'MP4', '4K',   16, ['Color Grading','Stabilization','Noise Reduction'],                                      ['Slow Walk','Orbit'],             'Cinematic'],
  [42,  'Workflow', 'Short-Form Reel Workflow Build',         '',                        'Short-Form Reel',      'Short-Form', 25, null,null,6, 5,  'TikTok',          'MP4', '1080p',5,  [],                                                                                      [],                                'Short-Form'],
  [45,  'Editing',  'Street Food Series Full Edit',           'Street Food World',       'Travel Vlog Master',   'Food',       63, 52, 78, 16, 13, 'YouTube',         'MP4', '1080p',18, ['Lighting Fix','Color Grading','Audio Cleanup','Subtitle Generation'],                   ['Handheld','Push In','Pan'],      'Documentary'],
  [48,  'Shooting', 'Coworking Space B-Roll',                 'Creator Workspace',       'Product Showcase',     'Lifestyle',  55, null,73, 8,  6,  'LinkedIn',        'MP4', '1080p',8,  [],                                                                                      ['Stationary','Push In'],          'Studio'],
  [50,  'Editing',  'First AI-Assisted Edit Test',            'Onboarding Test',         '',                     'Tech',       20, 40, 65, 10, 7,  'YouTube',         'MP4', '1080p',7,  ['Lighting Fix','Noise Reduction','Stabilization'],                                       ['Stationary'],                    'Vlog'],
  [55,  'Editing',  'Santorini Sunset Series',                'Greece Summer 2024',      'Travel Vlog Master',   'Travel',     60, 68, 92, 14, 13, 'YouTube',         'MP4', '4K',   19, ['Color Grading','Stabilization','Caption Generation'],                                   ['Pan','Slow Walk','Tilt Up'],     'Cinematic'],
  [58,  'Shooting', 'Athens Street Photography',              'Greece Summer 2024',      'Travel Vlog Master',   'Travel',     75, null,79, 7,  6,  'Instagram Reels', 'MP4', '1080p',9,  [],                                                                                      ['Handheld','Pan'],                'Documentary'],
  [60,  'Editing',  'LinkedIn Tech Tutorial Final',           'Tech Education Series',   'Product Showcase',     'Education',  50, 60, 85, 16, 14, 'LinkedIn',        'MP4', '1080p',17, ['Lighting Fix','Color Grading','Subtitle Generation','Caption Generation'],              ['Stationary','Push In'],          'Studio'],
  [65,  'Editing',  'TikTok Trending Audio Reel',             'Social Media Pack',       'Short-Form Reel',      'Short-Form', 18, 72, 87, 10, 9,  'TikTok',          'MP4', '1080p',11, ['Color Grading','Trim Beginning','Trim Ending'],                                         ['Handheld','Whip Pan'],           'Short-Form'],
  [68,  'Editing',  'Home Gym Setup Review',                  '30-Day Fitness Challenge','Fitness Challenge',    'Fitness',    35, 55, 80, 14, 12, 'YouTube',         'MP4', '1080p',14, ['Lighting Fix','Color Grading','Caption Generation'],                                    ['Stationary','Push In'],          'Studio'],
  [72,  'Shooting', 'Mountain Trail Hike',                    'Adventure Outdoors',      'Travel Vlog Master',   'Travel',     110,null,81, 8,  7,  'YouTube',         'MP4', '4K',   10, [],                                                                                      ['Slow Walk','Handheld','Pan'],    'Documentary'],
  [75,  'Editing',  'Recipe Video Series Ep.3',               'Home Chef Series',        'Product Showcase',     'Food',       42, 58, 83, 15, 13, 'YouTube',         'MP4', '1080p',15, ['Lighting Fix','White Balance','Color Grading','Caption Generation'],                    ['Stationary','Push In','Orbit'],  'Studio'],
  [78,  'Editing',  'Event Recap: Startup Meetup',            'Startup Events 2024',     'Wedding & Events',     'Events',     55, 52, 77, 18, 15, 'LinkedIn',        'MP4', '1080p',16, ['Color Grading','Stabilization','Subtitle Generation'],                                  ['Handheld','Tracking Shot'],      'Documentary'],
  [82,  'Editing',  'Budget Travel Guide Ep.1',               'Portugal Travel Series',  'Travel Vlog Master',   'Travel',     65, 60, 86, 15, 13, 'YouTube',         'MP4', '4K',   18, ['Color Grading','Audio Cleanup','Caption Generation'],                                   ['Slow Walk','Pan'],               'Cinematic'],
  [85,  'Shooting', 'Night Market Street Food',               'Street Food World',       'Travel Vlog Master',   'Food',       80, null,72, 9,  7,  'YouTube',         'MP4', '4K',   8,  [],                                                                                      ['Handheld','Push In'],            'Documentary'],
  [88,  'Editing',  'Productivity Tutorial Shorts',           'Tech Education Series',   'Short-Form Reel',      'Education',  20, 65, 83, 11, 10, 'YouTube',         'MP4', '1080p',12, ['Color Grading','Subtitle Generation'],                                                  ['Stationary'],                    'Studio'],
  [92,  'Editing',  'Bali Villa Tour Full Edit',              'Bali Lifestyle Vlog',     'Travel Vlog Master',   'Travel',     70, 63, 88, 17, 15, 'YouTube',         'MP4', '4K',   21, ['Color Grading','Stabilization','Audio Cleanup','Caption Generation'],                   ['Orbit','Tracking Shot','Pan'],   'Cinematic'],
  [95,  'Editing',  'Podcast Ep.8 Interview Cut',             'Creator Conversations',   'Podcast Episode',      'Podcast',    38, 50, 76, 10, 9,  'Podcast',         'MP4', '1080p',12, ['Noise Reduction','Voice Enhancement','Subtitle Generation'],                            ['Stationary'],                    'Interview'],
  [100, 'Editing',  'Instagram Summer Campaign',              'Social Media Pack',       'Short-Form Reel',      'Lifestyle',  25, 67, 84, 12, 11, 'Instagram Reels', 'MP4', '1080p',13, ['Color Grading','Caption Generation'],                                                   ['Handheld','Whip Pan'],           'Short-Form'],
  [105, 'Shooting', 'Tokyo Night Lights',                     'Japan Travel 2024',       'Travel Vlog Master',   'Travel',     90, null,80, 8,  7,  'YouTube',         'MP4', '4K',   10, [],                                                                                      ['Stationary','Pan'],              'Cinematic'],
  [110, 'Editing',  'Product Demo for SaaS Client',           'Commercial Projects',     'Product Showcase',     'Tech',       45, 55, 82, 16, 14, 'LinkedIn',        'MP4', '1080p',17, ['Lighting Fix','Color Grading','Subtitle Generation'],                                   ['Stationary','Push In'],          'Studio'],
  [115, 'Editing',  'Vlog Weekly Highlights #4',              'Weekly Vlog Series',      'Short-Form Reel',      'Lifestyle',  30, 62, 81, 11, 10, 'YouTube',         'MP4', '1080p',12, ['Color Grading','Stabilization','Caption Generation'],                                   ['Handheld','Pan'],                'Vlog'],
  [120, 'Editing',  'Fitness Series Workout Demo',            'Fitness Channel',         'Fitness Challenge',    'Fitness',    40, 58, 82, 14, 12, 'Instagram Reels', 'MP4', '1080p',14, ['Color Grading','Stabilization','Caption Generation'],                                   ['Tracking Shot','Handheld'],      'Short-Form'],
  [130, 'Editing',  'Chiang Mai Food Market Edit',            'Thailand Travel',         'Travel Vlog Master',   'Food',       55, 53, 79, 15, 12, 'YouTube',         'MP4', '1080p',16, ['Color Grading','Audio Cleanup','Caption Generation'],                                   ['Handheld','Pan'],                'Documentary'],
  [145, 'Editing',  'Travel Vlog Pilot Episode',              'Japan Travel 2024',       'Travel Vlog Master',   'Travel',     50, 45, 72, 13, 9,  'YouTube',         'MP4', '1080p',11, ['Lighting Fix','Color Grading','Caption Generation'],                                    ['Pan','Slow Walk'],               'Cinematic'],
];

export const MOCK_ANALYTICS_SESSIONS = SESSION_RAW.map(([dAgo, type, title, projectTitle, workflowName, category, dur, qB, qA, aiRec, aiAcc, platform, format, res, timeSaved, edits, cam, style], i) => {
  const completedAt = daysAgo(dAgo);
  const rate = aiRec > 0 ? Math.round((aiAcc / aiRec) * 100) : 0;
  const workflowId  = workflowName ? `wf-${workflowName.toLowerCase().replace(/\s+/g, '-').slice(0, 12)}` : null;
  return {
    id:                    `as-${String(i + 1).padStart(3, '0')}`,
    type,
    title,
    projectId:             projectTitle ? `proj-${i}` : null,
    projectTitle:          projectTitle,
    workflowId,
    workflowName,
    contentCategory:       category,
    durationMinutes:       dur,
    qualityScoreBefore:    qB ?? null,
    qualityScoreAfter:     qA ?? null,
    improvementDelta:      (qA != null && qB != null) ? qA - qB : 0,
    aiRecommendations:     aiRec,
    aiAccepted:            aiAcc,
    aiAcceptanceRate:      rate,
    exportPlatform:        platform,
    exportFormat:          format,
    exportResolution:      res,
    estimatedTimeSavedMin: timeSaved,
    editTypesApplied:      edits,
    cameraMovements:       cam,
    shootingStyle:         style,
    week:                  isoWeek(completedAt),
    month:                 isoMonth(completedAt),
    createdAt:             completedAt,
    completedAt,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_QUALITY_HISTORY — one data point per session (editing sessions only)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_QUALITY_HISTORY = MOCK_ANALYTICS_SESSIONS
  .filter(s => s.qualityScoreAfter != null)
  .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
  .map((s, i, arr) => ({
    id:              `qm-${s.id}`,
    date:            s.completedAt,
    week:            s.week,
    month:           s.month,
    score:           s.qualityScoreAfter,
    delta:           i > 0 ? s.qualityScoreAfter - arr[i - 1].qualityScoreAfter : 0,
    sessionId:       s.id,
    sessionTitle:    s.title,
    contentCategory: s.contentCategory,
  }));

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_RECOMMENDATION_HISTORY — one data point per session
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_RECOMMENDATION_HISTORY = MOCK_ANALYTICS_SESSIONS
  .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
  .map(s => ({
    id:             `rm-${s.id}`,
    date:           s.completedAt,
    week:           s.week,
    month:          s.month,
    offered:        s.aiRecommendations,
    accepted:       s.aiAccepted,
    dismissed:      s.aiRecommendations - s.aiAccepted,
    acceptanceRate: s.aiAcceptanceRate,
    sessionId:      s.id,
  }));

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_WEEKLY_PERFORMANCE — 24 weeks
// ─────────────────────────────────────────────────────────────────────────────
function buildWeeklyPerformance() {
  // Group sessions by week
  const weekMap = new Map();
  MOCK_ANALYTICS_SESSIONS.forEach(s => {
    if (!weekMap.has(s.week)) weekMap.set(s.week, []);
    weekMap.get(s.week).push(s);
  });

  const weeks = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24); // last 24 weeks

  return weeks.map(([week, sessions], i) => {
    const editing = sessions.filter(s => s.qualityScoreAfter != null);
    const scores  = editing.map(s => s.qualityScoreAfter);
    const deltas  = editing.map(s => s.improvementDelta);
    const recs    = sessions.reduce((sum, s) => sum + s.aiRecommendations, 0);
    const acc     = sessions.reduce((sum, s) => sum + s.aiAccepted, 0);
    const mins    = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const saved   = sessions.reduce((sum, s) => sum + s.estimatedTimeSavedMin, 0);

    return {
      id:                    `wp-${i}`,
      period:                'week',
      periodLabel:           week,
      sessionsCount:         sessions.length,
      totalMinutes:          mins,
      avgQualityScore:       scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      avgImprovementDelta:   deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0,
      totalAIRecommendations:recs,
      totalAIAccepted:       acc,
      aiAcceptanceRate:      recs > 0 ? Math.round((acc / recs) * 100) : 0,
      timeSavedMinutes:      saved,
      startDate:             sessions[0]?.completedAt ?? '',
      endDate:               sessions[sessions.length - 1]?.completedAt ?? '',
    };
  });
}
export const MOCK_WEEKLY_PERFORMANCE = buildWeeklyPerformance();

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_MONTHLY_PERFORMANCE — 6 months
// ─────────────────────────────────────────────────────────────────────────────
function buildMonthlyPerformance() {
  const monthMap = new Map();
  MOCK_ANALYTICS_SESSIONS.forEach(s => {
    if (!monthMap.has(s.month)) monthMap.set(s.month, []);
    monthMap.get(s.month).push(s);
  });

  const months = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  return months.map(([month, sessions], i) => {
    const editing = sessions.filter(s => s.qualityScoreAfter != null);
    const scores  = editing.map(s => s.qualityScoreAfter);
    const deltas  = editing.map(s => s.improvementDelta);
    const recs    = sessions.reduce((sum, s) => sum + s.aiRecommendations, 0);
    const acc     = sessions.reduce((sum, s) => sum + s.aiAccepted, 0);
    const mins    = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const saved   = sessions.reduce((sum, s) => sum + s.estimatedTimeSavedMin, 0);

    return {
      id:                    `mp-${i}`,
      period:                'month',
      periodLabel:           month,
      sessionsCount:         sessions.length,
      totalMinutes:          mins,
      avgQualityScore:       scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      avgImprovementDelta:   deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0,
      totalAIRecommendations:recs,
      totalAIAccepted:       acc,
      aiAcceptanceRate:      recs > 0 ? Math.round((acc / recs) * 100) : 0,
      timeSavedMinutes:      saved,
      startDate:             sessions[0]?.completedAt ?? '',
      endDate:               sessions[sessions.length - 1]?.completedAt ?? '',
    };
  });
}
export const MOCK_MONTHLY_PERFORMANCE = buildMonthlyPerformance();

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_WORKFLOW_METRICS — 6 workflows
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_WORKFLOW_METRICS = [
  {
    workflowId:           'wf-travel-vlog-mast',
    workflowName:         'Travel Vlog Master',
    category:             'Travel',
    icon:                 '✈️',
    usageCount:           15,
    avgQualityScore:      85,
    avgImprovementDelta:  25,
    totalAIAccepted:      105,
    lastUsedAt:           daysAgo(1),
    associatedPlatforms:  ['YouTube', 'Instagram Reels'],
  },
  {
    workflowId:           'wf-short-form-reel',
    workflowName:         'Short-Form Reel',
    category:             'Content',
    icon:                 '🎬',
    usageCount:           9,
    avgQualityScore:      84,
    avgImprovementDelta:  19,
    totalAIAccepted:      75,
    lastUsedAt:           daysAgo(3),
    associatedPlatforms:  ['TikTok', 'Instagram Reels', 'YouTube'],
  },
  {
    workflowId:           'wf-product-showcas',
    workflowName:         'Product Showcase',
    category:             'Commercial',
    icon:                 '📦',
    usageCount:           8,
    avgQualityScore:      82,
    avgImprovementDelta:  27,
    totalAIAccepted:      74,
    lastUsedAt:           daysAgo(8),
    associatedPlatforms:  ['YouTube', 'LinkedIn'],
  },
  {
    workflowId:           'wf-wedding-events',
    workflowName:         'Wedding & Events',
    category:             'Events',
    icon:                 '💍',
    usageCount:           2,
    avgQualityScore:      83,
    avgImprovementDelta:  29,
    totalAIAccepted:      35,
    lastUsedAt:           daysAgo(28),
    associatedPlatforms:  ['YouTube'],
  },
  {
    workflowId:           'wf-podcast-episode',
    workflowName:         'Podcast Episode',
    category:             'Audio',
    icon:                 '🎙',
    usageCount:           2,
    avgQualityScore:      77,
    avgImprovementDelta:  26,
    totalAIAccepted:      18,
    lastUsedAt:           daysAgo(95),
    associatedPlatforms:  ['Podcast'],
  },
  {
    workflowId:           'wf-fitness-challeng',
    workflowName:         'Fitness Challenge',
    category:             'Fitness',
    icon:                 '💪',
    usageCount:           3,
    avgQualityScore:      82,
    avgImprovementDelta:  22,
    totalAIAccepted:      37,
    lastUsedAt:           daysAgo(22),
    associatedPlatforms:  ['Instagram Reels', 'YouTube'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_PLATFORM_METRICS — 6 platforms
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_PLATFORM_METRICS = [
  {
    platform:              'YouTube',
    exportCount:           24,
    avgQualityScore:       84,
    avgImprovementDelta:   24,
    aiOptimisationsApplied:180,
    favoriteFormat:        'MP4',
    favoriteResolution:    '4K',
    lastExportedAt:        daysAgo(1),
  },
  {
    platform:              'Instagram Reels',
    exportCount:           7,
    avgQualityScore:       85,
    avgImprovementDelta:   20,
    aiOptimisationsApplied:58,
    favoriteFormat:        'MP4',
    favoriteResolution:    '1080p',
    lastExportedAt:        daysAgo(3),
  },
  {
    platform:              'TikTok',
    exportCount:           3,
    avgQualityScore:       85,
    avgImprovementDelta:   18,
    aiOptimisationsApplied:27,
    favoriteFormat:        'MP4',
    favoriteResolution:    '1080p',
    lastExportedAt:        daysAgo(18),
  },
  {
    platform:              'LinkedIn',
    exportCount:           4,
    avgQualityScore:       82,
    avgImprovementDelta:   22,
    aiOptimisationsApplied:32,
    favoriteFormat:        'MP4',
    favoriteResolution:    '1080p',
    lastExportedAt:        daysAgo(23),
  },
  {
    platform:              'Podcast',
    exportCount:           2,
    avgQualityScore:       77,
    avgImprovementDelta:   26,
    aiOptimisationsApplied:18,
    favoriteFormat:        'MP4',
    favoriteResolution:    '1080p',
    lastExportedAt:        daysAgo(95),
  },
  {
    platform:              'Twitter / X',
    exportCount:           0,
    avgQualityScore:       0,
    avgImprovementDelta:   0,
    aiOptimisationsApplied:0,
    favoriteFormat:        'MP4',
    favoriteResolution:    '1080p',
    lastExportedAt:        null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_EDITING_METRICS — 10 edit types
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_EDITING_METRICS = [
  { editType: 'Color Grading',      category: 'Colour', usageCount: 28, avgQualityGain: 18, acceptanceRate: 94, lastUsedAt: daysAgo(1)  },
  { editType: 'Stabilization',      category: 'Motion', usageCount: 20, avgQualityGain: 12, acceptanceRate: 88, lastUsedAt: daysAgo(1)  },
  { editType: 'Caption Generation', category: 'Text',   usageCount: 22, avgQualityGain:  8, acceptanceRate: 97, lastUsedAt: daysAgo(1)  },
  { editType: 'Audio Cleanup',      category: 'Audio',  usageCount: 17, avgQualityGain: 14, acceptanceRate: 91, lastUsedAt: daysAgo(3)  },
  { editType: 'Subtitle Generation',category: 'Text',   usageCount: 16, avgQualityGain:  9, acceptanceRate: 95, lastUsedAt: daysAgo(3)  },
  { editType: 'Lighting Fix',       category: 'Visual', usageCount: 14, avgQualityGain: 16, acceptanceRate: 86, lastUsedAt: daysAgo(8)  },
  { editType: 'Noise Reduction',    category: 'Audio',  usageCount: 10, avgQualityGain: 11, acceptanceRate: 92, lastUsedAt: daysAgo(7)  },
  { editType: 'White Balance',      category: 'Colour', usageCount: 10, avgQualityGain: 13, acceptanceRate: 85, lastUsedAt: daysAgo(8)  },
  { editType: 'Trim Beginning',     category: 'Motion', usageCount:  8, avgQualityGain:  6, acceptanceRate: 80, lastUsedAt: daysAgo(18) },
  { editType: 'Face Blur',          category: 'Visual', usageCount:  3, avgQualityGain:  4, acceptanceRate: 100,lastUsedAt: daysAgo(28) },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_GROWTH_HISTORY — 6 monthly snapshots
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_GROWTH_HISTORY = [
  createBlankGrowthMetric({ id: 'gm-001', date: daysAgo(150), month: isoMonth(daysAgo(150)), creatorScore: 48, qualityScore: 52, consistencyScore: 45, aiCollaborationScore: 42, growthDelta:  0  }),
  createBlankGrowthMetric({ id: 'gm-002', date: daysAgo(120), month: isoMonth(daysAgo(120)), creatorScore: 56, qualityScore: 61, consistencyScore: 52, aiCollaborationScore: 54, growthDelta:  8  }),
  createBlankGrowthMetric({ id: 'gm-003', date: daysAgo(90),  month: isoMonth(daysAgo(90)),  creatorScore: 65, qualityScore: 70, consistencyScore: 62, aiCollaborationScore: 65, growthDelta:  9  }),
  createBlankGrowthMetric({ id: 'gm-004', date: daysAgo(60),  month: isoMonth(daysAgo(60)),  creatorScore: 73, qualityScore: 79, consistencyScore: 70, aiCollaborationScore: 74, growthDelta:  8  }),
  createBlankGrowthMetric({ id: 'gm-005', date: daysAgo(30),  month: isoMonth(daysAgo(30)),  creatorScore: 81, qualityScore: 85, consistencyScore: 79, aiCollaborationScore: 82, growthDelta:  8  }),
  createBlankGrowthMetric({ id: 'gm-006', date: daysAgo(0),   month: isoMonth(daysAgo(0)),   creatorScore: 87, qualityScore: 91, consistencyScore: 84, aiCollaborationScore: 87, growthDelta:  6  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_ANALYTICS_INSIGHTS — 8 AI-generated insights
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_ANALYTICS_INSIGHTS = [
  {
    id:              'ai-001',
    category:        'Quality',
    priority:        'High',
    title:           'Quality score up 39 points in 6 months',
    body:            'Your average quality score has grown from 52 to 91 — a 39-point improvement over 6 months. Your consistent use of Color Grading and Stabilisation is the primary driver.',
    confidenceScore: 94,
    metric:          'avgQualityScore',
    metricValue:     91,
    trend:           'up',
    dismissed:       false,
    generatedAt:     daysAgo(1),
    expiresAt:       null,
  },
  {
    id:              'ai-002',
    category:        'AI Learning',
    priority:        'High',
    title:           '80% AI acceptance rate — above global average',
    body:            'You accept 80% of all AI editing suggestions, compared to the global creator average of 62%. This collaboration is directly responsible for your accelerated quality gains.',
    confidenceScore: 97,
    metric:          'aiAcceptanceRate',
    metricValue:     80,
    trend:           'up',
    dismissed:       false,
    generatedAt:     daysAgo(1),
    expiresAt:       null,
  },
  {
    id:              'ai-003',
    category:        'Efficiency',
    priority:        'Medium',
    title:           'AI saved you ~345 minutes of editing this month',
    body:            'Based on time-saved estimates across your 8 sessions this month, IBM watsonx.ai has automated approximately 345 minutes of manual editing work.',
    confidenceScore: 88,
    metric:          'totalTimeSavedMinutes',
    metricValue:     345,
    trend:           'up',
    dismissed:       false,
    generatedAt:     daysAgo(2),
    expiresAt:       null,
  },
  {
    id:              'ai-004',
    category:        'Platform',
    priority:        'Medium',
    title:           'YouTube is your highest-quality export platform',
    body:            'Your YouTube exports average a quality score of 84, higher than any other platform. Consider applying the same optimisation pipeline to LinkedIn (currently averaging 82).',
    confidenceScore: 91,
    metric:          'bestPerformingPlatform',
    metricValue:     84,
    trend:           'flat',
    dismissed:       false,
    generatedAt:     daysAgo(3),
    expiresAt:       null,
  },
  {
    id:              'ai-005',
    category:        'Workflow',
    priority:        'Low',
    title:           'Travel Vlog Master drives your best results',
    body:            'Sessions using Travel Vlog Master average a quality improvement of 25 points — the highest of all your workflows. It has been used in 15 sessions and remains your most powerful tool.',
    confidenceScore: 95,
    metric:          'mostUsedWorkflow',
    metricValue:     15,
    trend:           'flat',
    dismissed:       false,
    generatedAt:     daysAgo(3),
    expiresAt:       null,
  },
  {
    id:              'ai-006',
    category:        'Growth',
    priority:        'High',
    title:           'Creator score reached 87 — top 15% of platform',
    body:            'Your Creator Score has grown from 48 to 87 over 6 months. Based on current trajectory, IBM watsonx.ai predicts you will exceed 90 within the next 4–6 sessions.',
    confidenceScore: 89,
    metric:          'latestCreatorScore',
    metricValue:     87,
    trend:           'up',
    dismissed:       false,
    generatedAt:     daysAgo(1),
    expiresAt:       null,
  },
  {
    id:              'ai-007',
    category:        'Editing',
    priority:        'Low',
    title:           'Color Grading is your most impactful edit type',
    body:            'Color Grading has been applied in 28 sessions and contributes an average quality gain of 18 points per session. Your 94% acceptance rate for this edit type confirms it matches your style.',
    confidenceScore: 96,
    metric:          'favoriteEditType',
    metricValue:     28,
    trend:           'up',
    dismissed:       false,
    generatedAt:     daysAgo(4),
    expiresAt:       null,
  },
  {
    id:              'ai-008',
    category:        'Efficiency',
    priority:        'Medium',
    title:           'Consistency score improved 39 points',
    body:            'Your consistency score has grown from 45 to 84, reflecting more regular session cadence and stable quality output. Maintaining 3–4 sessions per week will continue this trend.',
    confidenceScore: 87,
    metric:          'consistencyScore',
    metricValue:     84,
    trend:           'up',
    dismissed:       false,
    generatedAt:     daysAgo(2),
    expiresAt:       null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_ANALYTICS_STATISTICS — pre-computed aggregate
// ─────────────────────────────────────────────────────────────────────────────
const _editing = MOCK_ANALYTICS_SESSIONS.filter(s => s.qualityScoreAfter != null);
const _scores  = _editing.map(s => s.qualityScoreAfter);
const _deltas  = _editing.filter(s => s.improvementDelta > 0).map(s => s.improvementDelta);
const _recs    = MOCK_ANALYTICS_SESSIONS.reduce((sum, s) => sum + s.aiRecommendations, 0);
const _acc     = MOCK_ANALYTICS_SESSIONS.reduce((sum, s) => sum + s.aiAccepted, 0);
const _mins    = MOCK_ANALYTICS_SESSIONS.reduce((sum, s) => sum + s.durationMinutes, 0);
const _saved   = MOCK_ANALYTICS_SESSIONS.reduce((sum, s) => sum + s.estimatedTimeSavedMin, 0);

// Weekly trend: compare last 2 weeks
const _thisWeekSessions = MOCK_ANALYTICS_SESSIONS.filter(s => {
  const d = new Date(s.completedAt);
  return (Date.now() - d.getTime()) < 7 * 86400000;
});
const _prevWeekSessions = MOCK_ANALYTICS_SESSIONS.filter(s => {
  const d = new Date(s.completedAt);
  const age = Date.now() - d.getTime();
  return age >= 7 * 86400000 && age < 14 * 86400000;
});
const _thisWeekAvg = _thisWeekSessions.length
  ? Math.round(_thisWeekSessions.filter(s => s.qualityScoreAfter).reduce((sum, s) => sum + (s.qualityScoreAfter || 0), 0) / Math.max(1, _thisWeekSessions.filter(s => s.qualityScoreAfter).length))
  : 0;
const _prevWeekAvg = _prevWeekSessions.length
  ? Math.round(_prevWeekSessions.filter(s => s.qualityScoreAfter).reduce((sum, s) => sum + (s.qualityScoreAfter || 0), 0) / Math.max(1, _prevWeekSessions.filter(s => s.qualityScoreAfter).length))
  : 0;
const _weeklyTrendPct = _prevWeekAvg > 0 ? Math.round(((_thisWeekAvg - _prevWeekAvg) / _prevWeekAvg) * 100) : 0;

export const MOCK_ANALYTICS_STATISTICS = createBlankAnalyticsStatistics({
  totalSessions:            MOCK_ANALYTICS_SESSIONS.length,
  totalEditingSessions:     _editing.length,
  totalShootingSessions:    MOCK_ANALYTICS_SESSIONS.filter(s => s.type === 'Shooting').length,
  totalMinutes:             _mins,
  totalTimeSavedMinutes:    _saved,
  totalAIRecommendations:   _recs,
  totalAIAccepted:          _acc,
  overallAcceptanceRate:    _recs > 0 ? Math.round((_acc / _recs) * 100) : 0,
  avgQualityScore:          _scores.length ? Math.round(_scores.reduce((a, b) => a + b, 0) / _scores.length) : 0,
  avgImprovementDelta:      _deltas.length ? Math.round(_deltas.reduce((a, b) => a + b, 0) / _deltas.length) : 0,
  bestQualityScore:         _scores.length ? Math.max(..._scores) : 0,
  latestCreatorScore:       87,
  creatorScoreGrowth:       39,
  mostUsedWorkflowId:       'wf-travel-vlog-mast',
  mostUsedWorkflowName:     'Travel Vlog Master',
  bestPerformingPlatform:   'YouTube',
  favoriteExportFormat:     'MP4',
  favoriteContentCategory:  'Travel',
  weeklyTrend:              _weeklyTrendPct >= 0 ? 'up' : 'down',
  weeklyTrendPct:           Math.abs(_weeklyTrendPct),
  monthlyTrend:             'up',
  monthlyTrendPct:          8,
});

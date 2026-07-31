/**
 * project/models/projectModel.js
 *
 * Canonical shape of a Project object.
 * All components, context, and mock data conform to this shape.
 */

/**
 * @typedef {Object} MediaStats
 * @property {number} photos
 * @property {number} videos
 * @property {number} audio
 * @property {number} notes
 */

/**
 * @typedef {Object} ActivityItem
 * @property {string} id
 * @property {string} type   — 'capture'|'edit'|'note'|'export'|'review'|'created'
 * @property {string} label
 * @property {string} time   — ISO date string
 */

/**
 * @typedef {Object} TimelineEntry
 * @property {string} id
 * @property {string} date     — ISO date string
 * @property {string} label
 * @property {boolean} complete
 */

/**
 * @typedef {Object} Project
 * @property {string}         id
 * @property {string}         title
 * @property {string}         description
 * @property {string}         category    — 'Vlog'|'Wedding'|'Commercial'|'Tutorial'|'Podcast'|'Social'|'Cooking'|'Fitness'|'Documentary'|'Event'
 * @property {string[]}       tags
 * @property {string}         coverColor  — CSS gradient string (no images needed)
 * @property {string}         coverEmoji  — Emoji representing the project
 * @property {'Planning'|'Shooting'|'Editing'|'Reviewing'|'Published'|'Archived'} status
 * @property {number}         progress    — 0–100
 * @property {boolean}        isFavorite
 * @property {string}         aiSummary
 * @property {string|null}    workflowId  — ID of assigned workflow
 * @property {string|null}    workflowName
 * @property {MediaStats}     mediaStats
 * @property {ActivityItem[]} recentActivity
 * @property {TimelineEntry[]} timeline
 * @property {string}         createdAt   — ISO date string
 * @property {string}         updatedAt   — ISO date string
 */

/** Factory — creates a blank Project with safe defaults. */
export function createBlankProject(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id:           `proj-${Date.now()}`,
    title:        '',
    description:  '',
    category:     'Vlog',
    tags:         [],
    coverColor:   'linear-gradient(135deg, #6366f1, #8b5cf6)',
    coverEmoji:   '🎬',
    status:       'Planning',
    progress:     0,
    isFavorite:   false,
    aiSummary:    '',
    workflowId:   null,
    workflowName: null,
    mediaStats: {
      photos: 0,
      videos: 0,
      audio:  0,
      notes:  0,
    },
    recentActivity: [],
    timeline:       [],
    createdAt:      now,
    updatedAt:      now,
    ...overrides,
  };
}

export const PROJECT_CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'Vlog',        label: 'Vlog' },
  { id: 'Wedding',     label: 'Wedding' },
  { id: 'Commercial',  label: 'Commercial' },
  { id: 'Tutorial',    label: 'Tutorial' },
  { id: 'Podcast',     label: 'Podcast' },
  { id: 'Social',      label: 'Social' },
  { id: 'Cooking',     label: 'Cooking' },
  { id: 'Fitness',     label: 'Fitness' },
  { id: 'Documentary', label: 'Documentary' },
  { id: 'Event',       label: 'Event' },
];

export const PROJECT_STATUSES = [
  'Planning',
  'Shooting',
  'Editing',
  'Reviewing',
  'Published',
  'Archived',
];

export const STATUS_COLORS = {
  Planning:   { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  Shooting:   { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  Editing:    { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
  Reviewing:  { bg: 'rgba(168,85,247,0.15)',  text: '#d8b4fe', border: 'rgba(168,85,247,0.3)' },
  Published:  { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  Archived:   { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
};

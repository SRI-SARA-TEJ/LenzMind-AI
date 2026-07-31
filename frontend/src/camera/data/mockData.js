/**
 * camera/data/mockData.js — Mock Data Providers
 *
 * All mock data for Version 1. Replace individual arrays/objects
 * with real API calls in future iterations without touching UI components.
 *
 * Module 8.5 — MOCK_WORKFLOWS is now sourced from the full workflow library
 * so that applying a workflow also carries its complete cameraSettings.
 */

import { MOCK_WORKFLOW_LIBRARY } from '../../workflow/data/mockWorkflowData';

// ── AI Suggestion mock pool ───────────────────────────────────────────────────
export const MOCK_AI_SUGGESTIONS = [
  {
    id: 'sug-001',
    scene: 'Golden Hour Outdoor',
    workflow: 'Travel Vlog',
    reason: 'Warm directional light detected. Cinematic colour grading will enhance this scene naturally.',
    confidence: 94,
  },
  {
    id: 'sug-002',
    scene: 'Indoor Low Light',
    workflow: 'Interview / Talking Head',
    reason: 'Low ambient lux detected. Auto-ISO push and noise reduction workflow recommended.',
    confidence: 88,
  },
  {
    id: 'sug-003',
    scene: 'Urban Street',
    workflow: 'Short-Form Reel',
    reason: 'High contrast environment. Dynamic crop and beat-sync editing workflow detected.',
    confidence: 91,
  },
  {
    id: 'sug-004',
    scene: 'Food / Macro',
    workflow: 'Food Creator',
    reason: 'Close focal distance detected. Macro stabilisation and colour pop workflow recommended.',
    confidence: 86,
  },
  {
    id: 'sug-005',
    scene: 'Concert / Event',
    workflow: 'Live Event Highlights',
    reason: 'Fast motion and stage lighting detected. High-frame-rate capture recommended.',
    confidence: 79,
  },
];

// ── Workflow library — sourced from the single canonical mock library ─────────
// Re-exported so camera components always stay in sync with the full library.
export { MOCK_WORKFLOW_LIBRARY as MOCK_WORKFLOWS };

// ── Camera settings mock ──────────────────────────────────────────────────────
export const MOCK_CAMERA_SETTINGS = {
  flash:      'auto',   // 'off' | 'auto' | 'on'
  hdr:        true,
  resolution: '4K',     // '1080p' | '4K' | '8K'
  fps:        30,       // 24 | 30 | 60 | 120
  mode:       'video',  // 'photo' | 'video'
};

// ── AI Status mock states ─────────────────────────────────────────────────────
export const AI_STATUS_STATES = [
  { id: 'ready',           label: 'Ready',            color: '#22c55e' },
  { id: 'detecting',       label: 'Detecting Scene',  color: '#f59e0b' },
  { id: 'workflow_active', label: 'Workflow Active',  color: '#6366f1' },
  { id: 'privacy',         label: 'Privacy Mode',     color: '#8b8fa8' },
  { id: 'offline',         label: 'Offline',          color: '#ef4444' },
];

// ── Gallery thumbnail mock ────────────────────────────────────────────────────
export const MOCK_GALLERY = [
  { id: 'g-001', type: 'video', duration: '0:34', thumbnail: null },
  { id: 'g-002', type: 'photo', duration: null,   thumbnail: null },
  { id: 'g-003', type: 'video', duration: '1:12', thumbnail: null },
];

// ── Capture modes ─────────────────────────────────────────────────────────────
export const CAPTURE_MODES = [
  { id: 'photo',   label: 'Photo' },
  { id: 'video',   label: 'Video' },
  { id: 'timelapse', label: 'Time-lapse' },
  { id: 'slow',    label: 'Slow-Mo' },
];

// ── Bottom navigation tabs ────────────────────────────────────────────────────
export const NAV_TABS = [
  { id: 'camera',    label: 'Camera',    path: '/camera' },
  { id: 'director',  label: 'Director',  path: '/director' },
  { id: 'assistant', label: 'Assistant', path: '/assistant' },
  { id: 'editing',   label: 'Editing',   path: '/editing' },
  { id: 'intelligence', label: 'Intel',  path: '/intelligence' },
];

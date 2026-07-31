/**
 * camera/services/creatorMemoryService.js — Creator Memory Service
 *
 * Module 8.6 — Creator Memory (generation)
 * Module 8.7 — Creator Memory (integration)
 *
 * Pure-function service layer that owns all Creator Memory logic for the
 * camera feature:
 *
 *   buildMemoryEntry()      — constructs a CameraMemoryEntry from an analysis
 *                             result, the active workflow, current settings, and
 *                             captured-image metadata.
 *
 *   isDuplicate()           — prevents the same analysis from being stored twice.
 *                             Dedup key: scene + workflow + rounded-second timestamp.
 *
 *   cameraEntryToSession()  — (Module 8.7) maps a CameraMemoryEntry to a
 *                             MemorySession (type: 'Shooting') so that camera
 *                             captures appear natively in the Creator Memory
 *                             Timeline, Dashboard stats, and pattern detection.
 *
 * No React, no side effects, no network calls in this file.
 * CameraContext and CameraMemoryBridge are the only callers.
 * UI components never import this directly.
 *
 * [AI_FUTURE] Replace buildMemoryEntry with an async API call that persists
 * entries to the backend Creator Memory store.
 *
 * ── CameraMemoryEntry shape ───────────────────────────────────────────────────
 * {
 *   id:              string   — unique entry id
 *   timestamp:       string   — ISO-8601
 *   scene:           string   — detected scene label
 *   workflow:        string   — active workflow name at time of capture
 *   workflowId:      string|null
 *   confidence:      number|null   — 0–100
 *   recommendations: string[]
 *   cameraSettings:  object   — snapshot of settings at time of capture
 *   imageMetadata:   { width, height } | null
 *   analysisStatus:  'ok' | 'mock' | 'error'
 * }
 */

// ── Unique-id helper ──────────────────────────────────────────────────────────
let _counter = 0;
function generateId() {
  _counter += 1;
  return `cmem-${Date.now()}-${_counter}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Confidence normaliser ─────────────────────────────────────────────────────
function normaliseConfidence(raw) {
  if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
  const v = raw <= 1 ? raw * 100 : raw;
  return Math.round(Math.min(Math.max(v, 0), 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a CameraMemoryEntry from the completed analysis result.
 *
 * @param {object} analysis         — payload from analyzeCapturedImage()
 * @param {object} activeWorkflow   — current workflow object from CameraContext
 * @param {object} settings         — current camera settings from CameraContext
 * @param {object|null} capturedImage — { width, height } or null
 * @returns {object}  CameraMemoryEntry
 */
export function buildMemoryEntry(analysis, activeWorkflow, settings, capturedImage) {
  const now = new Date().toISOString();

  const recommendations = Array.isArray(analysis?.recommendations)
    ? analysis.recommendations.filter(Boolean)
    : [];

  return {
    id:              generateId(),
    timestamp:       now,
    scene:           analysis?.scene    ?? 'Unknown scene',
    workflow:        analysis?.workflow ?? activeWorkflow?.name ?? '',
    workflowId:      activeWorkflow?.id  ?? null,
    confidence:      normaliseConfidence(analysis?.confidence),
    recommendations,
    cameraSettings:  settings ? { ...settings } : {},
    imageMetadata:   capturedImage
      ? {
          width:  capturedImage.width  ?? null,
          height: capturedImage.height ?? null,
        }
      : null,
    analysisStatus:  analysis?.status ?? 'ok',
  };
}

/**
 * Returns true when an entry with the same scene + workflow already exists
 * in the memory array within the same calendar-second.
 * Prevents double-saves from rapid re-renders or re-fired effect hooks.
 *
 * @param {object}   entry   — newly built CameraMemoryEntry
 * @param {object[]} memory  — existing entries (newest-first)
 * @returns {boolean}
 */
export function isDuplicate(entry, memory) {
  if (!Array.isArray(memory) || memory.length === 0) return false;
  const truncSec = (iso) => iso?.slice(0, 19) ?? ''; // "YYYY-MM-DDTHH:MM:SS"
  return memory.some(
    (e) =>
      e.scene     === entry.scene &&
      e.workflow  === entry.workflow &&
      truncSec(e.timestamp) === truncSec(entry.timestamp),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 8.7 — Integration mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a CameraMemoryEntry into a MemorySession (type: 'Shooting').
 *
 * This is the adapter that bridges the camera-local entry format with the
 * CreatorMemoryContext's canonical MemorySession shape.  The returned object
 * is passed directly to CreatorMemoryContext.addSession() so that every
 * camera capture appears in the Memory screen's Timeline, Dashboard stats,
 * and pattern detection — without duplicating any state.
 *
 * Field mapping rationale:
 *   type            → 'Shooting' (it is a camera capture session)
 *   title           → scene label from AI analysis
 *   workflowId/Name → from the entry (captured at analysis time)
 *   qualityScoreAfter → confidence normalised to 0–100 (null → 0)
 *   aiRecommendations → recommendation count
 *   exportResolution → from cameraSettings.resolution
 *   shootingStyle   → inferred from workflow category / name
 *   notes           → human-readable summary of the capture
 *
 * @param {object} entry — CameraMemoryEntry from buildMemoryEntry()
 * @returns {object}       MemorySession-compatible object
 */
export function cameraEntryToSession(entry) {
  const cs           = entry.cameraSettings || {};
  const recCount     = Array.isArray(entry.recommendations) ? entry.recommendations.length : 0;
  const qualityScore = typeof entry.confidence === 'number' ? entry.confidence : 0;

  // Infer a shooting style from the workflow name where possible.
  const shootingStyle = inferShootingStyle(entry.workflow);

  // Build a human-readable session note.
  const notes = [
    entry.scene && `Scene: ${entry.scene}`,
    entry.workflow && `Workflow: ${entry.workflow}`,
    entry.analysisStatus === 'mock' ? '(mock analysis — watsonx.ai not configured)' : null,
  ].filter(Boolean).join(' · ');

  return {
    // ID re-uses the camera entry id so downstream dedup is trivial.
    id:                   entry.id,
    type:                 'Shooting',
    title:                entry.scene || 'Camera Capture',
    projectId:            null,
    projectTitle:         '',
    workflowId:           entry.workflowId   ?? null,
    workflowName:         entry.workflow     ?? '',
    durationMinutes:      0,        // not measured for photo captures
    qualityScoreBefore:   null,
    qualityScoreAfter:    qualityScore,
    improvementDelta:     0,
    aiRecommendations:    recCount,
    aiAccepted:           0,        // user hasn't accepted/rejected yet
    exportPlatform:       'YouTube',
    exportFormat:         'MP4',
    exportResolution:     cs.resolution ?? '4K',
    editTypesApplied:     [],
    cameraMovements:      [],
    shootingStyle,
    notes,
    createdAt:            entry.timestamp,
    completedAt:          entry.timestamp,
    // Extra camera-specific fields stored for forward-compatibility.
    cameraSettings:       { ...cs },
    imageMetadata:        entry.imageMetadata ?? null,
    analysisStatus:       entry.analysisStatus ?? 'ok',
  };
}

// ── Shooting style inference ───────────────────────────────────────────────────
const STYLE_MAP = [
  { keywords: ['vlog', 'travel'],                     style: 'Vlog'       },
  { keywords: ['reel', 'short', 'social'],            style: 'Short-Form' },
  { keywords: ['interview', 'talking head'],          style: 'Interview'  },
  { keywords: ['cinematic', 'film', 'documentary'],   style: 'Cinematic'  },
  { keywords: ['portrait', 'wedding'],                style: 'Studio'     },
  { keywords: ['sport', 'action', 'outdoor'],         style: 'Run-and-Gun'},
];

function inferShootingStyle(workflowName) {
  if (!workflowName) return 'Cinematic';
  const lower = workflowName.toLowerCase();
  for (const entry of STYLE_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.style;
  }
  return 'Cinematic';
}

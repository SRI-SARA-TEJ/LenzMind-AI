/**
 * analytics/services/cameraAnalyticsService.js — Camera Analytics Service
 *
 * Module 8.8 — Creator Analytics Intelligence
 *
 * Pure-function service that derives Creator Analytics from the camera
 * Shooting sessions stored in CreatorMemoryContext.
 *
 * ── Design principles ─────────────────────────────────────────────────────────
 *
 *   1. Pure functions only — no React, no side effects, no network calls.
 *   2. Single input: an array of MemorySession objects (type: 'Shooting').
 *   3. Single output: an AnalyticsStatistics-compatible patch object that can
 *      be passed directly to AnalyticsContext.updateMetrics().
 *   4. Extensible metrics registry — add a new metric by appending one entry
 *      to METRIC_CALCULATORS without touching any existing code.
 *   5. Graceful — every calculator is try/catch isolated; a single bad metric
 *      never aborts the rest of the computation.
 *
 * ── Computed analytics ────────────────────────────────────────────────────────
 *
 *   totalCaptures             — count of all Shooting sessions
 *   totalAIAnalyses           — sessions with a valid confidence score
 *   avgConfidence             — mean confidence across analysed sessions (0–100)
 *   mostCommonScene           — most frequently detected scene label
 *   mostUsedWorkflowName      — most frequently applied workflow name
 *   mostUsedWorkflowId        — id of the most-used workflow
 *   sceneFrequency            — { [scene]: count } frequency map
 *   workflowFrequency         — { [workflowName]: count } frequency map
 *   recommendationCount       — total recommendation strings across all sessions
 *   avgRecommendationsPerCapture — mean recommendations per analysis
 *   resolutionFrequency       — { [resolution]: count }
 *   capturesThisWeek          — captures in the last 7 days
 *   capturesThisMonth         — captures in the last 30 days
 *   activitySummary           — plain-text human-readable summary sentence
 *
 * ── Integration ───────────────────────────────────────────────────────────────
 *
 * Called by AnalyticsBridge.jsx whenever CreatorMemoryContext.sessions changes.
 * The returned patch is passed to AnalyticsContext.updateMetrics().
 *
 * [AI_FUTURE] Replace computeCameraAnalytics() with an async API call that
 * fetches server-computed analytics from the backend.
 */

import { mean, freq, daysAgoIso } from '../../services/serviceUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the key with the highest count in a frequency map, or null. */
function topKey(map) {
  const entries = Object.entries(map);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ── Metric calculators registry ───────────────────────────────────────────────
// Each entry: { key, compute(sessions) → value }
// Add new metrics here without touching any other code.

const METRIC_CALCULATORS = [

  {
    key: 'totalCaptures',
    compute: (sessions) => sessions.length,
  },

  {
    key: 'totalAIAnalyses',
    compute: (sessions) =>
      sessions.filter(s => {
        const score = s.qualityScoreAfter ?? s.cameraSettings?.confidence;
        return typeof score === 'number' && score > 0;
      }).length,
  },

  {
    key: 'avgConfidence',
    compute: (sessions) => {
      const scores = sessions
        .map(s => s.qualityScoreAfter)
        .filter(v => typeof v === 'number' && v > 0);
      return Math.round(mean(scores));
    },
  },

  {
    key: 'sceneFrequency',
    compute: (sessions) =>
      freq(sessions.map(s => s.title).filter(Boolean)),
  },

  {
    key: 'mostCommonScene',
    compute: (sessions) =>
      topKey(freq(sessions.map(s => s.title).filter(Boolean))),
  },

  {
    key: 'workflowFrequency',
    compute: (sessions) =>
      freq(sessions.map(s => s.workflowName).filter(Boolean)),
  },

  {
    key: 'mostUsedWorkflowName',
    compute: (sessions) =>
      topKey(freq(sessions.map(s => s.workflowName).filter(Boolean))),
  },

  {
    key: 'mostUsedWorkflowId',
    compute: (sessions) => {
      const wfFreq = freq(
        sessions.map(s => s.workflowId).filter(Boolean),
      );
      return topKey(wfFreq) ?? null;
    },
  },

  {
    key: 'recommendationCount',
    compute: (sessions) =>
      sessions.reduce((sum, s) => sum + (s.aiRecommendations ?? 0), 0),
  },

  {
    key: 'avgRecommendationsPerCapture',
    compute: (sessions) => {
      if (sessions.length === 0) return 0;
      const total = sessions.reduce((sum, s) => sum + (s.aiRecommendations ?? 0), 0);
      return Math.round((total / sessions.length) * 10) / 10; // 1 decimal
    },
  },

  {
    key: 'resolutionFrequency',
    compute: (sessions) => {
      const resolutions = sessions.map(s => {
        // Resolution may be in cameraSettings (forward-compat) or exportResolution
        return s.cameraSettings?.resolution ?? s.exportResolution ?? null;
      }).filter(Boolean);
      return freq(resolutions);
    },
  },

  {
    key: 'capturesThisWeek',
    compute: (sessions) => {
      const cutoff = daysAgoIso(7);
      return sessions.filter(s => s.completedAt >= cutoff).length;
    },
  },

  {
    key: 'capturesThisMonth',
    compute: (sessions) => {
      const cutoff = daysAgoIso(30);
      return sessions.filter(s => s.completedAt >= cutoff).length;
    },
  },

  {
    key: 'activitySummary',
    compute: (sessions) => {
      const total = sessions.length;
      if (total === 0) return 'No camera captures recorded yet.';

      const cutoff7  = daysAgoIso(7);
      const recent   = sessions.filter(s => s.completedAt >= cutoff7).length;

      const wfFreq   = freq(sessions.map(s => s.workflowName).filter(Boolean));
      const topWf    = topKey(wfFreq);

      const scFreq   = freq(sessions.map(s => s.title).filter(Boolean));
      const topScene = topKey(scFreq);

      const parts = [
        `${total} capture${total !== 1 ? 's' : ''} recorded`,
        recent > 0 ? `${recent} this week` : null,
        topWf    ? `most used workflow: ${topWf}` : null,
        topScene ? `top scene: ${topScene}`       : null,
      ].filter(Boolean);

      return parts.join(' · ') + '.';
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute all camera analytics from an array of MemorySession objects.
 *
 * Accepts the full sessions array from CreatorMemoryContext; filters
 * internally to type === 'Shooting' so callers do not need to pre-filter.
 *
 * Returns an object safe to pass directly to AnalyticsContext.updateMetrics().
 * All keys are additive — they extend existing statistics without overwriting
 * unrelated fields.
 *
 * @param {object[]} allSessions — CreatorMemoryContext.state.sessions
 * @returns {object}  CameraAnalytics patch
 */
export function computeCameraAnalytics(allSessions) {
  const sessions = Array.isArray(allSessions)
    ? allSessions.filter(s => s.type === 'Shooting')
    : [];

  const result = {};

  for (const { key, compute } of METRIC_CALCULATORS) {
    try {
      result[key] = compute(sessions);
    } catch (err) {
      // Graceful degradation: one broken calculator never blocks the rest.
      // eslint-disable-next-line no-console
      console.warn(`[CameraAnalytics] Failed to compute "${key}":`, err.message);
    }
  }

  // Also propagate fields that AnalyticsContext.statistics already tracks
  // so the existing dashboard widgets pick them up without any UI changes.
  if (result.mostUsedWorkflowName) {
    result.mostUsedWorkflowName = result.mostUsedWorkflowName;
  }
  if (result.mostUsedWorkflowId) {
    result.mostUsedWorkflowId = result.mostUsedWorkflowId;
  }
  result.totalShootingSessions = result.totalCaptures ?? 0;

  return result;
}

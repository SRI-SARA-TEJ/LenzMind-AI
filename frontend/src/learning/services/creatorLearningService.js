/**
 * learning/services/creatorLearningService.js — Creator Learning Engine
 *
 * Module 8.9 — Creator Learning Intelligence
 *
 * Pure-function learning engine that derives a CreatorLearningProfile from
 * historical MemorySession data and AnalyticsContext statistics.
 *
 * ── Design principles ─────────────────────────────────────────────────────────
 *
 *   1. Pure functions only — no React, no side effects, no network calls.
 *   2. Extensible rule registry — add a new learning signal by appending one
 *      entry to LEARNING_RULES without modifying any existing rule.
 *   3. Graceful — every rule is try/catch isolated; one failing rule never
 *      aborts the rest of the profile computation.
 *   4. No duplicate state — the engine reads from existing data sources and
 *      produces a derived profile. It stores nothing.
 *   5. Future-ready — the return shape (CreatorLearningProfile) is designed
 *      to drive predictive suggestions, personalized presets, adaptive AI
 *      behaviour, and style profiles in later modules.
 *
 * ── Learning signals computed ─────────────────────────────────────────────────
 *
 *   preferredWorkflows        — ranked list of { workflowName, workflowId, score, count }
 *   preferredScenes           — ranked list of { scene, count, pct }
 *   cameraSettingPreferences  — { resolution, fps, hdr, flash, stabilization }
 *   recommendationBehaviour   — { acceptanceRate, totalOffered, totalAccepted, trend }
 *   shootingHabits            — { favoriteStyle, favoriteMovement, avgSessionMinutes }
 *   captureTimingPreferences  — { preferredHour, preferredDayOfWeek, mostActiveWindow }
 *   confidenceTrend           — { current, previous, direction, delta }
 *   learningConfidence        — 0–100: how well the engine knows this creator
 *   aiStyleProfile            — free-text summary of the creator's style
 *   predictedNextWorkflow     — best-guess next workflow name (or null)
 *   personalizedPresetHint    — suggested camera settings object (or null)
 *
 * ── Integration ───────────────────────────────────────────────────────────────
 *
 * Called by LearningBridge.jsx whenever the session count changes.
 * The returned CreatorLearningProfile is stored in CreatorLearningContext and
 * consumed by any component that calls useCreatorLearning().
 *
 * [AI_FUTURE] Replace computeLearningProfile() with an async IBM watsonx.ai
 * call that returns a richer, server-computed personality model.
 */

import { clamp, mean, freq, daysAgoIso } from '../../services/serviceUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Round to nearest integer safely. */
function roundInt(n) {
  return typeof n === 'number' && !Number.isNaN(n) ? Math.round(n) : 0;
}

/** Sorted entries of a frequency map, highest first. */
function sortedFreq(values) {
  return Object.entries(freq(values)).sort((a, b) => b[1] - a[1]);
}

/** Most common value in an array, or null. */
function topValue(values) {
  const entries = sortedFreq(values);
  return entries.length > 0 ? entries[0][0] : null;
}

// ── Learning rule registry ─────────────────────────────────────────────────────
// Each entry: { key, learn(shootingSessions, allSessions, analyticsPatch) → value }
// shootingSessions — MemorySession[] filtered to type === 'Shooting'
// allSessions      — full MemorySession[] (all types)
// analyticsPatch   — latest CameraAnalytics patch from cameraAnalyticsService
//
// To add a new signal: append one entry here. Nothing else changes.

const LEARNING_RULES = [

  // ── 1. Preferred workflows ──────────────────────────────────────────────────
  {
    key: 'preferredWorkflows',
    learn: (shooting) => {
      const wfFreq = freq(shooting.map(s => s.workflowName).filter(Boolean));
      const total  = shooting.length || 1;
      return Object.entries(wfFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([workflowName, count]) => {
          // Match workflowId from the most recent session with this workflow
          const match = shooting.slice().reverse().find(s => s.workflowName === workflowName);
          return {
            workflowName,
            workflowId: match?.workflowId ?? null,
            count,
            score: clamp(Math.round((count / total) * 100), 1, 100),
          };
        });
    },
  },

  // ── 2. Preferred scenes ─────────────────────────────────────────────────────
  {
    key: 'preferredScenes',
    learn: (shooting) => {
      const scFreq = freq(shooting.map(s => s.title).filter(Boolean));
      const total  = shooting.length || 1;
      return Object.entries(scFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([scene, count]) => ({
          scene,
          count,
          pct: clamp(Math.round((count / total) * 100), 1, 100),
        }));
    },
  },

  // ── 3. Camera setting preferences ──────────────────────────────────────────
  {
    key: 'cameraSettingPreferences',
    learn: (shooting) => {
      if (shooting.length === 0) return null;
      const settings = shooting.map(s => s.cameraSettings).filter(Boolean);

      const resolution   = topValue(settings.map(cs => cs.resolution).filter(Boolean))
                        ?? topValue(shooting.map(s => s.exportResolution).filter(Boolean));
      const fps          = topValue(settings.map(cs => String(cs.fps)).filter(Boolean));
      const flash        = topValue(settings.map(cs => cs.flash).filter(Boolean));
      const stabilization = topValue(settings.map(cs => cs.stabilization).filter(Boolean));

      // HDR: majority vote
      const hdrVotes = settings.map(cs => cs.hdr).filter(v => v != null);
      const hdrOn    = hdrVotes.filter(Boolean).length;
      const hdr      = hdrVotes.length > 0 ? hdrOn >= hdrVotes.length / 2 : null;

      // focusMode / whiteBalance
      const focusMode   = topValue(settings.map(cs => cs.focusMode).filter(Boolean));
      const whiteBalance = topValue(settings.map(cs => cs.whiteBalance).filter(Boolean));

      return {
        resolution,
        fps:           fps ? Number(fps) : null,
        hdr,
        flash,
        stabilization,
        focusMode,
        whiteBalance,
        confidence:    clamp(Math.round((settings.length / shooting.length) * 100), 0, 100),
      };
    },
  },

  // ── 4. Recommendation acceptance behaviour ──────────────────────────────────
  {
    key: 'recommendationBehaviour',
    learn: (shooting, allSessions) => {
      const relevant = allSessions.filter(
        s => typeof s.aiRecommendations === 'number' && s.aiRecommendations > 0,
      );
      const totalOffered   = relevant.reduce((sum, s) => sum + (s.aiRecommendations ?? 0), 0);
      const totalAccepted  = relevant.reduce((sum, s) => sum + (s.aiAccepted ?? 0), 0);
      const acceptanceRate = totalOffered > 0
        ? clamp(Math.round((totalAccepted / totalOffered) * 100), 0, 100)
        : 0;

      // Trend: compare last-3 vs earlier sessions
      const recent   = relevant.slice(0, 3);
      const earlier  = relevant.slice(3, 10);
      const recentRate  = recent.reduce((sum, s) => sum + (s.aiAccepted ?? 0), 0) /
                          Math.max(recent.reduce((sum, s) => sum + (s.aiRecommendations ?? 0), 0), 1);
      const earlierRate = earlier.reduce((sum, s) => sum + (s.aiAccepted ?? 0), 0) /
                          Math.max(earlier.reduce((sum, s) => sum + (s.aiRecommendations ?? 0), 0), 1);
      const trend = recentRate > earlierRate + 0.05 ? 'improving'
                  : recentRate < earlierRate - 0.05 ? 'declining'
                  : 'stable';

      return { acceptanceRate, totalOffered, totalAccepted, trend };
    },
  },

  // ── 5. Shooting habits ──────────────────────────────────────────────────────
  {
    key: 'shootingHabits',
    learn: (shooting, allSessions) => {
      const allStyled   = allSessions.filter(s => s.shootingStyle);
      const favoriteStyle    = topValue(allStyled.map(s => s.shootingStyle));
      const allMoved    = allSessions.flatMap(s => s.cameraMovements ?? []);
      const favoriteMovement = topValue(allMoved);
      const durMinutes  = allSessions
        .map(s => s.durationMinutes)
        .filter(n => typeof n === 'number' && n > 0);
      const avgSessionMinutes = mean(durMinutes);

      // How many unique projects
      const uniqueProjects = new Set(
        allSessions.map(s => s.projectId).filter(Boolean),
      ).size;

      // Shooting vs editing ratio
      const shootingCount = allSessions.filter(s => s.type === 'Shooting').length;
      const editingCount  = allSessions.filter(s => s.type === 'Editing').length;
      const shootEditRatio = editingCount > 0
        ? Math.round((shootingCount / editingCount) * 100) / 100
        : null;

      return {
        favoriteStyle,
        favoriteMovement,
        avgSessionMinutes,
        uniqueProjects,
        shootEditRatio,
      };
    },
  },

  // ── 6. Capture timing preferences ──────────────────────────────────────────
  {
    key: 'captureTimingPreferences',
    learn: (shooting) => {
      if (shooting.length === 0) {
        return { preferredHour: null, preferredDayOfWeek: null, mostActiveWindow: null };
      }

      const dates = shooting
        .map(s => s.completedAt ? new Date(s.completedAt) : null)
        .filter(Boolean);

      const hours      = dates.map(d => d.getHours());
      const daysOfWeek = dates.map(d => d.getDay()); // 0=Sun … 6=Sat

      const preferredHour = roundInt(topValue(hours.map(String)));
      const preferredDayNum = roundInt(topValue(daysOfWeek.map(String)));
      const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const preferredDayOfWeek = DAYS[preferredDayNum] ?? null;

      // Active window: Morning 5–12, Afternoon 12–17, Evening 17–21, Night 21–5
      const windowVotes = hours.map(h => {
        if (h >= 5  && h < 12) return 'Morning';
        if (h >= 12 && h < 17) return 'Afternoon';
        if (h >= 17 && h < 21) return 'Evening';
        return 'Night';
      });
      const mostActiveWindow = topValue(windowVotes);

      // Captures in last 7 / 30 days
      const cutoff7  = daysAgoIso(7);
      const cutoff30 = daysAgoIso(30);
      const capturesLast7  = shooting.filter(s => s.completedAt >= cutoff7).length;
      const capturesLast30 = shooting.filter(s => s.completedAt >= cutoff30).length;

      return {
        preferredHour,
        preferredDayOfWeek,
        mostActiveWindow,
        capturesLast7,
        capturesLast30,
      };
    },
  },

  // ── 7. Confidence trend ─────────────────────────────────────────────────────
  {
    key: 'confidenceTrend',
    learn: (shooting) => {
      const scored = shooting
        .filter(s => typeof s.qualityScoreAfter === 'number' && s.qualityScoreAfter > 0)
        .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

      if (scored.length === 0) {
        return { current: 0, previous: 0, direction: 'flat', delta: 0 };
      }

      const half     = Math.max(1, Math.floor(scored.length / 2));
      const recent   = scored.slice(-half).map(s => s.qualityScoreAfter);
      const earlier  = scored.slice(0, half).map(s => s.qualityScoreAfter);

      const current  = roundInt(mean(recent));
      const previous = roundInt(mean(earlier));
      const delta    = current - previous;
      const direction = delta > 2 ? 'improving' : delta < -2 ? 'declining' : 'stable';

      return { current, previous, direction, delta };
    },
  },

  // ── 8. Learning confidence score ────────────────────────────────────────────
  // Indicates how much data the engine has to work with (0–100).
  // Grows with: total sessions, variety of workflows, variety of scenes.
  {
    key: 'learningConfidence',
    learn: (shooting, allSessions) => {
      const sessionScore   = clamp(allSessions.length * 2,  0, 40); // up to 40 pts
      const workflowScore  = clamp(
        new Set(shooting.map(s => s.workflowName).filter(Boolean)).size * 5,
        0, 30,
      ); // up to 30 pts
      const sceneScore     = clamp(
        new Set(shooting.map(s => s.title).filter(Boolean)).size * 4,
        0, 20,
      ); // up to 20 pts
      const prefScore      = shooting.filter(s => s.cameraSettings).length > 0 ? 10 : 0;

      return clamp(sessionScore + workflowScore + sceneScore + prefScore, 0, 100);
    },
  },

  // ── 9. AI style profile ─────────────────────────────────────────────────────
  // A concise, human-readable sentence describing the creator's shooting style.
  // Used by future AI recommendation prompts and personalization UI.
  {
    key: 'aiStyleProfile',
    learn: (shooting, allSessions) => {
      const style     = topValue(allSessions.map(s => s.shootingStyle).filter(Boolean));
      const movement  = topValue(allSessions.flatMap(s => s.cameraMovements ?? []));
      const workflow  = topValue(shooting.map(s => s.workflowName).filter(Boolean));
      const resolution = topValue(
        shooting.map(s => s.cameraSettings?.resolution ?? s.exportResolution).filter(Boolean),
      );

      if (!style && !workflow) return 'Not enough data to build a style profile yet.';

      const parts = [
        style    && `${style} style`,
        movement && `${movement} movement`,
        workflow && `primarily shoots ${workflow}`,
        resolution && `prefers ${resolution}`,
      ].filter(Boolean);

      return parts.length > 0
        ? `Creator favours ${parts.join(', ')}.`
        : 'Style profile is building…';
    },
  },

  // ── 10. Predicted next workflow ─────────────────────────────────────────────
  // Naive next-workflow prediction based on recency + frequency.
  // [AI_FUTURE] Replace with a sequence model (e.g. watsonx.ai pattern matching).
  {
    key: 'predictedNextWorkflow',
    learn: (shooting) => {
      if (shooting.length < 2) return null;
      // Weight: most recent = higher weight; most frequent = higher weight
      const weights = {};
      shooting.forEach((s, i) => {
        if (!s.workflowName) return;
        const recencyWeight  = (i + 1) / shooting.length;          // 0–1 (newest = high i)
        const frequencyFreq  = freq(shooting.map(ss => ss.workflowName));
        const frequencyWeight = (frequencyFreq[s.workflowName] ?? 1) / shooting.length;
        weights[s.workflowName] = (weights[s.workflowName] ?? 0) + recencyWeight + frequencyWeight;
      });
      const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? sorted[0][0] : null;
    },
  },

  // ── 11. Personalized preset hint ────────────────────────────────────────────
  // Suggests camera settings the creator should use next, based on their
  // favourite settings and the best-performing workflow.
  // [AI_FUTURE] Feed into Adaptive AI Presets module.
  {
    key: 'personalizedPresetHint',
    learn: (shooting) => {
      if (shooting.length === 0) return null;
      // Find sessions from the top workflow with the highest confidence score
      const wfTop = topValue(shooting.map(s => s.workflowName).filter(Boolean));
      const candidates = shooting.filter(s => s.workflowName === wfTop);
      const best = candidates.length > 0
        ? candidates.sort((a, b) => (b.qualityScoreAfter ?? 0) - (a.qualityScoreAfter ?? 0))[0]
        : shooting[0];

      if (!best?.cameraSettings) return null;
      return {
        workflowHint: wfTop,
        settings:     { ...best.cameraSettings },
      };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a CreatorLearningProfile from historical session data.
 *
 * @param {object[]} allSessions    — CreatorMemoryContext.state.sessions (all types)
 * @param {object}   analyticsPatch — latest statistics patch from AnalyticsContext
 * @returns {object}                  CreatorLearningProfile
 */
export function computeLearningProfile(allSessions, analyticsPatch) {
  const sessions   = Array.isArray(allSessions) ? allSessions : [];
  const shooting   = sessions.filter(s => s.type === 'Shooting');
  const analytics  = analyticsPatch ?? {};
  const profile    = { computedAt: new Date().toISOString() };

  for (const { key, learn } of LEARNING_RULES) {
    try {
      profile[key] = learn(shooting, sessions, analytics);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[CreatorLearning] Rule "${key}" failed:`, err.message);
    }
  }

  return profile;
}

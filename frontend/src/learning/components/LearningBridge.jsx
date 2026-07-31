/**
 * learning/components/LearningBridge.jsx — Learning Bridge
 *
 * Module 8.9 — Creator Learning Intelligence
 *
 * Renderless React component that bridges CreatorMemoryContext +
 * AnalyticsContext → CreatorLearningContext.  Returns null; only runs effects.
 *
 * ── Responsibility ────────────────────────────────────────────────────────────
 * When the CreatorMemoryContext session list grows (new camera captures arrive
 * via CameraMemoryBridge from Module 8.7), this bridge:
 *   1. Calls computeLearningProfile(sessions, statistics) from
 *      creatorLearningService — pure function, zero side effects.
 *   2. Writes the resulting CreatorLearningProfile into
 *      CreatorLearningContext via updateProfile().
 *
 * Any UI that calls useCreatorLearning() then automatically reflects the
 * updated profile without polling or manual triggering.
 *
 * ── Why a separate component (not inside a context)? ─────────────────────────
 * CreatorMemoryContext, AnalyticsContext, and CreatorLearningContext are
 * independent.  This component is the only file that consumes all three —
 * preserving full context decoupling.  Removing it reverts to Module 8.8
 * behaviour with zero changes elsewhere.
 *
 * ── Re-render guards ──────────────────────────────────────────────────────────
 * Two independent useRef guards — one per change signal — prevent StrictMode
 * double-invocation and redundant recomputes:
 *   1. lastProcessedCount   — session list growth (new captures)
 *   2. lastStatisticsKey    — analytics statistics update (generatedAt timestamp)
 *
 * ── Failure isolation ─────────────────────────────────────────────────────────
 * All errors are caught and console.warn'd.  A learning pipeline failure
 * never propagates to the camera, memory, or analytics modules.
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Mounted inside App.jsx as a sibling of AnalyticsBridge, inside BrowserRouter
 * which is inside CreatorLearningProvider, which is inside AnalyticsProvider,
 * which is inside CreatorMemoryProvider — so all three context hooks resolve.
 */

import { useEffect, useRef }          from 'react';
import { useCreatorMemory }           from '../../memory/hooks/useCreatorMemory';
import { useAnalytics }               from '../../analytics/hooks/useAnalytics';
import { useCreatorLearning }         from '../hooks/useCreatorLearning';
import { computeLearningProfile }     from '../services/creatorLearningService';

export default function LearningBridge() {
  const { state: memoryState }     = useCreatorMemory();
  const { state: analyticsState }  = useAnalytics();
  const { updateProfile }          = useCreatorLearning();

  const { sessions }    = memoryState;
  const { statistics }  = analyticsState;

  // Track last processed session count and statistics key to prevent redundant recomputes.
  const lastProcessedCount  = useRef(-1);
  const lastStatisticsKey   = useRef(null);

  useEffect(() => {
    const count         = sessions?.length          ?? 0;
    const statisticsKey = statistics?.generatedAt   ?? null;

    const sessionsChanged   = count         !== lastProcessedCount.current;
    const statisticsChanged = statisticsKey !== lastStatisticsKey.current;

    // Only recompute when sessions or statistics have actually changed.
    if (!sessionsChanged && !statisticsChanged) return;

    lastProcessedCount.current = count;
    lastStatisticsKey.current  = statisticsKey;

    try {
      const profile = computeLearningProfile(sessions, statistics);
      updateProfile(profile);
    } catch (err) {
      // Never let bridge errors surface to other features.
      // eslint-disable-next-line no-console
      console.warn('[LearningBridge] Failed to compute/apply learning profile:', err.message);
    }
  }, [sessions, statistics, updateProfile]);

  // Renderless.
  return null;
}

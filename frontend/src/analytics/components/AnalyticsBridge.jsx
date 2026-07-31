/**
 * analytics/components/AnalyticsBridge.jsx — Analytics Bridge
 *
 * Module 8.8 — Creator Analytics Intelligence
 *
 * Renderless React component that bridges CreatorMemoryContext and
 * AnalyticsContext.  Renders null and only runs a side-effect.
 *
 * ── Responsibility ────────────────────────────────────────────────────────────
 * When CreatorMemoryContext's session list changes (new camera captures arrive
 * via CameraMemoryBridge from Module 8.7), this bridge:
 *   1. Calls computeCameraAnalytics(sessions) from cameraAnalyticsService
 *   2. Calls AnalyticsContext.updateMetrics(patch) to merge the results
 *
 * The analytics dashboard then shows live camera-capture statistics without
 * any component changes — it reads the same AnalyticsContext fields it
 * already consumed from mock data.
 *
 * ── Why a separate component (not a hook inside AnalyticsContext)? ─────────────
 * AnalyticsContext and CreatorMemoryContext are independent.  Neither imports
 * the other.  This component is the only file that consumes both — preserving
 * full context decoupling.  Removing it reverts to Module 8.7 behaviour with
 * zero changes elsewhere.
 *
 * ── Re-render guard ───────────────────────────────────────────────────────────
 * The effect depends on state.sessions.length so it only fires when the
 * session count changes — not on every unrelated state update.
 * A ref tracks the last-processed count to guard against StrictMode
 * double-invocation.
 *
 * ── Failure isolation ─────────────────────────────────────────────────────────
 * All errors are caught and console.warn'd — the analytics pipeline failure
 * never propagates to the camera or memory modules.
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Mounted inside App.jsx, as a child of the AnalyticsProvider, which is itself
 * inside CreatorMemoryProvider — so both context hooks are satisfied.
 */

import { useEffect, useRef }        from 'react';
import { useCreatorMemory }         from '../../memory/hooks/useCreatorMemory';
import { useAnalytics }             from '../hooks/useAnalytics';
import { computeCameraAnalytics }   from '../services/cameraAnalyticsService';

export default function AnalyticsBridge() {
  const { state: memoryState }   = useCreatorMemory();
  const { updateMetrics }        = useAnalytics();
  const { sessions }             = memoryState;

  // Track last processed session count to prevent redundant recomputes.
  const lastProcessedCount = useRef(-1);

  useEffect(() => {
    const count = sessions?.length ?? 0;

    // Only recompute when session count has actually changed.
    if (count === lastProcessedCount.current) return;
    lastProcessedCount.current = count;

    try {
      const patch = computeCameraAnalytics(sessions);
      updateMetrics(patch);
    } catch (err) {
      // Never let bridge errors surface to other features.
      // eslint-disable-next-line no-console
      console.warn('[AnalyticsBridge] Failed to compute/apply analytics:', err.message);
    }
  }, [sessions, updateMetrics]);

  // Renderless.
  return null;
}

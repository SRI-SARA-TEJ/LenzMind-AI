/**
 * assistant/components/AssistantBridge.jsx — Assistant Bridge
 *
 * Module 10.1 — Realis AI Creator Assistant
 *
 * Renderless React component that bridges:
 *   CreatorLearningContext + AnalyticsContext + CreatorMemoryContext
 *   → CreatorAssistantContext
 *
 * Returns null; only runs effects.
 *
 * ── Responsibility ────────────────────────────────────────────────────────────
 * This bridge fires when any of three signals change:
 *   1. CreatorMemoryContext session count increases (new capture)
 *   2. CreatorLearningContext profile is recomputed (learning update)
 *   3. CreatorAssistantContext.refreshTick increments (manual refresh)
 *
 * On each fire it:
 *   1. Sets isGenerating = true (optional shimmer in UI)
 *   2. Calls generateBriefing(...) from creatorAssistantService (pure)
 *   3. Writes the result to CreatorAssistantContext via setBriefing()
 *
 * ── Why a separate component? ─────────────────────────────────────────────────
 * CreatorAssistantContext does not import any other context.  This bridge
 * is the only file that consumes all four contexts — preserving full context
 * decoupling.  Removing it resets the assistant to a blank briefing with zero
 * changes elsewhere.
 *
 * ── Re-render guards ──────────────────────────────────────────────────────────
 * • A ref tracks the last-processed session count to prevent duplicate
 *   runs when only unrelated state fields change.
 * • The learning profile key (computedAt) is tracked separately so a
 *   new learning update always regenerates the briefing even if session
 *   count is unchanged.
 * • StrictMode double-invocation is blocked by both refs.
 *
 * ── Failure isolation ─────────────────────────────────────────────────────────
 * All errors are caught and console.warn'd.  A briefing failure never
 * propagates to the camera, memory, analytics, or learning modules.
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Mounted inside App.jsx as a sibling of AnalyticsBridge and LearningBridge,
 * inside BrowserRouter which is inside CreatorAssistantProvider which is
 * inside CreatorLearningProvider — so all four context hooks are satisfied.
 */

import { useEffect, useRef } from 'react';

import { useCreatorMemory }    from '../../memory/hooks/useCreatorMemory';
import { useAnalytics }        from '../../analytics/hooks/useAnalytics';
import { useCreatorLearning }  from '../../learning/hooks/useCreatorLearning';
import { useCreatorAssistant } from '../hooks/useCreatorAssistant';
import { generateBriefing }    from '../services/creatorAssistantService';

export default function AssistantBridge() {
  const { state: memoryState, creatorStats }   = useCreatorMemory();
  const { state: analyticsState }              = useAnalytics();
  const { profile: learningProfile }           = useCreatorLearning();
  const { state: assistantState, setBriefing, setGenerating } = useCreatorAssistant();

  const { sessions } = memoryState;
  const { statistics } = analyticsState;

  // ── Guards ──────────────────────────────────────────────────────────────────
  // Prevent redundant generation when only unrelated fields changed.
  const lastSessionCount   = useRef(-1);
  const lastLearningKey    = useRef(null);
  const lastRefreshTick    = useRef(-1);

  useEffect(() => {
    const sessionCount  = sessions?.length ?? 0;
    const learningKey   = learningProfile?.computedAt ?? null;
    const refreshTick   = assistantState?.refreshTick ?? 0;

    const sessionChanged  = sessionCount  !== lastSessionCount.current;
    const learningChanged = learningKey   !== lastLearningKey.current;
    const refreshRequested= refreshTick   !== lastRefreshTick.current;

    // Only regenerate when something meaningful changed
    if (!sessionChanged && !learningChanged && !refreshRequested) return;

    lastSessionCount.current  = sessionCount;
    lastLearningKey.current   = learningKey;
    lastRefreshTick.current   = refreshTick;

    setGenerating(true);
    try {
      const briefing = generateBriefing(
        learningProfile,
        statistics,
        memoryState.profile,
        {
          totalSessions:         sessionCount,
          bestQualityScore:      creatorStats?.bestQualityScore      ?? 0,
          averageQualityScore:   creatorStats?.averageQualityScore   ?? 0,
          currentStreak:         0,
          aiAcceptanceRate:      creatorStats?.aiAcceptanceRate      ?? 0,
          favoriteShootingStyle: creatorStats?.favoriteShootingStyle ?? null,
        },
      );
      setBriefing(briefing);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[AssistantBridge] Failed to generate briefing:', err.message);
    } finally {
      setGenerating(false);
    }
  // Intentionally broad deps — the ref guards ensure we only do real work
  // when sessionCount, learningKey, or refreshTick actually changed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, learningProfile, assistantState?.refreshTick, setBriefing]);

  // Renderless.
  return null;
}

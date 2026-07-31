/**
 * coach/components/CoachBridge.jsx — Creator Coach Bridge
 *
 * Module 10.3 — Realis Creator Coach Engine
 *
 * Renderless React component that bridges all five upstream intelligence
 * contexts into CreatorCoachContext.  Returns null; only runs effects.
 *
 * ── Responsibility ────────────────────────────────────────────────────────────
 * Calls generateCoachSession() from creatorCoachService whenever any of five
 * signals change, then writes the result to CreatorCoachContext via
 * setCoachSession().  The coach session is therefore always in sync with the
 * latest state of every upstream intelligence layer.
 *
 * ── Fire conditions ────────────────────────────────────────────────────────────
 * Regenerates the coach session when any of five signals change:
 *   1. CreatorMemoryContext session count (new capture arrived)
 *   2. CreatorLearningContext profile computedAt (learning recomputed)
 *   3. CreatorAssistantContext briefing generatedAt (briefing refreshed)
 *   4. CreatorMissionContext mission generatedAt (mission regenerated)
 *   5. CreatorCoachContext refreshTick (manual refresh requested)
 *
 * ── Re-render guards ──────────────────────────────────────────────────────────
 * Five independent useRef guards — one per signal — prevent StrictMode
 * double-invocation and redundant recomputes when only unrelated state
 * fields change.
 *
 * ── Failure isolation ─────────────────────────────────────────────────────────
 * All errors are caught and console.warn'd.  A coaching failure never
 * propagates to the camera, memory, analytics, learning, assistant, or
 * mission modules.
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Mounted in App.jsx as a sibling of MissionBridge, inside BrowserRouter,
 * inside CreatorCoachProvider (new innermost), inside CreatorMissionProvider.
 * All six context hooks are therefore satisfied.
 */

import { useEffect, useRef }       from 'react';

import { useCreatorMemory }        from '../../memory/hooks/useCreatorMemory';
import { useAnalytics }            from '../../analytics/hooks/useAnalytics';
import { useCreatorLearning }      from '../../learning/hooks/useCreatorLearning';
import { useCreatorAssistant }     from '../../assistant/hooks/useCreatorAssistant';
import { useCreatorMission }       from '../../mission/hooks/useCreatorMission';
import { useCreatorCoach }         from '../hooks/useCreatorCoach';
import { generateCoachSession }    from '../services/creatorCoachService';

export default function CoachBridge() {
  const { state: memoryState, creatorStats }    = useCreatorMemory();
  const { state: analyticsState }               = useAnalytics();
  const { profile: learningProfile }            = useCreatorLearning();
  const { briefing }                            = useCreatorAssistant();
  const { mission }                             = useCreatorMission();
  const { state: coachState, setCoachSession, setGenerating } = useCreatorCoach();

  const { sessions } = memoryState;
  const { statistics } = analyticsState;

  // ── Guards — one ref per change signal ─────────────────────────────────────
  const lastSessionCount = useRef(-1);
  const lastLearningKey  = useRef(null);
  const lastBriefingKey  = useRef(null);
  const lastMissionKey   = useRef(null);
  const lastRefreshTick  = useRef(-1);

  useEffect(() => {
    const sessionCount = sessions?.length            ?? 0;
    const learningKey  = learningProfile?.computedAt ?? null;
    const briefingKey  = briefing?.generatedAt       ?? null;
    const missionKey   = mission?.generatedAt        ?? null;
    const refreshTick  = coachState?.refreshTick     ?? 0;

    const sessionChanged   = sessionCount !== lastSessionCount.current;
    const learningChanged  = learningKey  !== lastLearningKey.current;
    const briefingChanged  = briefingKey  !== lastBriefingKey.current;
    const missionChanged   = missionKey   !== lastMissionKey.current;
    const refreshRequested = refreshTick  !== lastRefreshTick.current;

    // Only regenerate when something meaningful actually changed.
    if (!sessionChanged && !learningChanged && !briefingChanged && !missionChanged && !refreshRequested) return;

    lastSessionCount.current = sessionCount;
    lastLearningKey.current  = learningKey;
    lastBriefingKey.current  = briefingKey;
    lastMissionKey.current   = missionKey;
    lastRefreshTick.current  = refreshTick;

    setGenerating(true);
    try {
      const coachSession = generateCoachSession(
        learningProfile,
        statistics,
        {
          totalSessions:         sessionCount,
          averageQualityScore:   creatorStats?.averageQualityScore   ?? 0,
          bestQualityScore:      creatorStats?.bestQualityScore      ?? 0,
          currentStreak:         0,
          aiAcceptanceRate:      creatorStats?.aiAcceptanceRate      ?? 0,
          favoriteShootingStyle: creatorStats?.favoriteShootingStyle ?? null,
        },
        briefing,
        mission,
      );
      setCoachSession(coachSession);
    } catch (err) {
      // Never let bridge errors surface to other features.
      // eslint-disable-next-line no-console
      console.warn('[CoachBridge] Failed to generate coach session:', err.message);
    } finally {
      setGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, learningProfile, briefing, mission, coachState?.refreshTick, setCoachSession]);

  // Renderless.
  return null;
}

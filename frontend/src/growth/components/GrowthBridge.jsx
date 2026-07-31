/**
 * growth/components/GrowthBridge.jsx — Creator Growth Bridge
 *
 * Module 10.4 — Realis Creator Growth Engine
 *
 * Renderless React component that bridges all six upstream intelligence
 * contexts into CreatorGrowthContext.  Returns null; only runs effects.
 *
 * ── Responsibility ────────────────────────────────────────────────────────────
 * Calls generateGrowthPlan() from creatorGrowthService whenever any of six
 * signals change, then writes the result to CreatorGrowthContext via
 * setGrowthPlan().  The growth plan is therefore always in sync with the
 * latest state of every upstream intelligence layer.
 *
 * ── Fire conditions ────────────────────────────────────────────────────────────
 * Regenerates the growth plan when any of six signals change:
 *   1. CreatorMemoryContext session count (new capture arrived)
 *   2. CreatorLearningContext profile computedAt (learning recomputed)
 *   3. CreatorAssistantContext briefing generatedAt (briefing refreshed)
 *   4. CreatorMissionContext mission generatedAt (mission regenerated)
 *   5. CreatorCoachContext coachSession generatedAt (coach session updated)
 *   6. CreatorGrowthContext refreshTick (manual refresh requested)
 *
 * ── Re-render guards ──────────────────────────────────────────────────────────
 * Six independent useRef guards — one per signal — prevent StrictMode
 * double-invocation and redundant recomputes when only unrelated state
 * fields change.
 *
 * ── Failure isolation ─────────────────────────────────────────────────────────
 * All errors are caught and console.warn'd.  A growth planning failure never
 * propagates to any other module.
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Mounted in App.jsx as a sibling of CoachBridge, inside BrowserRouter,
 * inside CreatorGrowthProvider (new innermost), inside CreatorCoachProvider.
 * All seven context hooks are therefore satisfied.
 */

import { useEffect, useRef }       from 'react';

import { useCreatorMemory }        from '../../memory/hooks/useCreatorMemory';
import { useAnalytics }            from '../../analytics/hooks/useAnalytics';
import { useCreatorLearning }      from '../../learning/hooks/useCreatorLearning';
import { useCreatorAssistant }     from '../../assistant/hooks/useCreatorAssistant';
import { useCreatorMission }       from '../../mission/hooks/useCreatorMission';
import { useCreatorCoach }         from '../../coach/hooks/useCreatorCoach';
import { useCreatorGrowth }        from '../hooks/useCreatorGrowth';
import { generateGrowthPlan }      from '../services/creatorGrowthService';

export default function GrowthBridge() {
  const { state: memoryState, creatorStats }   = useCreatorMemory();
  const { state: analyticsState }              = useAnalytics();
  const { profile: learningProfile }           = useCreatorLearning();
  const { briefing }                           = useCreatorAssistant();
  const { mission }                            = useCreatorMission();
  const { coachSession }                       = useCreatorCoach();
  const { state: growthState, setGrowthPlan, setGenerating } = useCreatorGrowth();

  const { sessions } = memoryState;
  const { statistics } = analyticsState;

  // ── Guards — one ref per change signal ─────────────────────────────────────
  const lastSessionCount = useRef(-1);
  const lastLearningKey  = useRef(null);
  const lastBriefingKey  = useRef(null);
  const lastMissionKey   = useRef(null);
  const lastCoachKey     = useRef(null);
  const lastRefreshTick  = useRef(-1);

  useEffect(() => {
    const sessionCount = sessions?.length              ?? 0;
    const learningKey  = learningProfile?.computedAt   ?? null;
    const briefingKey  = briefing?.generatedAt         ?? null;
    const missionKey   = mission?.generatedAt          ?? null;
    const coachKey     = coachSession?.generatedAt     ?? null;
    const refreshTick  = growthState?.refreshTick      ?? 0;

    const sessionChanged   = sessionCount !== lastSessionCount.current;
    const learningChanged  = learningKey  !== lastLearningKey.current;
    const briefingChanged  = briefingKey  !== lastBriefingKey.current;
    const missionChanged   = missionKey   !== lastMissionKey.current;
    const coachChanged     = coachKey     !== lastCoachKey.current;
    const refreshRequested = refreshTick  !== lastRefreshTick.current;

    // Only regenerate when something meaningful actually changed.
    if (!sessionChanged && !learningChanged && !briefingChanged &&
        !missionChanged && !coachChanged && !refreshRequested) return;

    lastSessionCount.current = sessionCount;
    lastLearningKey.current  = learningKey;
    lastBriefingKey.current  = briefingKey;
    lastMissionKey.current   = missionKey;
    lastCoachKey.current     = coachKey;
    lastRefreshTick.current  = refreshTick;

    setGenerating(true);
    try {
      const growthPlan = generateGrowthPlan(
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
        coachSession,
      );
      setGrowthPlan(growthPlan);
    } catch (err) {
      // Never let bridge errors surface to other features.
      // eslint-disable-next-line no-console
      console.warn('[GrowthBridge] Failed to generate growth plan:', err.message);
    } finally {
      setGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, learningProfile, briefing, mission, coachSession, growthState?.refreshTick, setGrowthPlan, setGenerating]);

  // Renderless.
  return null;
}

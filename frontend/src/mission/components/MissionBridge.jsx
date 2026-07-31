/**
 * mission/components/MissionBridge.jsx — Mission Bridge
 *
 * Module 10.2 — Realis Creator Mission Engine
 *
 * Renderless React component that bridges:
 *   CreatorLearningContext + AnalyticsContext + CreatorMemoryContext
 *   + CreatorAssistantContext  →  CreatorMissionContext
 *
 * Returns null; only runs effects.
 *
 * ── Fire conditions ────────────────────────────────────────────────────────────
 * Regenerates the mission when any of four signals change:
 *   1. CreatorMemoryContext session count (new capture arrived)
 *   2. CreatorLearningContext profile computedAt (learning recomputed)
 *   3. CreatorAssistantContext briefing generatedAt (briefing refreshed)
 *   4. CreatorMissionContext refreshTick (manual refresh requested)
 *
 * ── Re-render guards ──────────────────────────────────────────────────────────
 * Four independent useRef guards — one per signal — prevent StrictMode
 * double-invocation and redundant recomputes.
 *
 * ── Failure isolation ─────────────────────────────────────────────────────────
 * All errors are caught and console.warn'd.  Mission failures never propagate
 * to the camera, memory, analytics, learning, or assistant modules.
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Mounted in App.jsx as a sibling of AssistantBridge, inside BrowserRouter,
 * inside CreatorMissionProvider (innermost), inside CreatorAssistantProvider.
 */

import { useEffect, useRef } from 'react';

import { useCreatorMemory }   from '../../memory/hooks/useCreatorMemory';
import { useAnalytics }       from '../../analytics/hooks/useAnalytics';
import { useCreatorLearning } from '../../learning/hooks/useCreatorLearning';
import { useCreatorAssistant }from '../../assistant/hooks/useCreatorAssistant';
import { useCreatorMission }  from '../hooks/useCreatorMission';
import { generateMission }    from '../services/creatorMissionService';

export default function MissionBridge() {
  const { state: memoryState, creatorStats }   = useCreatorMemory();
  const { state: analyticsState }              = useAnalytics();
  const { profile: learningProfile }           = useCreatorLearning();
  const { briefing }                           = useCreatorAssistant();
  const { state: missionState, setMission, setGenerating } = useCreatorMission();

  const { sessions } = memoryState;
  const { statistics } = analyticsState;

  // ── Guards ──────────────────────────────────────────────────────────────────
  const lastSessionCount  = useRef(-1);
  const lastLearningKey   = useRef(null);
  const lastBriefingKey   = useRef(null);
  const lastRefreshTick   = useRef(-1);

  useEffect(() => {
    const sessionCount  = sessions?.length         ?? 0;
    const learningKey   = learningProfile?.computedAt ?? null;
    const briefingKey   = briefing?.generatedAt       ?? null;
    const refreshTick   = missionState?.refreshTick   ?? 0;

    const sessionChanged   = sessionCount !== lastSessionCount.current;
    const learningChanged  = learningKey  !== lastLearningKey.current;
    const briefingChanged  = briefingKey  !== lastBriefingKey.current;
    const refreshRequested = refreshTick  !== lastRefreshTick.current;

    if (!sessionChanged && !learningChanged && !briefingChanged && !refreshRequested) return;

    lastSessionCount.current = sessionCount;
    lastLearningKey.current  = learningKey;
    lastBriefingKey.current  = briefingKey;
    lastRefreshTick.current  = refreshTick;

    setGenerating(true);
    try {
      const mission = generateMission(
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
      );
      setMission(mission);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[MissionBridge] Failed to generate mission:', err.message);
    } finally {
      setGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, learningProfile, briefing, missionState?.refreshTick, setMission]);

  return null;
}

/**
 * camera/components/CameraMemoryBridge.jsx — Creator Memory Bridge
 *
 * Module 8.7 — Creator Memory Integration
 *
 * Renderless React component that bridges CameraContext and
 * CreatorMemoryContext.  It renders null and only runs a side-effect.
 *
 * ── Responsibility ────────────────────────────────────────────────────────────
 * When CameraContext produces a new latestMemoryEntry (after every successful
 * AI image analysis), this bridge converts it to a MemorySession via
 * cameraEntryToSession() and calls addSession() on CreatorMemoryContext.
 *
 * The session then appears natively in:
 *   - Creator Memory Timeline (type: Shooting)
 *   - Creator Memory Dashboard stats (totalShootingSessions, totalSessions)
 *   - Pattern detection (shootingStyle, workflow usage)
 *
 * ── Why a separate component instead of cross-context hook calls? ─────────────
 * CameraContext and CreatorMemoryContext are independent; neither knows about
 * the other.  This component is the only place that imports from both — keeping
 * both contexts fully decoupled.  Removing this component entirely would revert
 * to Module 8.6 behaviour with zero changes required in either context.
 *
 * ── Duplicate guard ───────────────────────────────────────────────────────────
 * The effect depends on latestMemoryEntry.id.  Since CameraContext already
 * deduplicates at entry-creation time (isDuplicate), each unique id fires the
 * effect exactly once.  An additional session-id check guards against StrictMode
 * double-invocation.
 *
 * ── Failure isolation ─────────────────────────────────────────────────────────
 * Any error in the bridge is caught and console.warn'd.  It never propagates
 * to the camera capture pipeline.
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Mounted inside CameraScreen, which already wraps CameraProvider.
 * CameraScreen is rendered inside a route that is itself a descendant of
 * CreatorMemoryProvider (lifted to App.jsx in Module 8.7).
 */

import { useEffect, useRef } from 'react';
import { useCamera }         from '../context/CameraContext';
import { useCreatorMemory }  from '../../memory/hooks/useCreatorMemory';
import { cameraEntryToSession } from '../services/creatorMemoryService';

export default function CameraMemoryBridge() {
  const { state: cameraState }           = useCamera();
  const { addSession }                   = useCreatorMemory();
  const { latestMemoryEntry }            = cameraState;

  // Track the last-synced entry id to prevent duplicate session additions.
  // This guard handles React StrictMode double-mount and any future cases where
  // the component remounts while the same latestMemoryEntry is still present.
  const lastSyncedId = useRef(null);

  useEffect(() => {
    if (!latestMemoryEntry) return;
    if (latestMemoryEntry.id === lastSyncedId.current) return;

    lastSyncedId.current = latestMemoryEntry.id;

    try {
      const session = cameraEntryToSession(latestMemoryEntry);
      addSession(session);
    } catch (err) {
      // Never let bridge errors surface to the camera screen.
      // eslint-disable-next-line no-console
      console.warn('[CameraMemoryBridge] Failed to sync session to CreatorMemory:', err.message);
    }
  }, [latestMemoryEntry, addSession]);

  // Renderless — returns null always.
  return null;
}

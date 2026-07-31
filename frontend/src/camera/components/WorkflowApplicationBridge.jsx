/**
 * camera/components/WorkflowApplicationBridge.jsx — Workflow Application Bridge
 *
 * Module 8.5 — Workflow Application Integration
 *
 * Renderless React component that bridges CameraContext and WorkflowContext.
 * It renders null and only runs a side-effect.
 *
 * ── Responsibility ────────────────────────────────────────────────────────────
 * Whenever the activeWorkflow in CameraContext changes, this bridge calls
 * WorkflowContext.incrementUsage() for that workflow's id, keeping the library's
 * usageCount and lastUsedAt fields current without coupling CameraContext to
 * WorkflowContext directly.
 *
 * ── Why a separate component instead of cross-context hook calls? ─────────────
 * CameraContext and WorkflowContext are independent; neither knows about the
 * other.  This component is the only place that imports from both — keeping
 * both contexts fully decoupled.  Removing this component entirely would revert
 * to pre-bridge behaviour with zero changes required in either context.
 *
 * ── Duplicate guard ───────────────────────────────────────────────────────────
 * A useRef tracks the last workflow id that had its usage incremented.  If the
 * same workflow id is seen again (e.g. React StrictMode double-mount, or the
 * component remounts while the same activeWorkflow is still present) the effect
 * exits early, preventing double-counting.
 *
 * ── Initial-mount guard ───────────────────────────────────────────────────────
 * CameraContext pre-populates activeWorkflow with MOCK_WORKFLOWS[0] as its
 * default state.  Without a mount guard the effect would fire on the very first
 * render and increment usage for that default workflow even though the user has
 * not selected it.  A second useRef (isMounted) is set to true after the first
 * effect evaluation so that initial-mount increments are suppressed while all
 * subsequent user-driven workflow changes continue to fire normally.
 *
 * ── Failure isolation ─────────────────────────────────────────────────────────
 * Any error in the bridge is caught and console.warn'd.  It never propagates
 * to the camera capture pipeline.
 *
 * ── Mounting ──────────────────────────────────────────────────────────────────
 * Mounted inside CameraScreen, which already wraps CameraProvider.
 * CameraScreen is rendered inside a route that is itself a descendant of
 * WorkflowProvider (lifted to App.jsx in Module 8.5).
 */

import { useEffect, useRef }        from 'react';
import { useCamera }                from '../context/CameraContext';
import { useWorkflowContext }        from '../../workflow/context/WorkflowContext';

export default function WorkflowApplicationBridge() {
  const { state: cameraState }    = useCamera();
  const { incrementUsage }        = useWorkflowContext();
  const { activeWorkflow }        = cameraState;

  // Prevents double-counting on StrictMode double-mount and remounts where
  // the same activeWorkflow is still in camera state.
  const lastIncrementedId = useRef(null);

  // Suppresses the increment that would otherwise fire on initial mount due to
  // CameraContext pre-populating activeWorkflow with a default value.
  const isMounted = useRef(false);

  useEffect(() => {
    // Skip the very first evaluation — the default workflow is already active,
    // no user action has occurred.
    if (!isMounted.current) {
      isMounted.current = true;
      // Seed the id guard so that if the user selects this same default workflow
      // it still won't double-count (the guard would block it as unchanged).
      if (activeWorkflow?.id) {
        lastIncrementedId.current = activeWorkflow.id;
      }
      return;
    }

    if (!activeWorkflow?.id) return;
    if (activeWorkflow.id === lastIncrementedId.current) return;

    lastIncrementedId.current = activeWorkflow.id;

    try {
      incrementUsage(activeWorkflow.id);
    } catch (err) {
      // Never let bridge errors surface to the camera screen.
      // eslint-disable-next-line no-console
      console.warn('[WorkflowApplicationBridge] Failed to increment usage for workflow:', err.message);
    }
  }, [activeWorkflow, incrementUsage]);

  // Renderless — returns null always.
  return null;
}

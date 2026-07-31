/**
 * camera/CameraScreen.jsx — Primary Camera Home Screen
 *
 * Layout (top → bottom):
 *   ┌────────────────────────────────────┐
 *   │  TopStatusBar (absolute, overlay)  │
 *   │                                    │
 *   │  CameraPreview (~72% of height)    │
 *   │  ─ AISuggestionCard (overlay)      │
 *   │                                    │
 *   │  CaptureControls                   │
 *   │  ─ WorkflowIndicator above row     │
 *   │                                    │
 *   │  AIStatusIndicator (overlay pill)  │
 *   │  BottomNavBar                      │
 *   └────────────────────────────────────┘
 *
 * The whole screen is wrapped by CameraProvider so all
 * sub-components share the same reactive state.
 *
 * Renderless bridges mounted inside CameraScreenInner:
 *   CameraMemoryBridge          (Module 8.7) — syncs camera analyses → CreatorMemory
 *   WorkflowApplicationBridge   (Module 8.5) — increments usageCount in WorkflowContext
 */

import React from 'react';
import styles from './CameraScreen.module.css';
import { CameraProvider } from './context/CameraContext';

import CameraPreview        from './components/CameraPreview';
import TopStatusBar         from './components/TopStatusBar';
import AISuggestionCard     from './components/AISuggestionCard';
import CaptureControls      from './components/CaptureControls';
import AIStatusIndicator    from './components/AIStatusIndicator';
import BottomNavBar         from './components/BottomNavBar';
import CameraMemoryBridge             from './components/CameraMemoryBridge';
import WorkflowApplicationBridge      from './components/WorkflowApplicationBridge';

function CameraScreenInner() {
  return (
    <div className={styles.screen}>

      {/* ── Preview zone: camera + overlays ─────────────────────────────── */}
      <div className={styles.previewZone}>
        {/* Live camera preview (fills zone) */}
        <CameraPreview />

        {/* Top overlays */}
        <TopStatusBar />

        {/* AI Suggestion floats above capture zone */}
        <AISuggestionCard />
      </div>

      {/* ── Capture controls (fixed height) ─────────────────────────────── */}
      <div className={styles.controlsZone}>
        <CaptureControls />
      </div>

      {/* ── AI status pill (absolute over controls zone) ─────────────────── */}
      <div className={styles.statusPill}>
        <AIStatusIndicator />
      </div>

      {/* ── Bottom navigation ────────────────────────────────────────────── */}
      <BottomNavBar />

      {/*
        Module 8.7 — Creator Memory Bridge (renderless).
        Watches latestMemoryEntry in CameraContext and forwards each new
        entry to CreatorMemoryContext.addSession() as a Shooting session.
        CreatorMemoryProvider is an ancestor (lifted to App.jsx).
      */}
      <CameraMemoryBridge />

      {/*
        Module 8.5 — Workflow Application Bridge (renderless).
        Watches activeWorkflow in CameraContext and calls
        WorkflowContext.incrementUsage() whenever it changes.
        WorkflowProvider is an ancestor (lifted to App.jsx in Module 8.5).
      */}
      <WorkflowApplicationBridge />
    </div>
  );
}

export default function CameraScreen() {
  return (
    <CameraProvider>
      <CameraScreenInner />
    </CameraProvider>
  );
}

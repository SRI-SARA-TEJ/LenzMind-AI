/**
 * editing/EditingScreen.jsx — AI Editing Intelligence Main Screen
 *
 * Internal screen router (no react-router) via state.activeSession state:
 *   'idle'        — no active session → AnalysisScreen (idle landing)
 *   'analysing'   — analysis running  → AnalysisScreen (running)
 *   'reviewing'   — analysis done     → SuggestionPanel
 *   'applying'    → SuggestionPanel
 *   'complete'    → ExportScreen      (configure export settings)
 *   'optimizing'  → AIOptimizationScreen (AI tune + platform readiness)
 *   'exporting'   → EditingSummary    (final session summary)
 *
 * This module wraps itself in EditingProvider.
 * BottomNavBar handles navigation back to other modules.
 */

import React from 'react';
import styles from './EditingScreen.module.css';

import { EditingProvider }        from './context/EditingContext';
import { useEditing }             from './hooks/useEditing';

import AnalysisScreen             from './components/AnalysisScreen';
import SuggestionPanel            from './components/SuggestionPanel';
import ExportScreen               from './components/ExportScreen';
import AIOptimizationScreen       from './components/AIOptimizationScreen';
import EditingSummary             from './components/EditingSummary';

import BottomNavBar               from '../camera/components/BottomNavBar';

// ── Home / landing — shown when no active session ─────────────────────────────
function EditingHome({ onNewSession }) {
  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.topTitle}>AI Editing</h1>
          <p className={styles.topSub}>Editing Intelligence Module</p>
        </div>
        <div className={styles.aiBadge}>
          <span className={styles.aiBadgeDot} />
          AI Active
        </div>
      </div>

      <div className={styles.content}>
        {/* Hero card */}
        <div className={styles.heroCard}>
          <div className={styles.heroCardTop}>
            <span className={styles.heroBadge}>✦ IBM watsonx.ai</span>
          </div>
          <h2 className={styles.heroTitle}>AI Editing Intelligence</h2>
          <p className={styles.heroSub}>
            Automatically detect and fix lighting, audio, stability, colour, privacy issues and more.
          </p>
          <button className={styles.heroBtn} onClick={onNewSession}>
            Start New Analysis →
          </button>
        </div>

        {/* Capabilities list */}
        <p className={styles.sectionLabel}>What AI Analyses</p>
        <div className={styles.capGrid}>
          {[
            { icon: '💡', label: 'Lighting & Exposure' },
            { icon: '🎨', label: 'Colour Grading' },
            { icon: '🎙', label: 'Audio Cleanup' },
            { icon: '🎥', label: 'Camera Shake' },
            { icon: '👤', label: 'Face Detection' },
            { icon: '🔒', label: 'Privacy Issues' },
            { icon: '✂️', label: 'Dead Footage' },
            { icon: '💬', label: 'Caption Generation' },
          ].map(({ icon, label }) => (
            <div key={label} className={styles.capItem}>
              <span className={styles.capIcon}>{icon}</span>
              <span className={styles.capLabel}>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.futureCard}>
          <span className={styles.futureBadge}>✦ Coming Soon</span>
          <h3 className={styles.futureTitle}>One-tap AI Edit</h3>
          <p className={styles.futureSub}>
            IBM watsonx.ai will detect, fix, and export your video automatically — zero manual effort.
          </p>
        </div>

        <div style={{ height: 100 }} />
      </div>

      <BottomNavBar />
    </div>
  );
}

// ── Inner router ──────────────────────────────────────────────────────────────
function EditingScreenInner() {
  const { state, startSession } = useEditing();
  const session = state.activeSession;

  // No active session → home landing
  if (!session) {
    return (
      <EditingHome
        onNewSession={() => startSession(null, 'New Project')}
      />
    );
  }

  const sessionState = session.state;

  // Analysis phase (idle landing + running animation share AnalysisScreen)
  if (sessionState === 'idle' || sessionState === 'analysing') {
    return (
      <div className={styles.screenWithNav}>
        <AnalysisScreen />
        <BottomNavBar />
      </div>
    );
  }

  // Reviewing / applying → SuggestionPanel
  if (sessionState === 'reviewing' || sessionState === 'applying') {
    return (
      <div className={styles.screenWithNav}>
        <SuggestionPanel />
        <BottomNavBar />
      </div>
    );
  }

  // Complete → ExportScreen (configure export settings)
  if (sessionState === 'complete') {
    return (
      <div className={styles.screenWithNav}>
        <ExportScreen />
        <BottomNavBar />
      </div>
    );
  }

  // Optimizing → AIOptimizationScreen (AI tune + platform readiness)
  if (sessionState === 'optimizing') {
    return (
      <div className={styles.screenWithNav}>
        <AIOptimizationScreen />
        <BottomNavBar />
      </div>
    );
  }

  // Exporting → EditingSummary (final session summary)
  if (sessionState === 'exporting') {
    return (
      <div className={styles.screenWithNav}>
        <EditingSummary />
        <BottomNavBar />
      </div>
    );
  }

  // Fallback
  return (
    <EditingHome onNewSession={() => startSession(null, 'New Project')} />
  );
}

// ── Root export — wraps provider ──────────────────────────────────────────────
export default function EditingScreen() {
  return (
    <EditingProvider>
      <EditingScreenInner />
    </EditingProvider>
  );
}

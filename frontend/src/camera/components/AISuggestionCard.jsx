/**
 * AISuggestionCard.jsx
 *
 * Floating camera-analysis card driven by the latest backend image analysis
 * held in CameraContext.
 *
 * Module 8.5 — Workflow Application:
 *   "Apply Workflow" now resolves the full Workflow object from the context
 *   workflow library (by name) and calls applyWorkflow(), which merges the
 *   workflow's cameraSettings into the live settings state so TopStatusBar,
 *   WorkflowIndicator, and AIStatusIndicator all update automatically.
 *
 *   Applied confirmation: the button briefly shows "✓ Applied" for 2 s so
 *   the user has clear feedback without an additional modal.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './AISuggestionCard.module.css';
import { useCamera } from '../context/CameraContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceColor(percent) {
  if (percent >= 90) return '#22c55e';
  if (percent >= 75) return '#f59e0b';
  return '#ef4444';
}

function toPercent(confidence) {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) return null;
  return Math.round(Math.min(Math.max(confidence <= 1 ? confidence * 100 : confidence, 0), 100));
}

function CardHeader({ scene, onDismiss, dismissible }) {
  return (
    <div className={styles.header}>
      <div className={styles.aiLabel}>
        <span className={styles.aiBadge}>AI</span>
        <span className={styles.scene}>{scene}</span>
      </div>
      {dismissible && (
        <button className={styles.close} onClick={onDismiss} aria-label="Dismiss analysis">×</button>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AISuggestionCard() {
  const { state, applyWorkflow } = useCamera();
  const {
    latestAnalysis,
    isAnalyzingImage,
    imageAnalysisError,
    activeWorkflow,
    workflows,
  } = state;

  const [dismissed, setDismissed]   = useState(false);
  const [applied, setApplied]       = useState(false);
  const appliedTimerRef             = useRef(null);

  // Reset card state whenever the analysis content changes.
  useEffect(() => {
    setDismissed(false);
    setApplied(false);
  }, [latestAnalysis, isAnalyzingImage, imageAnalysisError]);

  // Clean up timer on unmount to avoid state updates on dead components.
  useEffect(() => () => { clearTimeout(appliedTimerRef.current); }, []);

  const recommendations = useMemo(() => (
    Array.isArray(latestAnalysis?.recommendations)
      ? latestAnalysis.recommendations.filter(Boolean)
      : []
  ), [latestAnalysis]);

  // Derive the suggested workflow name from the backend analysis or fall back
  // to the currently active workflow so the card is always coherent.
  const suggestedWorkflowName = latestAnalysis?.workflow || activeWorkflow?.name || '';

  // Resolve the full Workflow object from the library by name match.
  // This is what gets passed to applyWorkflow() so cameraSettings are applied.
  const resolvedWorkflow = useMemo(() => (
    suggestedWorkflowName
      ? (workflows.find(w => w.name === suggestedWorkflowName) ?? null)
      : null
  ), [workflows, suggestedWorkflowName]);

  // ── Apply handler ──────────────────────────────────────────────────────────
  const handleApplyWorkflow = useCallback(() => {
    if (!resolvedWorkflow) return;
    applyWorkflow(resolvedWorkflow);
    setApplied(true);
    clearTimeout(appliedTimerRef.current);
    appliedTimerRef.current = setTimeout(() => setApplied(false), 2000);
  }, [applyWorkflow, resolvedWorkflow]);

  // ── Render guards ──────────────────────────────────────────────────────────
  if (dismissed) return null;

  if (isAnalyzingImage) {
    return (
      <div className={`${styles.card} ${styles.visible}`} role="status" aria-live="polite">
        <CardHeader scene="Analyzing scene" />
        <div className={styles.stateBody}>
          <span className={styles.loadingRing} />
          <p>Reviewing your captured image and preparing recommendations…</p>
        </div>
      </div>
    );
  }

  if (imageAnalysisError) {
    return (
      <div className={`${styles.card} ${styles.visible}`} role="alert">
        <CardHeader scene="Analysis unavailable" onDismiss={() => setDismissed(true)} dismissible />
        <div className={styles.stateBody}>
          <p>We could not analyze this photo. Your capture is saved locally; take another photo to try again.</p>
        </div>
      </div>
    );
  }

  if (!latestAnalysis) {
    return (
      <div className={`${styles.card} ${styles.visible}`} role="status">
        <CardHeader scene="Camera intelligence" onDismiss={() => setDismissed(true)} dismissible />
        <div className={styles.stateBody}>
          <p>Capture a photo to receive scene-aware workflow recommendations.</p>
        </div>
      </div>
    );
  }

  // ── Full analysis card ─────────────────────────────────────────────────────
  const confidence = toPercent(latestAnalysis.confidence);
  const workflowLabel = suggestedWorkflowName || 'No workflow suggested';
  const fallbackRecommendation = latestAnalysis.details?.explanation || 'No recommendations were returned for this image.';
  const displayedRecommendations = recommendations.length ? recommendations : [fallbackRecommendation];

  return (
    <div className={`${styles.card} ${styles.visible}`} role="region" aria-label="AI image analysis">
      <CardHeader
        scene={latestAnalysis.scene || 'Scene analysis complete'}
        onDismiss={() => setDismissed(true)}
        dismissible
      />

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.fieldLabel}>Workflow</span>
          <span className={styles.fieldValue}>
            {resolvedWorkflow?.icon && (
              <span style={{ marginRight: 4 }}>{resolvedWorkflow.icon}</span>
            )}
            {workflowLabel}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.fieldLabel}>Recommendations</span>
          <ul className={styles.recommendationList}>
            {displayedRecommendations.map((recommendation, index) => (
              <li key={`${recommendation}-${index}`}>{recommendation}</li>
            ))}
          </ul>
        </div>
        <div className={styles.row}>
          <span className={styles.fieldLabel}>Confidence</span>
          <div className={styles.confidenceBar}>
            <div
              className={styles.confidenceFill}
              style={{
                width: `${confidence ?? 0}%`,
                background: confidence == null ? 'rgba(255,255,255,0.28)' : confidenceColor(confidence),
              }}
            />
          </div>
          <span
            className={styles.confidenceNum}
            style={{ color: confidence == null ? 'rgba(255,255,255,0.48)' : confidenceColor(confidence) }}
          >
            {confidence == null ? '—' : `${confidence}%`}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnDismiss} onClick={() => setDismissed(true)}>
          Dismiss
        </button>
        <button
          className={`${styles.btnApply} ${applied ? styles.btnApplied : ''}`}
          onClick={handleApplyWorkflow}
          disabled={!resolvedWorkflow || applied}
          aria-label={applied ? 'Workflow applied' : `Apply ${workflowLabel} workflow`}
        >
          {applied ? '✓ Applied' : 'Apply Workflow'}
        </button>
      </div>
    </div>
  );
}

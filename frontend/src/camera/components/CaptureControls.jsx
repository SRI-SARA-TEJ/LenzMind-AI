/**
 * camera/components/CaptureControls.jsx
 *
 * Bottom capture zone:
 *   [Workflow Shortcut]  [Capture Button]  [Gallery Thumbnail]
 *
 * Photo mode: tap to capture
 * Video mode: tap to start/stop recording
 */

import React from 'react';
import styles from './CaptureControls.module.css';
import WorkflowIndicator from './WorkflowIndicator';
import { useCamera } from '../context/CameraContext';
import { CAPTURE_MODES, MOCK_GALLERY } from '../data/mockData';

// ── Icons ─────────────────────────────────────────────────────────────────────
function FlipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function GalleryThumbnail({ item }) {
  return (
    <div className={styles.gallery}>
      <div className={styles.thumb}>
        {item.type === 'video' && (
          <span className={styles.videoBadge}>▶ {item.duration}</span>
        )}
        {item.type === 'photo' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>
    </div>
  );
}

export default function CaptureControls() {
  const { state, setCaptureState, toggleCameraFace, setCaptureMode, capturePhoto } = useCamera();
  const { captureState, captureMode, settings } = state;
  const latestMedia = MOCK_GALLERY[0];

  const handleCapture = async () => {
    if (captureMode === 'photo') {
      setCaptureState('processing');
      try {
        await capturePhoto();
      } finally {
        setCaptureState('idle');
      }
    } else {
      setCaptureState(captureState === 'recording' ? 'idle' : 'recording');
    }
  };

  const isRecording = captureState === 'recording';
  const isProcessing = captureState === 'processing';

  return (
    <div className={styles.root}>
      {/* Capture mode selector */}
      <div className={styles.modeRow}>
        {CAPTURE_MODES.map(m => (
          <button
            key={m.id}
            className={`${styles.modeBtn} ${captureMode === m.id ? styles.modeBtnActive : ''}`}
            onClick={() => setCaptureMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main controls row */}
      <div className={styles.row}>
        {/* Left: flip camera */}
        <button
          className={styles.sideBtn}
          onClick={toggleCameraFace}
          aria-label="Flip camera"
        >
          <FlipIcon />
        </button>

        {/* Center: capture button */}
        <div className={styles.captureWrapper}>
          <button
            className={`${styles.captureBtn} ${isRecording ? styles.captureBtnRec : ''} ${isProcessing ? styles.captureBtnProcessing : ''}`}
            onClick={handleCapture}
            disabled={isProcessing}
            aria-label={captureMode === 'photo' ? 'Capture photo' : isRecording ? 'Stop recording' : 'Start recording'}
          >
            <div className={styles.captureInner}>
              {captureMode === 'video' && isRecording ? (
                <div className={styles.stopSquare} />
              ) : isProcessing ? (
                <div className={styles.processingRing} />
              ) : captureMode === 'photo' ? (
                <div className={styles.photoCircle} />
              ) : (
                <div className={styles.videoCircle} />
              )}
            </div>
          </button>
          {isRecording && <div className={styles.recRipple} />}
        </div>

        {/* Right: gallery thumbnail */}
        <GalleryThumbnail item={latestMedia} />
      </div>

      {/* Workflow indicator — above the capture row */}
      <div className={styles.workflowRow}>
        <WorkflowIndicator />
      </div>
    </div>
  );
}

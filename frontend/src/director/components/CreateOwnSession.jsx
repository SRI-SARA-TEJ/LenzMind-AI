/**
 * director/components/CreateOwnSession.jsx
 *
 * Create My Own Mode — recording interface with shot markers.
 * Creator records → adds shot markers → finishes → generates Director Map.
 *
 * ONLY this mode has shot markers. AI Guided does NOT.
 */

import React, { useState, useEffect, useRef } from 'react';
import styles from './CreateOwnSession.module.css';
import { useDirector } from '../hooks/useDirector';
import ShotMarkerDialog from './ShotMarkerDialog';

// ── Duration timer ─────────────────────────────────────────────────────────────
function useTimer(active) {
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (active) {
      ref.current = setInterval(() => setSecs(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [active]);

  const reset = () => setSecs(0);
  const fmt   = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return { secs, fmt: fmt(secs), reset };
}

// ── Shot marker list item ─────────────────────────────────────────────────────
function ShotMarkerItem({ marker, index, onEdit, onDelete }) {
  const diffColors = {
    Beginner:     '#4ade80',
    Intermediate: '#fcd34d',
    Advanced:     '#f87171',
  };

  return (
    <div className={styles.markerItem}>
      <div className={styles.markerOrder}>{marker.order}</div>
      <div className={styles.markerBody}>
        <div className={styles.markerTop}>
          <span className={styles.markerName}>{marker.name}</span>
          <span className={styles.markerDiff} style={{ color: diffColors[marker.difficulty] }}>
            {marker.difficulty}
          </span>
        </div>
        <div className={styles.markerMeta}>
          <span className={styles.markerTech}>{marker.technique}</span>
          <span className={styles.markerSep}>·</span>
          <span className={styles.markerMove}>{marker.movement}</span>
          <span className={styles.markerSep}>·</span>
          <span className={styles.markerDur}>{marker.durationSeconds}s</span>
        </div>
        {marker.notes && (
          <p className={styles.markerNotes}>{marker.notes}</p>
        )}
        <div className={styles.markerTransition}>→ {marker.transition}</div>
      </div>
      <div className={styles.markerActions}>
        <button className={styles.markerEdit} onClick={() => onEdit(marker)} aria-label="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button className={styles.markerDelete} onClick={() => onDelete(marker.id)} aria-label="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function CreateOwnSession() {
  const {
    state,
    goHome,
    setRecordingState,
    deleteShotMarker,
    openShotDialog,
    openMapSaveDialog,
  } = useDirector();

  const { recordingState, currentShotMarkers } = state;
  const isRecording = recordingState === 'recording';
  const isFinished  = recordingState === 'finished';
  const timer = useTimer(isRecording);

  const handleStartStop = () => {
    if (isRecording) {
      setRecordingState('finished');
    } else {
      setRecordingState('recording');
      timer.reset();
    }
  };

  const handleReset = () => {
    setRecordingState('idle');
    timer.reset();
  };

  return (
    <div className={styles.screen}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={goHome} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.topMid}>
          <h1 className={styles.topTitle}>Create My Own</h1>
          <p className={styles.topSub}>
            {isRecording ? 'Recording…' : isFinished ? 'Session complete' : 'Ready to record'}
          </p>
        </div>
        <div className={`${styles.statePill} ${isRecording ? styles.stateRec : isFinished ? styles.stateDone : styles.stateIdle}`}>
          {isRecording ? '● REC' : isFinished ? '✓ Done' : '○ Ready'}
        </div>
      </div>

      {/* ── Recording zone ──────────────────────────────────────────────── */}
      <div className={styles.recZone}>

        {/* Timer */}
        <div className={`${styles.timer} ${isRecording ? styles.timerActive : ''}`}>
          {timer.fmt}
        </div>

        {/* Recording button */}
        <div className={styles.recBtnWrap}>
          <button
            className={`${styles.recBtn} ${isRecording ? styles.recBtnActive : ''} ${isFinished ? styles.recBtnDone : ''}`}
            onClick={handleStartStop}
            disabled={isFinished}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <div className={styles.recBtnInner}>
              {isRecording ? (
                <div className={styles.stopSquare} />
              ) : isFinished ? (
                <span className={styles.doneCheck}>✓</span>
              ) : (
                <div className={styles.startDot} />
              )}
            </div>
          </button>
          {isRecording && <div className={styles.recRipple} />}
          {isRecording && <div className={styles.recRipple2} />}
        </div>

        {/* Label */}
        <p className={styles.recLabel}>
          {isRecording ? 'Tap to stop recording' : isFinished ? 'Recording finished' : 'Tap to start recording'}
        </p>

        {/* Shot marker button — ONLY visible when recording or finished */}
        {(isRecording || isFinished) && (
          <button
            className={styles.addMarkerBtn}
            onClick={() => openShotDialog(null)}
            aria-label="Add shot marker"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Shot Marker
          </button>
        )}
      </div>

      {/* ── Shot markers list ────────────────────────────────────────────── */}
      <div className={styles.markersSection}>
        <div className={styles.markersSectionHeader}>
          <span className={styles.markersSectionTitle}>
            Shot Markers
          </span>
          <span className={styles.markersCount}>{currentShotMarkers.length}</span>
        </div>

        {currentShotMarkers.length === 0 ? (
          <div className={styles.markersEmpty}>
            <p className={styles.markersEmptyIcon}>🎬</p>
            <p className={styles.markersEmptyText}>
              {isRecording ? 'Tap "Add Shot Marker" to mark a scene' : 'Start recording to add shot markers'}
            </p>
          </div>
        ) : (
          <div className={styles.markersList}>
            {currentShotMarkers.map((sm, i) => (
              <ShotMarkerItem
                key={sm.id}
                marker={sm}
                index={i}
                onEdit={marker => openShotDialog(marker)}
                onDelete={deleteShotMarker}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className={styles.actionBar}>
        {isFinished && currentShotMarkers.length === 0 && (
          <button className={styles.btnGhost} onClick={handleReset}>Re-record</button>
        )}
        {(isRecording || (!isFinished && !isRecording)) && (
          <button className={styles.btnGhost} onClick={goHome}>Cancel</button>
        )}
        {isFinished && currentShotMarkers.length > 0 && (
          <>
            <button className={styles.btnGhost} onClick={handleReset}>Re-record</button>
            <button className={styles.btnPrimary} onClick={openMapSaveDialog}>
              Generate Director Map →
            </button>
          </>
        )}
        {isFinished && currentShotMarkers.length === 0 && (
          <button className={styles.btnGhost} onClick={goHome}>Cancel</button>
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <ShotMarkerDialog />
    </div>
  );
}

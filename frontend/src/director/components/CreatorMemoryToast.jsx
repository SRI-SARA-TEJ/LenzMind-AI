/**
 * director/components/CreatorMemoryToast.jsx
 *
 * Feature 8 — Creator Memory Preview.
 * Shown after saving a Director Map or completing a Guided Session.
 * Communicates that AI has learned the creator's style.
 * Auto-dismisses after 6 seconds. UI only — [AI_FUTURE] data placeholder.
 */

import React, { useEffect } from 'react';
import styles from './CreatorMemoryToast.module.css';
import { useDirector } from '../hooks/useDirector';

export default function CreatorMemoryToast() {
  const { state, dismissMemoryToast } = useDirector();
  const { memoryToastVisible } = state;

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (memoryToastVisible) {
      const t = setTimeout(dismissMemoryToast, 6000);
      return () => clearTimeout(t);
    }
  }, [memoryToastVisible, dismissMemoryToast]);

  if (!memoryToastVisible) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {/* Left: AI icon */}
      <div className={styles.iconWrap}>
        <div className={styles.icon}>🧠</div>
        <div className={styles.iconPulse} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.badge}>✦ AI LEARNED</div>
        <p className={styles.heading}>Creator Memory Updated</p>
        <p className={styles.sub}>Your filming style has been recorded. Future AI recommendations will be more personalised.</p>
      </div>

      {/* Dismiss */}
      <button className={styles.dismiss} onClick={dismissMemoryToast} aria-label="Dismiss">✕</button>

      {/* Progress timer bar */}
      <div className={styles.timerBar} />
    </div>
  );
}

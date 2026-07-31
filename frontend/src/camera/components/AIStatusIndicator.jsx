/**
 * camera/components/AIStatusIndicator.jsx
 *
 * Small persistent pill showing the current AI status.
 * Floats at the right side of the screen, vertically centered
 * with the capture controls zone.
 */

import React from 'react';
import styles from './AIStatusIndicator.module.css';
import { useCamera } from '../context/CameraContext';

export default function AIStatusIndicator() {
  const { state } = useCamera();
  const { aiStatus, isAnalyzingImage, imageAnalysisError } = state;
  const status = isAnalyzingImage
    ? { label: 'Analyzing scene...', color: '#f59e0b' }
    : imageAnalysisError
      ? { label: 'Analysis unavailable', color: '#ef4444' }
    : aiStatus;

  return (
    <div className={styles.pill} style={{ '--status-color': status.color }}>
      <span className={styles.dot} />
      <span className={styles.label}>{status.label}</span>
    </div>
  );
}

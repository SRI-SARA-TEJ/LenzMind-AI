/**
 * camera/components/CameraPreview.jsx
 *
 * Live browser camera preview. Camera capture remains intentionally outside
 * this component; this module only owns the MediaStream lifecycle.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './CameraPreview.module.css';
import { useCamera } from '../context/CameraContext';

function stopStream(stream) {
  stream?.getTracks().forEach(track => track.stop());
}

function getCameraErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Camera permission was denied. Allow camera access in your browser settings to use the live preview.';
  }

  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
    return 'The selected camera is not available on this device.';
  }

  return 'Unable to start the camera preview. Please check your camera and try again.';
}

export default function CameraPreview() {
  const { state, registerPhotoCaptureHandler } = useCamera();
  const { cameraFacing, captureState, capturedImage } = state;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [showCapturedPreview, setShowCapturedPreview] = useState(false);

  const captureCurrentFrame = useCallback(() => new Promise(resolve => {
    const video = videoRef.current;
    const width = video?.videoWidth ?? 0;
    const height = video?.videoHeight ?? 0;

    if (!video || !width || !height) {
      resolve(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      resolve(null);
      return;
    }
    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(blob => resolve(blob ? { blob, width, height } : null), 'image/jpeg', 0.92);
  }), []);

  useEffect(() => {
    registerPhotoCaptureHandler(captureCurrentFrame);
    return () => registerPhotoCaptureHandler(null);
  }, [captureCurrentFrame, registerPhotoCaptureHandler]);

  useEffect(() => {
    if (!capturedImage?.url) return undefined;
    setShowCapturedPreview(true);
    const timer = setTimeout(() => setShowCapturedPreview(false), 1200);
    return () => clearTimeout(timer);
  }, [capturedImage?.url]);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      stopStream(streamRef.current);
      streamRef.current = null;
      setCameraError('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Live camera preview is not supported by this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: cameraFacing === 'front' ? 'user' : 'environment',
          },
        });

        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (error) {
        if (!cancelled) setCameraError(getCameraErrorMessage(error));
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [cameraFacing]);

  return (
    <div className={`${styles.preview} ${captureState === 'recording' ? styles.recording : ''}`}>
      {!cameraError && (
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          playsInline
          muted
          aria-label={`Live ${cameraFacing === 'back' ? 'rear' : 'front'} camera preview`}
        />
      )}

      {showCapturedPreview && capturedImage && (
        <div className={styles.capturedPreview} aria-live="polite">
          <img src={capturedImage.url} alt="Captured photo preview" />
          <span>Photo captured</span>
        </div>
      )}

      {cameraError && (
        <div className={styles.cameraFallback} role="status">
          <strong>Camera unavailable</strong>
          <span>{cameraError}</span>
        </div>
      )}

      <div className={styles.viewfinder}>
        <span className={`${styles.corner} ${styles.tl}`} />
        <span className={`${styles.corner} ${styles.tr}`} />
        <span className={`${styles.corner} ${styles.bl}`} />
        <span className={`${styles.corner} ${styles.br}`} />

        <div className={styles.focusRing} />

        <div className={styles.sceneHint}>
          <span className={styles.sceneDot} />
          {cameraError
            ? 'Camera Preview Unavailable'
            : cameraFacing === 'back'
              ? 'Live Preview — Rear Camera'
              : 'Live Preview — Front Camera'}
        </div>

        {captureState === 'recording' && (
          <div className={styles.recBadge}>
            <span className={styles.recDot} />
            REC
          </div>
        )}
      </div>
    </div>
  );
}

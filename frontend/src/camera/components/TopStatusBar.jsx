/**
 * camera/components/TopStatusBar.jsx
 *
 * Compact row of camera settings: Flash | HDR | Resolution | FPS | Settings
 * All tappable for Version 1 (cycles values or opens placeholder).
 */

import React from 'react';
import styles from './TopStatusBar.module.css';
import { useCamera } from '../context/CameraContext';

// ── Icon helpers (inline SVG — no external deps) ──────────────────────────────
function FlashIcon({ mode }) {
  const color = mode === 'on' ? '#f59e0b' : mode === 'auto' ? '#fff' : 'rgba(255,255,255,0.4)';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// ── Flash cycle: off → auto → on → off ───────────────────────────────────────
const FLASH_CYCLE = { off: 'auto', auto: 'on', on: 'off' };
const FLASH_LABEL = { off: 'Off', auto: 'Auto', on: 'On' };

export default function TopStatusBar() {
  const { state, updateSetting } = useCamera();
  const { settings, captureMode } = state;

  const cycleFlash = () =>
    updateSetting({ flash: FLASH_CYCLE[settings.flash] });

  const cycleRes = () => {
    const opts = ['1080p', '4K', '8K'];
    const next = opts[(opts.indexOf(settings.resolution) + 1) % opts.length];
    updateSetting({ resolution: next });
  };

  const cycleFPS = () => {
    const opts = [24, 30, 60, 120];
    const next = opts[(opts.indexOf(settings.fps) + 1) % opts.length];
    updateSetting({ fps: next });
  };

  const toggleHDR = () => updateSetting({ hdr: !settings.hdr });

  return (
    <div className={styles.bar}>
      {/* Left cluster: flash, HDR */}
      <div className={styles.cluster}>
        <button className={styles.pill} onClick={cycleFlash} aria-label="Cycle flash">
          <FlashIcon mode={settings.flash} />
          <span className={settings.flash === 'off' ? styles.dimmed : ''}>{FLASH_LABEL[settings.flash]}</span>
        </button>

        <button
          className={`${styles.pill} ${settings.hdr ? styles.active : styles.dimmed}`}
          onClick={toggleHDR}
          aria-label="Toggle HDR"
        >
          HDR
        </button>
      </div>

      {/* Center: resolution */}
      <button className={`${styles.pill} ${styles.center}`} onClick={cycleRes} aria-label="Cycle resolution">
        {settings.resolution}
      </button>

      {/* Right cluster: FPS (video only), settings */}
      <div className={styles.cluster}>
        {captureMode !== 'photo' && (
          <button className={styles.pill} onClick={cycleFPS} aria-label="Cycle FPS">
            {settings.fps}<span className={styles.unit}>fps</span>
          </button>
        )}
        <button className={styles.iconBtn} aria-label="Open settings">
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
}

/**
 * components/ui/AIDisclaimer.jsx
 *
 * A compact, honest banner that communicates two things:
 *  1. These are AI-generated suggestions, not instructions.
 *  2. The user must explicitly approve or dismiss every recommendation.
 *
 * Design principle: AI must explain itself and humans stay in control.
 * This banner is always visible on the Recommendations page.
 *
 * Props:
 *   variant — 'info' (default) | 'mock'
 *             'mock' is shown when Gemini AI is not configured so the user
 *             understands why they are seeing placeholder data.
 */

import React from 'react';
import styles from './AIDisclaimer.module.css';

export default function AIDisclaimer({ variant = 'info' }) {
  if (variant === 'mock') {
    return (
      <div className={`${styles.banner} ${styles.mock}`}>
        <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>
          <strong>Mock mode — </strong>
          Gemini AI is not configured. Recommendations below are labelled placeholders.
          Set <code>GEMINI_API_KEY</code> in Render env vars to enable real AI analysis.
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.banner} ${styles.info}`}>
      <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span>
        <strong>AI suggestions require your approval. </strong>
        Review each recommendation carefully — accept what helps, dismiss what doesn't.
        You are always in control.
      </span>
    </div>
  );
}

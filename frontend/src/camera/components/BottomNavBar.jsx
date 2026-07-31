/**
 * camera/components/BottomNavBar.jsx
 *
 * Five-tab persistent bottom navigation.
 * Camera is selected by default; others navigate to placeholder routes.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BottomNavBar.module.css';
import { NAV_TABS } from '../data/mockData';

// ── Tab icons (inline SVG) ────────────────────────────────────────────────────
const ICONS = {
  camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  director: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.868v6.264a1 1 0 0 1-1.447.906L15 14" />
      <rect x="3" y="8" width="12" height="8" rx="2" />
      <line x1="7" y1="4" x2="7" y2="8" />
      <line x1="12" y1="4" x2="12" y2="8" />
    </svg>
  ),
  editing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  workflows: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  // Module 9 — Creator Intelligence Dashboard
  intelligence: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.8-1.6 5.2-4 6.4V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.6C6.6 14.2 5 11.8 5 9a7 7 0 0 1 7-7z" />
      <path d="M9 21h6" />
      <path d="M10 17v1" />
      <path d="M14 17v1" />
    </svg>
  ),
  // Module 10.1 — AI Creator Assistant
  assistant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function BottomNavBar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const activeTab = NAV_TABS.find(t => location.pathname.startsWith(t.path))?.id || 'camera';

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {NAV_TABS.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.tabIcon}>{ICONS[tab.id]}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
            {isActive && <span className={styles.activeBar} />}
          </button>
        );
      })}
    </nav>
  );
}

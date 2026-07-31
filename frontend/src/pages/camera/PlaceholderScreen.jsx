/**
 * pages/camera/PlaceholderScreen.jsx
 *
 * Generic placeholder used for Projects, Search, Workflows, Profile.
 * Keeps navigation functional without building full screens in v1.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PlaceholderScreen.module.css';

const CONFIG = {
  projects:  { icon: '🗂️', title: 'Projects',       sub: 'All your captured projects live here.' },
  search:    { icon: '🔍', title: 'Search',          sub: 'Find clips, workflows, and AI suggestions.' },
  workflows: { icon: '⚡', title: 'Workflow Library', sub: 'Browse and apply AI-powered creator workflows.' },
  profile:   { icon: '👤', title: 'Profile',          sub: 'Your creator profile and settings.' },
};

export default function PlaceholderScreen({ screen }) {
  const navigate = useNavigate();
  const info = CONFIG[screen] || CONFIG.projects;

  return (
    <div className={styles.root}>
      <span className={styles.icon}>{info.icon}</span>
      <h2 className={styles.title}>{info.title}</h2>
      <p className={styles.sub}>{info.sub}</p>
      <p className={styles.badge}>Coming in Version 2</p>
      <button className={styles.back} onClick={() => navigate('/camera')}>
        ← Back to Camera
      </button>
    </div>
  );
}

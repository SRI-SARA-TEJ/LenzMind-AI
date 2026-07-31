/**
 * project/components/ProjectCard.jsx
 *
 * Reusable card for a single project — both grid and list variants.
 *
 * Props:
 *   project   {Project}
 *   onSelect  {fn}
 *   listMode  {boolean}
 */

import React from 'react';
import styles from './ProjectCard.module.css';
import { useProject } from '../hooks/useProject';
import { STATUS_COLORS } from '../models/projectModel';

function formatDate(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export default function ProjectCard({ project, onSelect, listMode = false }) {
  const { toggleFavorite, openDeleteConfirm, duplicateProject, archiveProject } = useProject();

  const statusStyle = STATUS_COLORS[project.status] || {};

  const handleFav = (e) => {
    e.stopPropagation();
    toggleFavorite(project.id);
  };

  if (listMode) {
    return (
      <div
        className={styles.listCard}
        onClick={() => onSelect(project)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onSelect(project)}
        aria-label={`Open ${project.title}`}
      >
        {/* Cover */}
        <div className={styles.listCover} style={{ background: project.coverColor }}>
          <span className={styles.listCoverEmoji}>{project.coverEmoji}</span>
        </div>

        {/* Main info */}
        <div className={styles.listMain}>
          <div className={styles.listTop}>
            <span className={styles.listTitle}>{project.title}</span>
            <span
              className={styles.statusBadge}
              style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
            >
              {project.status}
            </span>
          </div>
          <div className={styles.listMeta}>
            <span className={styles.listCategory}>{project.category}</span>
            <span className={styles.listSep}>·</span>
            <span className={styles.listUpdated}>{formatDate(project.updatedAt)}</span>
          </div>
          {/* Progress bar */}
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        {/* Media counts */}
        <div className={styles.listStats}>
          <span className={styles.mediaStat}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {project.mediaStats.photos}
          </span>
          <span className={styles.mediaStat}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            {project.mediaStats.videos}
          </span>
        </div>

        {/* Favorite */}
        <button
          className={`${styles.favBtn} ${project.isFavorite ? styles.favActive : ''}`}
          onClick={handleFav}
          aria-label="Toggle favorite"
        >
          {project.isFavorite ? '★' : '☆'}
        </button>
      </div>
    );
  }

  // ── Grid card ───────────────────────────────────────────────────────────────
  return (
    <div
      className={styles.card}
      onClick={() => onSelect(project)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(project)}
      aria-label={`Open ${project.title}`}
    >
      {/* Cover */}
      <div className={styles.cover} style={{ background: project.coverColor }}>
        <span className={styles.coverEmoji}>{project.coverEmoji}</span>
        {/* Status badge on cover */}
        <span
          className={styles.coverStatus}
          style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
        >
          {project.status}
        </span>
        {/* Favorite button */}
        <button
          className={`${styles.favBtn} ${project.isFavorite ? styles.favActive : ''}`}
          onClick={handleFav}
          aria-label="Toggle favorite"
        >
          {project.isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{project.title}</span>
        </div>

        <span className={styles.category}>{project.category}</span>

        {/* AI Summary preview */}
        <p className={styles.aiSummaryPreview}>{project.aiSummary}</p>

        {/* Progress */}
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${project.progress}%` }} />
          </div>
          <span className={styles.progressPct}>{project.progress}%</span>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.mediaStats}>
            <span className={styles.mediaStat}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {project.mediaStats.photos}
            </span>
            <span className={styles.mediaStat}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              {project.mediaStats.videos}
            </span>
            <span className={styles.mediaStat}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              {project.mediaStats.audio}
            </span>
          </div>
          <span className={styles.updated}>{formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * components/ui/ProjectCard.jsx
 *
 * Card component representing a single project in the dashboard grid.
 * Clicking it navigates to the project workspace.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProjectCard.module.css';

const TYPE_LABELS = {
  photo: { label: 'Photo', color: 'var(--agent-camera)' },
  video: { label: 'Video', color: 'var(--agent-editing)' },
  mixed: { label: 'Mixed', color: 'var(--color-accent)' },
};

const STATUS_STYLES = {
  draft:       { label: 'Draft',       color: 'var(--color-text-muted)' },
  'in-progress':{ label: 'In Progress', color: 'var(--color-warning)' },
  completed:   { label: 'Completed',   color: 'var(--color-success)' },
};

export default function ProjectCard({ project }) {
  const navigate    = useNavigate();
  const typeInfo    = TYPE_LABELS[project.contentType]   || TYPE_LABELS.mixed;
  const statusInfo  = STATUS_STYLES[project.status]      || STATUS_STYLES.draft;
  const assetCount  = project.assets?.length || 0;
  const date        = new Date(project.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/workspace/${project._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/workspace/${project._id}`)}
    >
      {/* Thumbnail placeholder */}
      <div className={styles.thumbnail}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>
        <span className={styles.typeChip} style={{ background: typeInfo.color + '22', color: typeInfo.color }}>
          {typeInfo.label}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{project.title}</h3>
        {project.description && (
          <p className={styles.description}>{project.description}</p>
        )}

        <div className={styles.meta}>
          <span style={{ color: statusInfo.color, fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
            ● {statusInfo.label}
          </span>
          <span className={styles.metaItem}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            </svg>
            {assetCount} {assetCount === 1 ? 'asset' : 'assets'}
          </span>
          <span className={styles.metaItem}>{date}</span>
        </div>
      </div>
    </div>
  );
}

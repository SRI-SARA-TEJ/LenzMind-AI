/**
 * pages/WorkspacePage.jsx — Project Workspace
 *
 * Deep-dive view for a single project:
 *  - Project details and status editor
 *  - Asset gallery (all uploaded files)
 *  - Link to AI Suggestions for this project
 *  - Quick upload shortcut
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import styles from './WorkspacePage.module.css';

const STATUS_OPTIONS = ['draft', 'in-progress', 'completed'];

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useApp();

  const [project,  setProject]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal,  setTitleVal]  = useState('');

  useEffect(() => {
    async function load() {
      try {
        const p = await api.getProject(id);
        setProject(p);
        setTitleVal(p.title);
      } catch (err) {
        notify('error', err.message);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate, notify]);

  async function saveStatus(newStatus) {
    setSaving(true);
    try {
      const updated = await api.updateProject(id, { status: newStatus });
      setProject(updated);
      notify('success', 'Project updated');
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveTitle() {
    if (!titleVal.trim() || titleVal === project.title) {
      setEditTitle(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProject(id, { title: titleVal });
      setProject(updated);
      setEditTitle(false);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading workspace...</div>;
  if (!project) return null;

  const assetCount = project.assets?.length || 0;

  return (
    <div className={styles.page}>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbLink} onClick={() => navigate('/dashboard')}>Dashboard</span>
        <span className={styles.breadcrumbSep}>/</span>
        <span>{project.title}</span>
      </div>

      {/* Project Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {editTitle ? (
            <input
              className={styles.titleInput}
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditTitle(false); }}
              autoFocus
            />
          ) : (
            <h2 className={styles.projectTitle} onClick={() => setEditTitle(true)} title="Click to edit">
              {project.title}
              <span className={styles.editHint}>✎</span>
            </h2>
          )}
        </div>

        <div className={styles.meta}>
          <span className={styles.metaLabel}>Status:</span>
          <select
            value={project.status}
            onChange={(e) => saveStatus(e.target.value)}
            className={styles.statusSelect}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <span className={styles.metaLabel}>Type:</span>
          <span className={styles.metaValue}>{project.contentType}</span>

          <span className={styles.metaLabel}>Created:</span>
          <span className={styles.metaValue}>
            {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => navigate('/upload')}>
          + Upload Files
        </button>
        <button className={styles.actionBtnOutline} onClick={() => navigate('/recommendations')}>
          View AI Suggestions
        </button>
      </div>

      {/* Asset Gallery */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Assets
          <span className={styles.count}>{assetCount}</span>
        </h3>

        {assetCount === 0 ? (
          <div className={styles.emptyAssets}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            <p>No files uploaded yet. Click "Upload Files" above to add content.</p>
          </div>
        ) : (
          <div className={styles.assetGrid}>
            {project.assets.map((asset, idx) => (
              <div key={idx} className={styles.assetTile}>
                {asset.mimeType?.startsWith('image/') ? (
                  <img
                    src={asset.url}
                    alt={asset.originalName}
                    className={styles.assetImg}
                  />
                ) : (
                  <div className={styles.assetVideoThumb}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                )}
                <div className={styles.assetInfo}>
                  <span className={styles.assetName}>{asset.originalName}</span>
                  <span className={styles.assetSize}>{(asset.size / 1_048_576).toFixed(1)} MB</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations placeholder */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>AI Recommendations</h3>
        <div className={styles.aiPlaceholder}>
          <div className={styles.aiPlaceholderIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <p className={styles.aiPlaceholderText}>
            AI agents are ready to analyze this project.
          </p>
          <p className={styles.aiPlaceholderHint}>
            Camera Intelligence, Editing Intelligence, and Content Optimization agents will generate
            suggestions once IBM watsonx.ai is configured.
          </p>
          <button className={styles.actionBtnOutline} onClick={() => navigate('/recommendations')}>
            Manage AI Suggestions
          </button>
        </div>
      </div>

    </div>
  );
}

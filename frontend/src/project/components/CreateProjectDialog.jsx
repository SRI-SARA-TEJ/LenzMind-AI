/**
 * project/components/CreateProjectDialog.jsx
 *
 * Bottom-sheet dialog for creating a new project.
 */

import React, { useState } from 'react';
import styles from './ProjectDialogShared.module.css';
import { useProject } from '../hooks/useProject';
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from '../models/projectModel';

const EMOJIS = ['🎬', '✈️', '💍', '💻', '🎙️', '📷', '👨‍🍳', '💪', '🎥', '🎤', '⚡', '🌱', '📸', '🏋️', '🍳', '🎵'];
const COVER_COLORS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #16a34a, #15803d)',
  'linear-gradient(135deg, #7c3aed, #9333ea)',
  'linear-gradient(135deg, #dc2626, #ea580c)',
  'linear-gradient(135deg, #f97316, #fb923c)',
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #14532d, #15803d)',
];

const CATS = PROJECT_CATEGORIES.filter(c => c.id !== 'all');

export default function CreateProjectDialog() {
  const { state, closeCreate, createProject } = useProject();

  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    'Vlog',
    coverColor:  COVER_COLORS[0],
    coverEmoji:  '🎬',
    status:      'Planning',
    tags:        '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (!state.createDialogOpen) return null;

  const handleSave = () => {
    if (!form.title.trim()) return;
    createProject({
      title:       form.title.trim(),
      description: form.description.trim(),
      category:    form.category,
      coverColor:  form.coverColor,
      coverEmoji:  form.coverEmoji,
      status:      form.status,
      progress:    0,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    // Reset form
    setForm({ title: '', description: '', category: 'Vlog', coverColor: COVER_COLORS[0], coverEmoji: '🎬', status: 'Planning', tags: '' });
  };

  return (
    <div className={styles.overlay} onClick={closeCreate}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>New Project</h2>
          <button className={styles.closeBtn} onClick={closeCreate} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>

          {/* Cover preview */}
          <div className={styles.coverPreview} style={{ background: form.coverColor }}>
            <span className={styles.coverPreviewEmoji}>{form.coverEmoji}</span>
          </div>

          {/* Emoji picker */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Cover Emoji</label>
            <div className={styles.iconGrid}>
              {EMOJIS.map(em => (
                <button
                  key={em}
                  type="button"
                  className={`${styles.iconOption} ${form.coverEmoji === em ? styles.iconSelected : ''}`}
                  onClick={() => set('coverEmoji', em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Cover Colour</label>
            <div className={styles.colorGrid}>
              {COVER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorSwatch} ${form.coverColor === c ? styles.colorSelected : ''}`}
                  style={{ background: c }}
                  onClick={() => set('coverColor', c)}
                  aria-label="Select colour"
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Project Title *</label>
            <input
              className={styles.input}
              placeholder="e.g. Japan Travel Vlog"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={80}
            />
          </div>

          {/* Description */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Describe the project…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Category</label>
            <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Initial Status</label>
            <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Tags (comma-separated)</label>
            <input
              className={styles.input}
              placeholder="travel, vlog, 4K"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
          </div>

          <div style={{ height: 16 }} />
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={closeCreate}>Cancel</button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={!form.title.trim()}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

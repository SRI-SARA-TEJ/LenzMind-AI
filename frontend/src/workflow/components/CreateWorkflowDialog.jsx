/**
 * workflow/components/CreateWorkflowDialog.jsx
 *
 * Bottom-sheet dialog for creating a new workflow from scratch.
 * Fields: name, icon, category, description, camera settings, AI behaviour, privacy, tags.
 * Saves via mock createWorkflow() action — no backend.
 */

import React, { useState } from 'react';
import styles from './DialogShared.module.css';
import { useWorkflow } from '../hooks/useWorkflow';
import { WORKFLOW_CATEGORIES } from '../data/mockWorkflowData';
import { createBlankWorkflow } from '../models/workflowModel';

const ICONS = ['🎬', '✈️', '🍽️', '🎙️', '📦', '🎥', '⚡', '🌿', '🏔️', '💍', '🪞', '🎤', '👨‍🍳', '🏙️', '📸', '🎵'];
const CATEGORIES = WORKFLOW_CATEGORIES.filter(c => !['all', 'favorites', 'recent', 'my', 'builtin', 'ai'].includes(c.id)).map(c => c.id);

function Toggle({ label, checked, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleLabel}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

export default function CreateWorkflowDialog() {
  const { state, closeCreate, createWorkflow } = useWorkflow();
  const blank = createBlankWorkflow();

  const [form, setForm] = useState({
    name:        '',
    icon:        '🎬',
    category:    'Content',
    description: '',
    tags:        '',
    camera: {
      resolution:    '4K',
      fps:           30,
      hdr:           true,
      stabilization: 'standard',
    },
    ai: {
      sceneDetection:  true,
      autoSuggest:     true,
      noiseReduction:  false,
      autoColourGrade: false,
    },
    privacy: {
      blurFaces:          false,
      blurScreens:        false,
      muteSensitiveAudio: false,
    },
  });

  const set   = (key, val)  => setForm(f => ({ ...f, [key]: val }));
  const setCamera  = (key, val)  => setForm(f => ({ ...f, camera:  { ...f.camera,  [key]: val } }));
  const setAI      = (key, val)  => setForm(f => ({ ...f, ai:      { ...f.ai,      [key]: val } }));
  const setPrivacy = (key, val)  => setForm(f => ({ ...f, privacy: { ...f.privacy, [key]: val } }));

  if (!state.createDialogOpen) return null;

  const handleSave = () => {
    if (!form.name.trim()) return;
    createWorkflow({
      ...blank,
      name:        form.name.trim(),
      icon:        form.icon,
      category:    form.category,
      description: form.description.trim(),
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      cameraSettings: { ...blank.cameraSettings, ...form.camera },
      aiSettings:     { ...blank.aiSettings, ...form.ai },
      privacySettings:{ ...blank.privacySettings, ...form.privacy },
    });
  };

  return (
    <div className={styles.overlay} onClick={closeCreate}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Create Workflow</h2>
          <button className={styles.closeBtn} onClick={closeCreate} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>

          {/* Icon picker */}
          <FieldRow label="Icon">
            <div className={styles.iconGrid}>
              {ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  className={`${styles.iconOption} ${form.icon === ic ? styles.iconSelected : ''}`}
                  onClick={() => set('icon', ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </FieldRow>

          {/* Name */}
          <FieldRow label="Workflow Name *">
            <input
              className={styles.input}
              placeholder="e.g. Sunset Reel"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              maxLength={50}
            />
          </FieldRow>

          {/* Category */}
          <FieldRow label="Category">
            <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="My Workflows">My Workflows</option>
            </select>
          </FieldRow>

          {/* Description */}
          <FieldRow label="Description">
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Describe your workflow's purpose and style…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </FieldRow>

          {/* Tags */}
          <FieldRow label="Tags (comma-separated)">
            <input
              className={styles.input}
              placeholder="outdoor, vlog, 4K"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
          </FieldRow>

          {/* Camera settings */}
          <p className={styles.groupTitle}>Camera Settings</p>
          <FieldRow label="Resolution">
            <select className={styles.select} value={form.camera.resolution} onChange={e => setCamera('resolution', e.target.value)}>
              {['1080p', '4K', '8K'].map(r => <option key={r}>{r}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Frame Rate">
            <select className={styles.select} value={form.camera.fps} onChange={e => setCamera('fps', Number(e.target.value))}>
              {[24, 30, 60, 120].map(f => <option key={f} value={f}>{f} fps</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Stabilization">
            <select className={styles.select} value={form.camera.stabilization} onChange={e => setCamera('stabilization', e.target.value)}>
              {['standard', 'cinematic', 'portrait', 'sport'].map(s => <option key={s}>{s}</option>)}
            </select>
          </FieldRow>
          <Toggle label="HDR" checked={form.camera.hdr} onChange={v => setCamera('hdr', v)} />

          {/* AI behaviour */}
          <p className={styles.groupTitle}>AI Behaviour</p>
          <Toggle label="Scene Detection"   checked={form.ai.sceneDetection}  onChange={v => setAI('sceneDetection', v)} />
          <Toggle label="Auto Suggest"      checked={form.ai.autoSuggest}     onChange={v => setAI('autoSuggest', v)} />
          <Toggle label="Noise Reduction"   checked={form.ai.noiseReduction}  onChange={v => setAI('noiseReduction', v)} />
          <Toggle label="Auto Colour Grade" checked={form.ai.autoColourGrade} onChange={v => setAI('autoColourGrade', v)} />

          {/* Privacy */}
          <p className={styles.groupTitle}>Privacy Rules</p>
          <Toggle label="Blur Faces"           checked={form.privacy.blurFaces}          onChange={v => setPrivacy('blurFaces', v)} />
          <Toggle label="Blur Screens"         checked={form.privacy.blurScreens}        onChange={v => setPrivacy('blurScreens', v)} />
          <Toggle label="Mute Sensitive Audio" checked={form.privacy.muteSensitiveAudio} onChange={v => setPrivacy('muteSensitiveAudio', v)} />

          <div style={{ height: 16 }} />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={closeCreate}>Cancel</button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={!form.name.trim()}
          >
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * workflow/components/EditWorkflowDialog.jsx
 *
 * Bottom-sheet dialog for editing an existing workflow.
 * Supports "Update Current Version" or "Save as New Version".
 * Pre-populated from editTarget in WorkflowContext.
 */

import React, { useState, useEffect } from 'react';
import styles from './DialogShared.module.css';
import { useWorkflow } from '../hooks/useWorkflow';
import { WORKFLOW_CATEGORIES } from '../data/mockWorkflowData';

const CATEGORIES = WORKFLOW_CATEGORIES
  .filter(c => !['all', 'favorites', 'recent', 'my', 'builtin', 'ai'].includes(c.id))
  .map(c => c.id);

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

export default function EditWorkflowDialog() {
  const { state, closeEdit, updateWorkflow } = useWorkflow();
  const { editDialogOpen, editTarget: wf } = state;

  const [form, setForm]               = useState(null);
  const [saveMode, setSaveMode]       = useState('update'); // 'update' | 'new_version'
  const [versionNote, setVersionNote] = useState('');

  // Populate form when dialog opens or target changes
  useEffect(() => {
    if (wf) {
      setForm({
        name:        wf.name,
        icon:        wf.icon,
        category:    wf.category,
        description: wf.description,
        tags:        wf.tags.join(', '),
        camera: { ...wf.cameraSettings },
        ai:     { ...wf.aiSettings },
        privacy:{ ...wf.privacySettings },
      });
      setSaveMode('update');
      setVersionNote('');
    }
  }, [wf]);

  if (!editDialogOpen || !form) return null;

  const set        = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setCamera  = (key, val) => setForm(f => ({ ...f, camera:  { ...f.camera,  [key]: val } }));
  const setAI      = (key, val) => setForm(f => ({ ...f, ai:      { ...f.ai,      [key]: val } }));
  const setPrivacy = (key, val) => setForm(f => ({ ...f, privacy: { ...f.privacy, [key]: val } }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    updateWorkflow(
      wf.id,
      {
        name:           form.name.trim(),
        icon:           form.icon,
        category:       form.category,
        description:    form.description.trim(),
        tags:           form.tags.split(',').map(t => t.trim()).filter(Boolean),
        cameraSettings: form.camera,
        aiSettings:     form.ai,
        privacySettings:form.privacy,
        versionNote:    versionNote || 'Updated.',
      },
      saveMode === 'new_version'
    );
  };

  return (
    <div className={styles.overlay} onClick={closeEdit}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Edit Workflow</h2>
          <button className={styles.closeBtn} onClick={closeEdit} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>

          {/* Name */}
          <FieldRow label="Workflow Name *">
            <input
              className={styles.input}
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
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </FieldRow>

          {/* Tags */}
          <FieldRow label="Tags (comma-separated)">
            <input
              className={styles.input}
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

          {/* AI Behaviour */}
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

          {/* Save mode */}
          <p className={styles.groupTitle}>Save As</p>
          <div className={styles.saveModeRow}>
            <button
              type="button"
              className={`${styles.saveModeBtn} ${saveMode === 'update' ? styles.saveModeBtnActive : ''}`}
              onClick={() => setSaveMode('update')}
            >
              Update Current
            </button>
            <button
              type="button"
              className={`${styles.saveModeBtn} ${saveMode === 'new_version' ? styles.saveModeBtnActive : ''}`}
              onClick={() => setSaveMode('new_version')}
            >
              New Version
            </button>
          </div>

          {saveMode === 'new_version' && (
            <FieldRow label="Version Note">
              <input
                className={styles.input}
                placeholder="What changed in this version?"
                value={versionNote}
                onChange={e => setVersionNote(e.target.value)}
                maxLength={120}
              />
            </FieldRow>
          )}

          <div style={{ height: 16 }} />
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={closeEdit}>Cancel</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={!form.name.trim()}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * director/components/MapSaveDialog.jsx
 *
 * Bottom-sheet dialog for naming and saving a Director Map
 * after a Create My Own recording session.
 * Allows optionally linking to a Workflow.
 */

import React, { useState } from 'react';
import styles from './ShotMarkerDialog.module.css';
import { useDirector } from '../hooks/useDirector';

// ── Available workflows for linking (mock — in real app fetched from WorkflowContext) ──
const LINKABLE_WORKFLOWS = [
  { id: 'wf-001', name: 'Travel Vlog' },
  { id: 'wf-002', name: 'Short-Form Reel' },
  { id: 'wf-003', name: 'Interview / Talking Head' },
  { id: 'wf-004', name: 'Food Creator' },
  { id: 'wf-005', name: 'Wedding Shoot' },
];

function FieldRow({ label, children }) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

export default function MapSaveDialog() {
  const { state, closeMapSaveDialog, saveDirectorMap } = useDirector();
  const { mapSaveDialogOpen, currentShotMarkers } = state;

  const [form, setForm] = useState({
    name:        '',
    description: '',
    workflowId:  '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (!mapSaveDialogOpen) return null;

  const handleSave = () => {
    if (!form.name.trim()) return;
    const wf = LINKABLE_WORKFLOWS.find(w => w.id === form.workflowId);
    saveDirectorMap({
      name:         form.name.trim(),
      description:  form.description.trim(),
      workflowId:   form.workflowId || null,
      workflowName: wf ? wf.name : null,
    });
    setForm({ name: '', description: '', workflowId: '' });
  };

  return (
    <div className={styles.overlay} onClick={closeMapSaveDialog}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Save Director Map</h2>
          <button className={styles.closeBtn} onClick={closeMapSaveDialog} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>

          {/* Shot count summary */}
          <div style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🎬</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>
                {currentShotMarkers.length} Shot Marker{currentShotMarkers.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                Ready to be saved as your Director Map
              </div>
            </div>
          </div>

          <FieldRow label="Map Name *">
            <input
              className={styles.input}
              placeholder="e.g. Tokyo Street Walk, Wedding Day Sequence…"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              maxLength={80}
              autoFocus
            />
          </FieldRow>

          <FieldRow label="Description">
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Describe this director map — location, style, intention…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </FieldRow>

          <FieldRow label="Link to Workflow (optional)">
            <select
              className={styles.select}
              value={form.workflowId}
              onChange={e => set('workflowId', e.target.value)}
            >
              <option value="">— No workflow —</option>
              {LINKABLE_WORKFLOWS.map(wf => (
                <option key={wf.id} value={wf.id}>{wf.name}</option>
              ))}
            </select>
          </FieldRow>

          {form.workflowId && (
            <div style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 10,
              padding: '8px 12px',
              marginTop: -8,
              marginBottom: 14,
              fontSize: 11,
              color: '#4ade80',
            }}>
              ✓ This Director Map will become part of "{LINKABLE_WORKFLOWS.find(w => w.id === form.workflowId)?.name}"
            </div>
          )}

          <div style={{ height: 16 }} />
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={closeMapSaveDialog}>Cancel</button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={!form.name.trim()}
          >
            Save Director Map
          </button>
        </div>
      </div>
    </div>
  );
}

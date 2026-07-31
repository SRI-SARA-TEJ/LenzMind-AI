/**
 * director/components/ShotMarkerDialog.jsx
 *
 * Create My Own Mode — Bottom-sheet dialog for adding/editing a ShotMarker.
 * ONLY used in Create My Own mode — AI Guided mode never uses shot markers.
 */

import React, { useState, useEffect } from 'react';
import styles from './ShotMarkerDialog.module.css';
import { useDirector } from '../hooks/useDirector';
import {
  CINEMATIC_TECHNIQUES,
  CAMERA_MOVEMENTS,
  TRANSITIONS,
  DIFFICULTY_LEVELS,
  createBlankShotMarker,
} from '../models/directorModel';

function FieldRow({ label, children }) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

export default function ShotMarkerDialog() {
  const { state, closeShotDialog, addShotMarker, updateShotMarker } = useDirector();
  const { shotDialogOpen, editingShotMarker, currentShotMarkers } = state;

  const isEditing = editingShotMarker !== null;
  const nextOrder = currentShotMarkers.length + 1;

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (shotDialogOpen) {
      if (isEditing) {
        setForm({
          name:            editingShotMarker.name,
          technique:       editingShotMarker.technique,
          movement:        editingShotMarker.movement,
          transition:      editingShotMarker.transition,
          notes:           editingShotMarker.notes,
          durationSeconds: editingShotMarker.durationSeconds,
          difficulty:      editingShotMarker.difficulty,
          tags:            editingShotMarker.tags.join(', '),
        });
      } else {
        const blank = createBlankShotMarker(nextOrder);
        setForm({
          name:            '',
          technique:       blank.technique,
          movement:        blank.movement,
          transition:      blank.transition,
          notes:           '',
          durationSeconds: 5,
          difficulty:      'Beginner',
          tags:            '',
        });
      }
    }
  }, [shotDialogOpen, isEditing, editingShotMarker, nextOrder]);

  if (!shotDialogOpen || !form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const data = {
      name:            form.name.trim(),
      technique:       form.technique,
      movement:        form.movement,
      transition:      form.transition,
      notes:           form.notes.trim(),
      durationSeconds: Number(form.durationSeconds),
      difficulty:      form.difficulty,
      tags:            form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    if (isEditing) {
      updateShotMarker(editingShotMarker.id, data);
    } else {
      const newMarker = { ...createBlankShotMarker(nextOrder), ...data };
      addShotMarker(newMarker);
    }
  };

  return (
    <div className={styles.overlay} onClick={closeShotDialog}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? 'Edit Shot' : `Shot ${nextOrder} — Add Marker`}
          </h2>
          <button className={styles.closeBtn} onClick={closeShotDialog} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>

          <FieldRow label="Shot Name *">
            <input
              className={styles.input}
              placeholder="e.g. Opening Wide, Temple Reveal…"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              maxLength={60}
              autoFocus
            />
          </FieldRow>

          <FieldRow label="Cinematic Technique">
            <select className={styles.select} value={form.technique} onChange={e => set('technique', e.target.value)}>
              {CINEMATIC_TECHNIQUES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FieldRow>

          <FieldRow label="Camera Movement">
            <select className={styles.select} value={form.movement} onChange={e => set('movement', e.target.value)}>
              {CAMERA_MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FieldRow>

          <FieldRow label="Transition to Next">
            <select className={styles.select} value={form.transition} onChange={e => set('transition', e.target.value)}>
              {TRANSITIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FieldRow>

          <FieldRow label={`Duration: ${form.durationSeconds}s`}>
            <input
              type="range"
              className={styles.range}
              min={1} max={60} step={1}
              value={form.durationSeconds}
              onChange={e => set('durationSeconds', e.target.value)}
            />
          </FieldRow>

          <FieldRow label="Difficulty">
            <div className={styles.diffRow}>
              {DIFFICULTY_LEVELS.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.diffBtn} ${form.difficulty === d ? styles.diffBtnActive : ''}`}
                  onClick={() => set('difficulty', d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </FieldRow>

          <FieldRow label="Notes">
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Any notes, framing ideas, location tips…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
            />
          </FieldRow>

          <FieldRow label="Tags (comma-separated)">
            <input
              className={styles.input}
              placeholder="establishing, close-up, transition…"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
          </FieldRow>

          <div style={{ height: 16 }} />
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={closeShotDialog}>Cancel</button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={!form.name.trim()}
          >
            {isEditing ? 'Save Changes' : 'Add Shot'}
          </button>
        </div>
      </div>
    </div>
  );
}

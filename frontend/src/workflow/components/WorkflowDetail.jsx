/**
 * workflow/components/WorkflowDetail.jsx
 *
 * Full-screen detail view for a selected workflow.
 * Slides in from the right (CSS transform).
 *
 * Sections:
 *   Header (back, name, actions)
 *   Description + tags
 *   Camera settings
 *   AI settings
 *   Privacy settings
 *   Style summary
 *   Usage stats
 *   Version History
 *
 * Actions: Apply | Edit | Duplicate | Delete
 */

import React, { useState } from 'react';
import styles from './WorkflowDetail.module.css';
import { useWorkflow } from '../hooks/useWorkflow';
import WorkflowVersionHistory from './WorkflowVersionHistory';

function SettingRow({ label, value }) {
  return (
    <div className={styles.settingRow}>
      <span className={styles.settingLabel}>{label}</span>
      <span className={styles.settingValue}>{String(value)}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{title}</p>
      {children}
    </div>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkflowDetail() {
  const { state, clearSelected, openEdit, duplicateWorkflow, deleteWorkflow, setPreview, toggleFavorite } = useWorkflow();
  const { selectedWorkflow: wf } = state;
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!wf) return null;

  const handleDelete = () => {
    if (confirmDelete) {
      deleteWorkflow(wf.id);
      clearSelected();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleDuplicate = () => {
    duplicateWorkflow(wf.id);
    clearSelected();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.screen}>

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={clearSelected} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className={styles.topTitle}>Workflow Detail</span>
          <button
            className={`${styles.favBtn} ${wf.isFavorite ? styles.favActive : ''}`}
            onClick={() => toggleFavorite(wf.id)}
            aria-label="Toggle favorite"
          >
            {wf.isFavorite ? '★' : '☆'}
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className={styles.body}>

          {/* Hero */}
          <div className={styles.hero}>
            <span className={styles.heroIcon}>{wf.icon}</span>
            <div>
              <h1 className={styles.heroName}>{wf.name}</h1>
              <div className={styles.heroBadges}>
                <span className={styles.catBadge}>{wf.category}</span>
                {wf.aiLearned && <span className={styles.aiBadge}>✦ AI Learned</span>}
                {wf.isBuiltIn && <span className={styles.builtBadge}>Built-in</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          <Section title="Description">
            <p className={styles.description}>{wf.description}</p>
          </Section>

          {/* Style summary */}
          {wf.styleSummary && (
            <Section title="Style Summary">
              <p className={styles.styleSummary}>{wf.styleSummary}</p>
            </Section>
          )}

          {/* Tags */}
          {wf.tags.length > 0 && (
            <Section title="Tags">
              <div className={styles.tags}>
                {wf.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Camera settings */}
          <Section title="Camera Settings">
            <SettingRow label="Resolution"    value={wf.cameraSettings.resolution} />
            <SettingRow label="Frame Rate"    value={`${wf.cameraSettings.fps} fps`} />
            <SettingRow label="HDR"           value={wf.cameraSettings.hdr ? 'Enabled' : 'Off'} />
            <SettingRow label="Flash"         value={wf.cameraSettings.flash} />
            <SettingRow label="Stabilization" value={wf.cameraSettings.stabilization} />
            <SettingRow label="Focus"         value={wf.cameraSettings.focusMode} />
            <SettingRow label="White Balance" value={wf.cameraSettings.whiteBalance} />
          </Section>

          {/* AI settings */}
          <Section title="AI Settings">
            <SettingRow label="Scene Detection"  value={wf.aiSettings.sceneDetection ? 'On' : 'Off'} />
            <SettingRow label="Auto Suggest"     value={wf.aiSettings.autoSuggest ? 'On' : 'Off'} />
            <SettingRow label="Noise Reduction"  value={wf.aiSettings.noiseReduction ? 'On' : 'Off'} />
            <SettingRow label="Colour Grade"     value={wf.aiSettings.autoColourGrade ? 'On' : 'Off'} />
            <SettingRow label="Enhancement"      value={wf.aiSettings.enhancementLevel} />
          </Section>

          {/* Privacy settings */}
          <Section title="Privacy Settings">
            <SettingRow label="Blur Faces"     value={wf.privacySettings.blurFaces ? 'On' : 'Off'} />
            <SettingRow label="Blur Screens"   value={wf.privacySettings.blurScreens ? 'On' : 'Off'} />
            <SettingRow label="Mute Audio"     value={wf.privacySettings.muteSensitiveAudio ? 'On' : 'Off'} />
            <SettingRow label="Metadata Strip" value={wf.privacySettings.metadataStrip} />
          </Section>

          {/* Usage metadata */}
          <Section title="Usage">
            <SettingRow label="Usage Count"   value={`${wf.usageCount} times`} />
            <SettingRow label="Last Used"     value={wf.lastUsedAt ? formatDate(wf.lastUsedAt) : 'Never'} />
            <SettingRow label="Created"       value={formatDate(wf.createdAt)} />
            <SettingRow label="Last Modified" value={formatDate(wf.updatedAt)} />
            {wf.projectIds.length > 0 && (
              <SettingRow label="Projects Using" value={`${wf.projectIds.length} project${wf.projectIds.length > 1 ? 's' : ''}`} />
            )}
          </Section>

          {/* Version History */}
          <Section title="">
            <WorkflowVersionHistory workflow={wf} />
          </Section>

          {/* Danger zone */}
          {!wf.isBuiltIn && (
            <div className={styles.danger}>
              <button
                className={`${styles.dangerBtn} ${confirmDelete ? styles.dangerConfirm : ''}`}
                onClick={handleDelete}
              >
                {confirmDelete ? 'Tap again to confirm delete' : 'Delete Workflow'}
              </button>
            </div>
          )}

          {/* Bottom spacer */}
          <div style={{ height: 100 }} />
        </div>

        {/* ── Fixed action bar ─────────────────────────────────────────── */}
        <div className={styles.actionBar}>
          {!wf.isBuiltIn && (
            <button className={styles.actionGhost} onClick={() => openEdit(wf)}>Edit</button>
          )}
          <button className={styles.actionGhost} onClick={handleDuplicate}>Duplicate</button>
          <button className={styles.actionPrimary} onClick={() => setPreview(wf)}>Apply</button>
        </div>

      </div>
    </div>
  );
}

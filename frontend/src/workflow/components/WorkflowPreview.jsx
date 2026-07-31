/**
 * workflow/components/WorkflowPreview.jsx
 *
 * Modal overlay shown before applying a workflow.
 * Displays all relevant settings and estimated battery impact.
 *
 * Actions: Apply | Cancel
 */

import React from 'react';
import styles from './WorkflowPreview.module.css';
import { useWorkflow } from '../hooks/useWorkflow';
import { estimateBatteryImpact } from '../data/mockWorkflowData';
import { useNavigate } from 'react-router-dom';

function Row({ label, value, highlight }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={`${styles.rowValue} ${highlight ? styles.highlight : ''}`}>{value}</span>
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

export default function WorkflowPreview() {
  const { state, clearPreview, incrementUsage } = useWorkflow();
  const { previewWorkflow: wf } = state;
  const navigate = useNavigate();

  if (!wf) return null;

  const batteryImpact = estimateBatteryImpact(wf.cameraSettings);
  const batteryColor  = batteryImpact === 'Low' ? '#22c55e' : batteryImpact === 'Medium' ? '#f59e0b' : '#ef4444';

  const handleApply = () => {
    incrementUsage(wf.id);
    clearPreview();
    navigate('/camera');
  };

  return (
    <div className={styles.overlay} onClick={clearPreview}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerIcon}>{wf.icon}</span>
          <div>
            <h2 className={styles.headerName}>{wf.name}</h2>
            <span className={styles.headerCat}>{wf.category}</span>
          </div>
          <button className={styles.closeBtn} onClick={clearPreview} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          {/* Camera settings */}
          <Section title="Camera Settings">
            <Row label="Resolution"    value={wf.cameraSettings.resolution} />
            <Row label="Frame Rate"    value={`${wf.cameraSettings.fps} fps`} />
            <Row label="HDR"           value={wf.cameraSettings.hdr ? 'Enabled' : 'Off'} />
            <Row label="Stabilization" value={wf.cameraSettings.stabilization} />
            <Row label="Focus"         value={wf.cameraSettings.focusMode} />
            <Row label="White Balance" value={wf.cameraSettings.whiteBalance} />
          </Section>

          {/* AI settings */}
          <Section title="AI Features">
            <Row label="Scene Detection"  value={wf.aiSettings.sceneDetection ? 'On' : 'Off'} />
            <Row label="Auto Suggest"     value={wf.aiSettings.autoSuggest ? 'On' : 'Off'} />
            <Row label="Noise Reduction"  value={wf.aiSettings.noiseReduction ? 'On' : 'Off'} />
            <Row label="Auto Colour Grade" value={wf.aiSettings.autoColourGrade ? 'On' : 'Off'} />
            <Row label="AI Enhancement"   value={wf.aiSettings.enhancementLevel} />
          </Section>

          {/* Privacy */}
          <Section title="Privacy">
            <Row label="Blur Faces"    value={wf.privacySettings.blurFaces ? 'On' : 'Off'} />
            <Row label="Blur Screens"  value={wf.privacySettings.blurScreens ? 'On' : 'Off'} />
            <Row label="Mute Audio"    value={wf.privacySettings.muteSensitiveAudio ? 'On' : 'Off'} />
            <Row label="Metadata"      value={wf.privacySettings.metadataStrip === 'none' ? 'Keep all' : `Strip ${wf.privacySettings.metadataStrip}`} />
          </Section>

          {/* Battery impact */}
          <div className={styles.batteryRow}>
            <span className={styles.batteryLabel}>Estimated Battery Impact</span>
            <span className={styles.batteryValue} style={{ color: batteryColor }}>
              {batteryImpact}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={clearPreview}>Cancel</button>
          <button className={styles.btnApply}  onClick={handleApply}>Apply Workflow</button>
        </div>
      </div>
    </div>
  );
}

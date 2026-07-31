/**
 * workflow/components/WorkflowVersionHistory.jsx
 *
 * Displays the version history for a single workflow.
 * Actions per version: Restore | Compare (placeholder) | Duplicate
 *
 * Props:
 *   workflow {Workflow}
 */

import React, { useState } from 'react';
import styles from './WorkflowVersionHistory.module.css';
import { useWorkflow } from '../hooks/useWorkflow';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkflowVersionHistory({ workflow }) {
  const { restoreVersion, duplicateWorkflow } = useWorkflow();
  const [confirming, setConfirming] = useState(null); // version id being confirmed

  if (!workflow) return null;

  const handleRestore = (versionId) => {
    if (confirming === versionId) {
      restoreVersion(workflow.id, versionId);
      setConfirming(null);
    } else {
      setConfirming(versionId);
    }
  };

  return (
    <div className={styles.root}>
      <p className={styles.heading}>Version History</p>
      {workflow.versions.length === 0 && (
        <p className={styles.empty}>No versions recorded.</p>
      )}
      {workflow.versions.map((ver, idx) => (
        <div key={ver.id} className={`${styles.entry} ${idx === 0 ? styles.current : ''}`}>
          <div className={styles.entryLeft}>
            <span className={styles.vLabel}>{ver.versionLabel}</span>
            {idx === 0 && <span className={styles.currentBadge}>Current</span>}
            <span className={styles.date}>{formatDate(ver.createdAt)}</span>
          </div>
          <p className={styles.notes}>{ver.notes}</p>
          <div className={styles.actions}>
            {idx !== 0 && (
              <button
                className={`${styles.btn} ${confirming === ver.id ? styles.btnConfirm : ''}`}
                onClick={() => handleRestore(ver.id)}
              >
                {confirming === ver.id ? 'Confirm Restore' : 'Restore'}
              </button>
            )}
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => alert('Compare — coming in V2')}>
              Compare
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => duplicateWorkflow(workflow.id)}>
              Duplicate
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

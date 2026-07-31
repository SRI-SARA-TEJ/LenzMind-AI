/**
 * camera/components/WorkflowIndicator.jsx
 *
 * Shows the currently active workflow name with a dropdown chevron.
 * Tapping navigates to the Workflow Library (placeholder in v1).
 */

import React, { useState } from 'react';
import styles from './WorkflowIndicator.module.css';
import { useCamera } from '../context/CameraContext';

export default function WorkflowIndicator() {
  const { state, setWorkflow } = useCamera();
  const { activeWorkflow, workflows } = state;
  const [open, setOpen] = useState(false);

  const handleSelect = (wf) => {
    setWorkflow(wf);
    setOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.indicator}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Select workflow"
        aria-expanded={open}
      >
        <span className={styles.icon}>{activeWorkflow.icon}</span>
        <span className={styles.name}>{activeWorkflow.name}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.dropdown}>
            <p className={styles.dropdownLabel}>Workflow Library</p>
            {workflows.map(wf => (
              <button
                key={wf.id}
                className={`${styles.dropItem} ${wf.id === activeWorkflow.id ? styles.dropItemActive : ''}`}
                onClick={() => handleSelect(wf)}
              >
                <span>{wf.icon}</span>
                <span className={styles.dropName}>{wf.name}</span>
                <span className={styles.dropCat}>{wf.category}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

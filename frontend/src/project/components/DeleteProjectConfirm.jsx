/**
 * project/components/DeleteProjectConfirm.jsx
 *
 * Centered modal dialog for confirming project deletion.
 */

import React from 'react';
import styles from './ProjectDialogShared.module.css';
import { useProject } from '../hooks/useProject';

export default function DeleteProjectConfirm() {
  const { state, closeDeleteConfirm, deleteProject } = useProject();
  const { deleteConfirmId, projects } = state;

  if (!deleteConfirmId) return null;

  const project = projects.find(p => p.id === deleteConfirmId);
  if (!project) return null;

  const handleConfirm = () => {
    deleteProject(deleteConfirmId);
    closeDeleteConfirm();
  };

  return (
    <div className={styles.deleteOverlay} onClick={closeDeleteConfirm}>
      <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
        <span className={styles.deleteIcon}>🗑️</span>
        <h2 className={styles.deleteTitle}>Delete Project?</h2>
        <p className={styles.deleteDesc}>
          "{project.title}" and all its data will be permanently deleted.
          This action cannot be undone.
        </p>
        <div className={styles.deleteActions}>
          <button className={styles.deleteCancelBtn} onClick={closeDeleteConfirm}>
            Cancel
          </button>
          <button className={styles.deleteConfirmBtn} onClick={handleConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

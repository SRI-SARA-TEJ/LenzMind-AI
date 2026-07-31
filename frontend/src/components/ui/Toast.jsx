/**
 * components/ui/Toast.jsx
 *
 * Global notification toast that reads from AppContext.
 * Appears at the bottom-right and auto-dismisses after 4 seconds.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import styles from './Toast.module.css';

export default function Toast() {
  const { state } = useApp();
  const { notification } = state;

  if (!notification) return null;

  const icons = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
  };

  return (
    <div className={`${styles.toast} ${styles[notification.type]}`}>
      <span className={styles.icon}>{icons[notification.type] || 'ℹ'}</span>
      <span>{notification.message}</span>
    </div>
  );
}

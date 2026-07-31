import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.code}>404</div>
      <h2 className={styles.title}>Page not found</h2>
      <p className={styles.text}>The page you're looking for doesn't exist.</p>
      <button className={styles.btn} onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
}

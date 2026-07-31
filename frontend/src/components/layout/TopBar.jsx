import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './TopBar.module.css';

const PAGE_TITLES = {
  '/dashboard':      { title: 'Dashboard',   subtitle: 'Overview of your creative workspace' },
  '/upload':         { title: 'Upload Content', subtitle: 'Add photos or videos to a project' },
  '/recommendations':{ title: 'AI Suggestions', subtitle: 'Review AI-generated recommendations' },
  '/analytics':      { title: 'Analytics',   subtitle: 'Track how AI recommendations are performing' },
};

export default function TopBar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const page      = PAGE_TITLES[location.pathname] || { title: 'Workspace', subtitle: '' };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>{page.title}</h1>
        {page.subtitle && <p className={styles.subtitle}>{page.subtitle}</p>}
      </div>

      <div className={styles.right}>
        {/* Quick action — upload */}
        <button
          className={styles.uploadBtn}
          onClick={() => navigate('/upload')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Upload
        </button>

        {/* User avatar (placeholder — auth comes later) */}
        <div className={styles.avatar} title="User profile">C</div>
      </div>
    </header>
  );
}

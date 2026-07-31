import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    to: '/upload',
    label: 'Upload Content',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    to: '/recommendations',
    label: 'AI Suggestions',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    ),
    badge: 'AI',
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
  },
];

const AGENT_ITEMS = [
  { label: 'Camera Intelligence', color: 'var(--agent-camera)' },
  { label: 'Editing Intelligence', color: 'var(--agent-editing)' },
  { label: 'Content Optimization', color: 'var(--agent-optimize)' },
  { label: 'Analytics', color: 'var(--agent-analytics)' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className={styles.sidebar}>
      {/* Logo / Brand */}
      <div className={styles.brand} onClick={() => navigate('/dashboard')}>
        <div className={styles.brandIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div>
          <div className={styles.brandName}>AI Creator OS</div>
          <div className={styles.brandTagline}>Foundation MVP</div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className={styles.nav}>
        <span className={styles.navLabel}>Navigation</span>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className={styles.badge}>{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      {/* AI Agents section */}
      <div className={styles.agents}>
        <span className={styles.navLabel}>AI Agents</span>
        {AGENT_ITEMS.map((agent) => (
          <div key={agent.label} className={styles.agentItem}>
            <span
              className={styles.agentDot}
              style={{ background: agent.color }}
            />
            <span>{agent.label}</span>
            <span className={styles.agentStatus}>Soon</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.ibmBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
          Ready for IBM watsonx.ai
        </div>
      </div>
    </aside>
  );
}

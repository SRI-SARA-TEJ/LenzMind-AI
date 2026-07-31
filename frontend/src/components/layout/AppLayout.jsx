/**
 * components/layout/AppLayout.jsx
 *
 * The shell of the entire application: sidebar + topbar + main content area.
 * Uses React Router's <Outlet> to render the active page inside the shell.
 *
 * Layout structure:
 *   ┌─────────┬────────────────────────┐
 *   │         │      TopBar            │
 *   │ Sidebar ├────────────────────────│
 *   │         │      <Page>            │
 *   └─────────┴────────────────────────┘
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar  from './TopBar';
import Toast   from '../ui/Toast';
import styles  from './AppLayout.module.css';

export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}

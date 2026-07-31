/**
 * workflow/components/WorkflowStats.jsx
 *
 * Summary stats bar shown at the top of the library screen.
 * Displays total count, favorites, AI-suggested, and total uses.
 */

import React from 'react';
import styles from './WorkflowStats.module.css';
import { useWorkflow } from '../hooks/useWorkflow';

export default function WorkflowStats() {
  const { state } = useWorkflow();
  const { workflows } = state;

  const totalUses   = workflows.reduce((sum, wf) => sum + wf.usageCount, 0);
  const favorites   = workflows.filter(wf => wf.isFavorite).length;
  const aiCount     = workflows.filter(wf => wf.aiLearned).length;
  const myCount     = workflows.filter(wf => !wf.isBuiltIn && !wf.aiLearned).length;

  const stats = [
    { label: 'Total',     value: workflows.length, color: '#e8eaf0' },
    { label: 'Favorites', value: favorites,         color: '#f59e0b' },
    { label: 'AI',        value: aiCount,           color: '#a5b4fc' },
    { label: 'My Own',    value: myCount,           color: '#34d399' },
    { label: 'Uses',      value: totalUses,         color: '#64748b' },
  ];

  return (
    <div className={styles.bar}>
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className={styles.stat}>
            <span className={styles.val} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.lbl}>{s.label}</span>
          </div>
          {i < stats.length - 1 && <div className={styles.sep} />}
        </React.Fragment>
      ))}
    </div>
  );
}

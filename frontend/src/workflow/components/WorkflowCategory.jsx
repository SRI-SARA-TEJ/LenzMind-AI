/**
 * workflow/components/WorkflowCategory.jsx
 *
 * Horizontal scrollable category filter pills.
 * Reads categories from context; highlights active one.
 */

import React from 'react';
import styles from './WorkflowCategory.module.css';
import { useWorkflow } from '../hooks/useWorkflow';

export default function WorkflowCategory() {
  const { state, setCategory } = useWorkflow();
  const { categories, activeCategory } = state;

  return (
    <div className={styles.wrapper} role="tablist" aria-label="Workflow categories">
      <div className={styles.scroll}>
        {categories.map(cat => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`${styles.pill} ${activeCategory === cat.id ? styles.pillActive : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            <span className={styles.catIcon}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

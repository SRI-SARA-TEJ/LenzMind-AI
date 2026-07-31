/**
 * workflow/components/WorkflowSearch.jsx
 *
 * Controlled search bar. Clears on ✕.
 * Architecture note: replace the onChange handler with a debounced
 * semantic AI search call in a future version — no component changes needed.
 */

import React, { useRef } from 'react';
import styles from './WorkflowSearch.module.css';
import { useWorkflow } from '../hooks/useWorkflow';

export default function WorkflowSearch() {
  const { state, setSearch } = useWorkflow();
  const inputRef = useRef(null);

  const handleClear = () => {
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.searchIcon}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Search workflows by name, tags, or description…"
        value={state.searchQuery}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search workflows"
      />
      {state.searchQuery && (
        <button className={styles.clearBtn} onClick={handleClear} aria-label="Clear search">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

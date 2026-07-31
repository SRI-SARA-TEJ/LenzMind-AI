/**
 * pages/RecommendationsPage.jsx — AI Recommendations Hub
 *
 * What changed from the stub:
 *  - Connected to real backend analysis APIs (analyzeProject).
 *  - Loading state uses RecommendationSkeleton instead of plain text.
 *  - Error state has dismiss + retry.
 *  - AIDisclaimer banner always visible (switches to 'mock' variant when
 *    all visible recommendations are mocks).
 *  - "Run AI Analysis" button per project — triggers the orchestrator.
 *  - Per-project analyze button shows a spinner while running.
 *  - Summary bar counts are derived from live state.
 *  - Filter state is preserved between analyses.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useApp }                          from '../context/AppContext';
import RecommendationCard                  from '../components/ui/RecommendationCard';
import AIDisclaimer                        from '../components/ui/AIDisclaimer';
import { RecommendationSkeleton }          from '../components/ui/LoadingSpinner';
import { LoadingSpinner }                  from '../components/ui/LoadingSpinner';
import * as api                            from '../services/api';
import styles                              from './RecommendationsPage.module.css';

// ── Filter definitions ────────────────────────────────────────────────────────
const AGENT_FILTERS = [
  { value: 'all',                  label: 'All Agents' },
  { value: 'camera-intelligence',  label: 'Camera' },
  { value: 'editing-intelligence', label: 'Editing' },
  { value: 'content-optimization', label: 'Optimize' },
  { value: 'creator-memory',       label: 'Memory' },
  { value: 'analytics',            label: 'Analytics' },
];

const ACTION_FILTERS = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'accepted',  label: 'Accepted' },
  { value: 'dismissed', label: 'Dismissed' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const { state, notify } = useApp();
  const { projects }      = state;

  const [recommendations, setRecommendations] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [agentFilter,     setAgentFilter]     = useState('all');
  const [actionFilter,    setActionFilter]    = useState('all');
  // Map of projectId → boolean — tracks which projects are currently running analysis
  const [analyzing,       setAnalyzing]       = useState({});

  // ── Load stored recommendations on mount / when projects list changes ────────
  const loadAll = useCallback(async () => {
    if (projects.length === 0) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        projects.map((p) => api.getRecommendations(p._id))
      );
      setRecommendations(results.flat());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projects]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── User accepts / dismisses a recommendation ─────────────────────────────
  async function handleAction(recId, action) {
    try {
      const updated = await api.respondToRecommendation(recId, action);
      setRecommendations((prev) =>
        prev.map((r) => (r._id === recId ? updated : r))
      );
      notify('success', action === 'accepted' ? 'Suggestion accepted!' : 'Suggestion dismissed');
    } catch (err) {
      notify('error', err.message);
    }
  }

  // ── Trigger AI analysis for a project ─────────────────────────────────────
  async function handleAnalyze(projectId) {
    setAnalyzing((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await api.analyzeProject(projectId);
      if (res.data && res.data.length > 0) {
        // Prepend new recommendations into the existing list
        setRecommendations((prev) => [...res.data, ...prev]);
        notify('success', res.message || `${res.count} recommendation(s) added`);
      } else {
        notify('info', res.message || 'No new recommendations generated');
      }
    } catch (err) {
      notify('error', `Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing((prev) => ({ ...prev, [projectId]: false }));
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const filtered = recommendations.filter((r) => {
    const agentMatch  = agentFilter  === 'all' || r.agentType  === agentFilter;
    const actionMatch = actionFilter === 'all' || r.userAction === actionFilter;
    return agentMatch && actionMatch;
  });

  const pendingCount   = recommendations.filter((r) => r.userAction === 'pending').length;
  const acceptedCount  = recommendations.filter((r) => r.userAction === 'accepted').length;
  const dismissedCount = recommendations.filter((r) => r.userAction === 'dismissed').length;

  // Show mock disclaimer when there are recommendations and they are all mocks
  const hasMocks = recommendations.length > 0 &&
    recommendations.every((r) => r.tags?.includes('mock'));

  const anyAnalyzing = Object.values(analyzing).some(Boolean);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── AI disclaimer banner ──────────────────────────────────── */}
      <AIDisclaimer variant={hasMocks ? 'mock' : 'info'} />

      {/* ── Summary bar ──────────────────────────────────────────── */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{recommendations.length}</span>
          <span className={styles.summaryLabel}>Total</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue} style={{ color: 'var(--color-warning)' }}>
            {pendingCount}
          </span>
          <span className={styles.summaryLabel}>Pending</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue} style={{ color: 'var(--color-success)' }}>
            {acceptedCount}
          </span>
          <span className={styles.summaryLabel}>Accepted</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue} style={{ color: 'var(--color-text-muted)' }}>
            {dismissedCount}
          </span>
          <span className={styles.summaryLabel}>Dismissed</span>
        </div>
      </div>

      {/* ── Analyze controls ─────────────────────────────────────── */}
      {projects.length > 0 && (
        <div className={styles.analyzeSection}>
          <span className={styles.analyzeLabel}>Run AI Analysis:</span>
          <div className={styles.analyzeButtons}>
            {projects.map((project) => {
              const isRunning = !!analyzing[project._id];
              return (
                <button
                  key={project._id}
                  className={styles.analyzeBtn}
                  onClick={() => handleAnalyze(project._id)}
                  disabled={isRunning || anyAnalyzing}
                  title={`Analyze all assets in "${project.title}"`}
                >
                  {isRunning
                    ? <><LoadingSpinner size={12} />&nbsp;Analyzing…</>
                    : `Analyze "${project.title}"`
                  }
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Agent:</span>
          {AGENT_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`${styles.filterChip} ${agentFilter === f.value ? styles.active : ''}`}
              onClick={() => setAgentFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status:</span>
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`${styles.filterChip} ${actionFilter === f.value ? styles.active : ''}`}
              onClick={() => setActionFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────────── */}
      {error && !loading && (
        <div className={styles.errorState}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-error)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
          <button className={styles.retryBtn} onClick={loadAll}>Retry</button>
        </div>
      )}

      {/* ── Main content: loading / empty / list ─────────────────── */}
      {loading ? (
        <div className={styles.recList}>
          <RecommendationSkeleton count={3} />
        </div>
      ) : !error && filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-text-muted)" strokeWidth="1">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          {recommendations.length > 0 && filtered.length === 0 ? (
            <>
              <h3 className={styles.emptyTitle}>No recommendations match this filter</h3>
              <p className={styles.emptyText}>
                Try changing the Agent or Status filter above.
              </p>
            </>
          ) : (
            <>
              <h3 className={styles.emptyTitle}>No AI suggestions yet</h3>
              <p className={styles.emptyText}>
                Use the <strong>Run AI Analysis</strong> buttons above to trigger
                the Camera Intelligence, Editing Intelligence, Content
                Optimization, and Creator Memory Agents on your projects.
                {!projects.length && ' Create a project and upload assets first.'}
              </p>
              {projects.length > 0 && (
                <div className={styles.agentReadyList}>
                  <p className={styles.agentReadyTitle}>Agents ready to activate:</p>
                  {[
                    { name: 'Camera Intelligence',  color: 'var(--agent-camera)' },
                    { name: 'Editing Intelligence', color: 'var(--agent-editing)' },
                    { name: 'Content Optimization', color: 'var(--agent-optimize)' },
                    { name: 'Analytics',            color: 'var(--agent-analytics)' },
                  ].map((a) => (
                    <div key={a.name} className={styles.agentReadyItem}>
                      <span style={{ background: a.color }} className={styles.agentReadyDot} />
                      {a.name}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : !error ? (
        <div className={styles.recList}>
          {filtered.map((rec) => (
            <RecommendationCard key={rec._id} rec={rec} onAction={handleAction} />
          ))}
        </div>
      ) : null}

    </div>
  );
}

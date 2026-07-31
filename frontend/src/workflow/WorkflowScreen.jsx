/**
 * workflow/WorkflowScreen.jsx — Workflow Library Main Screen
 *
 * Layout (top → bottom):
 *   ┌─────────────────────────────────┐
 *   │  Header: title + AI suggestions │
 *   │  WorkflowStats                  │
 *   │  WorkflowSearch                 │
 *   │  WorkflowCategory pills         │
 *   │  ── Scrollable content ──       │
 *   │    AI Suggested section         │
 *   │    Favorites section            │
 *   │    Recent section               │
 *   │    All Workflows section        │
 *   │  ── End scrollable ──           │
 *   │  BottomNavBar                   │
 *   └─────────────────────────────────┘
 *
 * Overlays (portal-style, fixed):
 *   WorkflowDetail     — slides in from right
 *   WorkflowPreview    — bottom sheet
 *   CreateWorkflowDialog — bottom sheet
 *   EditWorkflowDialog   — bottom sheet
 *
 * Floating "Create" button (bottom-right, above nav)
 */

import React, { useMemo } from 'react';
import styles from './WorkflowScreen.module.css';

import { useWorkflow }         from './hooks/useWorkflow';

import WorkflowStats          from './components/WorkflowStats';
import WorkflowSearch         from './components/WorkflowSearch';
import WorkflowCategory       from './components/WorkflowCategory';
import WorkflowCard           from './components/WorkflowCard';
import WorkflowDetail         from './components/WorkflowDetail';
import WorkflowPreview        from './components/WorkflowPreview';
import CreateWorkflowDialog   from './components/CreateWorkflowDialog';
import EditWorkflowDialog     from './components/EditWorkflowDialog';

import BottomNavBar           from '../camera/components/BottomNavBar';

// ── Section component ─────────────────────────────────────────────────────────
function Section({ title, subtitle, children, accent }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={`${styles.sectionTitle} ${accent ? styles.sectionTitleAccent : ''}`}>{title}</h2>
          {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── AI Suggested card (special layout) ───────────────────────────────────────
function AISuggestionBanner({ workflow, onAccept, onIgnore, onView }) {
  return (
    <div className={styles.aiBanner}>
      <div className={styles.aiBannerTop}>
        <span className={styles.aiBannerBadge}>✦ AI Suggestion</span>
        <button className={styles.aiBannerIgnore} onClick={() => onIgnore(workflow.id)}>Ignore</button>
      </div>
      <p className={styles.aiBannerDesc}>{workflow.description}</p>
      <div className={styles.aiBannerFooter}>
        <span className={styles.aiBannerName}>{workflow.icon} {workflow.name}</span>
        <div className={styles.aiBannerActions}>
          <button className={styles.aiBannerView} onClick={() => onView(workflow)}>View</button>
          <button className={styles.aiBannerAccept} onClick={() => onAccept(workflow.id)}>Accept</button>
        </div>
      </div>
    </div>
  );
}

// ── Inner screen (reads from context) ────────────────────────────────────────
function WorkflowScreenInner() {
  const {
    state,
    filteredWorkflows,
    selectWorkflow,
    setPreview,
    openCreate,
    acceptAISuggestion,
    ignoreAISuggestion,
  } = useWorkflow();

  const { activeCategory, searchQuery } = state;
  const isFiltered = activeCategory !== 'all' || searchQuery.trim() !== '';

  // Derived sections (only shown when not filtered)
  const aiSuggested = useMemo(
    () => state.workflows.filter(wf => wf.aiLearned && wf.category === 'AI Suggested'),
    [state.workflows]
  );
  const favorites = useMemo(
    () => state.workflows.filter(wf => wf.isFavorite),
    [state.workflows]
  );
  const recent = useMemo(
    () => state.workflows
      .filter(wf => wf.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, 4),
    [state.workflows]
  );

  return (
    <div className={styles.screen}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.topTitle}>Workflow Library</h1>
          <p className={styles.topSubtitle}>{state.workflows.length} workflows</p>
        </div>
        <div className={styles.topBadge}>
          <span className={styles.aiBadgeDot} />
          AI Ready
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className={styles.statsWrap}>
        <WorkflowStats />
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className={styles.searchWrap}>
        <WorkflowSearch />
      </div>

      {/* ── Category pills ────────────────────────────────────────────────── */}
      <WorkflowCategory />

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <div className={styles.content}>

        {/* Filtered results */}
        {isFiltered ? (
          <Section
            title={`Results (${filteredWorkflows.length})`}
            subtitle={searchQuery ? `Searching: "${searchQuery}"` : ''}
          >
            {filteredWorkflows.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyIcon}>🔍</p>
                <p className={styles.emptyText}>No workflows match your search.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredWorkflows.map(wf => (
                  <WorkflowCard
                    key={wf.id}
                    workflow={wf}
                    onSelect={selectWorkflow}
                    onApply={setPreview}
                  />
                ))}
              </div>
            )}
          </Section>
        ) : (
          <>
            {/* AI Suggested banners */}
            {aiSuggested.length > 0 && (
              <Section
                title="AI Suggested"
                subtitle={`${aiSuggested.length} new suggestion${aiSuggested.length > 1 ? 's' : ''} based on your content patterns`}
                accent
              >
                {aiSuggested.map(wf => (
                  <AISuggestionBanner
                    key={wf.id}
                    workflow={wf}
                    onAccept={acceptAISuggestion}
                    onIgnore={ignoreAISuggestion}
                    onView={selectWorkflow}
                  />
                ))}
              </Section>
            )}

            {/* Favorites */}
            {favorites.length > 0 && (
              <Section title="Favorites" subtitle="Your starred workflows">
                <div className={styles.grid}>
                  {favorites.map(wf => (
                    <WorkflowCard
                      key={wf.id}
                      workflow={wf}
                      onSelect={selectWorkflow}
                      onApply={setPreview}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Recent */}
            {recent.length > 0 && (
              <Section title="Recently Used">
                <div className={styles.hScroll}>
                  {recent.map(wf => (
                    <div key={wf.id} className={styles.hCard}>
                      <WorkflowCard
                        workflow={wf}
                        onSelect={selectWorkflow}
                        onApply={setPreview}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* All workflows */}
            <Section title="All Workflows" subtitle={`${filteredWorkflows.length} total`}>
              <div className={styles.grid}>
                {filteredWorkflows.map(wf => (
                  <WorkflowCard
                    key={wf.id}
                    workflow={wf}
                    onSelect={selectWorkflow}
                    onApply={setPreview}
                  />
                ))}
              </div>
            </Section>
          </>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* ── Create FAB ───────────────────────────────────────────────────── */}
      <button
        className={styles.fab}
        onClick={openCreate}
        aria-label="Create new workflow"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5"  y1="12" x2="19" y2="12" />
        </svg>
        <span>New</span>
      </button>

      {/* ── Bottom navigation ─────────────────────────────────────────────── */}
      <BottomNavBar />

      {/* ── Overlays (fixed, portal-like) ─────────────────────────────────── */}
      <WorkflowDetail />
      <WorkflowPreview />
      <CreateWorkflowDialog />
      <EditWorkflowDialog />
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
// WorkflowProvider is lifted to App.jsx (Module 8.5) so that
// WorkflowApplicationBridge inside CameraScreen can share the same store.
export default function WorkflowScreen() {
  return <WorkflowScreenInner />;
}

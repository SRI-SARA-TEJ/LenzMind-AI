/**
 * editing/components/SuggestionPanel.jsx
 *
 * AI Editing Suggestions screen — Phase 3.
 *
 * Layout:
 *   ┌─ Top summary bar ─────────────────────────────────┐
 *   │  Total · Critical · Fixes · Quality % · Time est  │
 *   ├─ Filter pills (category) + status tabs ───────────┤
 *   ├─ Suggestion cards (scrollable) ───────────────────┤
 *   │   icon · title · severity · confidence            │
 *   │   description · reason · before/after preview     │
 *   │   processing time · clip range                    │
 *   │   [Learn More] [Preview] [Dismiss] [Apply]        │
 *   ├─ Bottom action bar ────────────────────────────────┤
 *   │  [Dismiss All]          [Apply All] [Continue →]  │
 *   └────────────────────────────────────────────────────┘
 *
 * All buttons dispatch EditingContext reducer actions.
 * No backend. Mock data only.
 */

import React, { useState, useCallback } from 'react';
import styles from './SuggestionPanel.module.css';
import { useEditing } from '../hooks/useEditing';
import {
  SEVERITY_COLORS,
  CONFIDENCE_COLORS,
  CATEGORY_ICONS,
  EDIT_CATEGORIES,
} from '../models/editingModel';

// ── Processing time estimates per type ───────────────────────────────────────
const PROC_TIME = {
  'Lighting Fix':         '~2s',
  'Noise Reduction':      '~4s',
  'Stabilization':        '~6s',
  'Audio Cleanup':        '~3s',
  'Caption Generation':   '~8s',
  'Thumbnail Suggestion': '~1s',
  'Color Grading':        '~3s',
  'Object Blur':          '~5s',
  'Face Blur':            '~5s',
  'White Balance':        '~2s',
  'Exposure':             '~2s',
  'Motion Stabilization': '~6s',
  'Voice Enhancement':    '~4s',
  'Trim Beginning':       '~1s',
  'Trim Ending':          '~1s',
};

// ── Quality improvement estimates per severity ────────────────────────────────
const QUALITY_BOOST = {
  Critical:    '+18%',
  Significant: '+12%',
  Moderate:    '+7%',
  Minor:       '+3%',
};

// ── Status tab definitions ────────────────────────────────────────────────────
const STATUS_TABS = [
  { id: 'all',       label: 'All' },
  { id: 'pending',   label: 'Pending' },
  { id: 'applied',   label: 'Applied' },
  { id: 'dismissed', label: 'Dismissed' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Top Summary Bar
// ─────────────────────────────────────────────────────────────────────────────
function SummaryBar({ suggestions }) {
  const total     = suggestions.length;
  const critical  = suggestions.filter(s => s.severity === 'Critical').length;
  const pending   = suggestions.filter(s => s.status === 'pending').length;
  const applied   = suggestions.filter(s => s.status === 'applied').length;

  // Rough quality improvement estimate
  const qualityEst = suggestions.reduce((acc, s) => {
    if (s.status === 'applied') return acc;
    const map = { Critical: 18, Significant: 12, Moderate: 7, Minor: 3 };
    return acc + (map[s.severity] ?? 0);
  }, 0);

  // Total processing time estimate (seconds)
  const procSecs = suggestions
    .filter(s => s.status !== 'applied')
    .reduce((acc, s) => {
      const raw = PROC_TIME[s.type] ?? '~2s';
      return acc + parseInt(raw.replace(/\D/g, ''), 10);
    }, 0);
  const procLabel = procSecs < 60 ? `~${procSecs}s` : `~${Math.ceil(procSecs / 60)}m`;

  return (
    <div className={styles.summaryBar}>
      <div className={styles.summaryItem}>
        <span className={styles.summaryVal}>{total}</span>
        <span className={styles.summaryLbl}>Found</span>
      </div>
      <div className={styles.summarySep} />
      <div className={styles.summaryItem}>
        <span className={styles.summaryVal} style={{ color: critical > 0 ? '#ef4444' : '#4ade80' }}>
          {critical}
        </span>
        <span className={styles.summaryLbl}>Critical</span>
      </div>
      <div className={styles.summarySep} />
      <div className={styles.summaryItem}>
        <span className={styles.summaryVal} style={{ color: '#fcd34d' }}>{pending}</span>
        <span className={styles.summaryLbl}>Pending</span>
      </div>
      <div className={styles.summarySep} />
      <div className={styles.summaryItem}>
        <span className={styles.summaryVal} style={{ color: '#4ade80' }}>+{Math.min(qualityEst, 99)}%</span>
        <span className={styles.summaryLbl}>Quality</span>
      </div>
      <div className={styles.summarySep} />
      <div className={styles.summaryItem}>
        <span className={styles.summaryVal}>{procLabel}</span>
        <span className={styles.summaryLbl}>Est. Time</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Before / After Preview
// ─────────────────────────────────────────────────────────────────────────────
function BeforeAfterPreview({ before, after, category }) {
  const catColors = {
    Visual:  ['rgba(99,102,241,0.15)', 'rgba(34,197,94,0.12)'],
    Audio:   ['rgba(245,158,11,0.15)', 'rgba(34,197,94,0.12)'],
    Motion:  ['rgba(59,130,246,0.15)', 'rgba(34,197,94,0.12)'],
    Text:    ['rgba(168,85,247,0.15)', 'rgba(34,197,94,0.12)'],
    Colour:  ['rgba(239,68,68,0.12)',  'rgba(34,197,94,0.12)'],
    Export:  ['rgba(99,102,241,0.1)',  'rgba(34,197,94,0.12)'],
  };
  const [bCol, aCol] = catColors[category] ?? catColors.Visual;

  return (
    <div className={styles.preview}>
      <div className={styles.previewPane} style={{ background: bCol }}>
        <span className={styles.previewBadge} style={{ color: '#f87171' }}>Before</span>
        <p className={styles.previewText}>{before || 'Original footage'}</p>
      </div>
      <div className={styles.previewDivider}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.3)" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      <div className={styles.previewPane} style={{ background: aCol }}>
        <span className={styles.previewBadge} style={{ color: '#4ade80' }}>After</span>
        <p className={styles.previewText}>{after || 'AI improved footage'}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual Suggestion Card
// ─────────────────────────────────────────────────────────────────────────────
function SuggestionCard({ suggestion, onApply, onDismiss, onUndo }) {
  const [expanded,   setExpanded]   = useState(false);
  const [showLearn,  setShowLearn]  = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sev    = SEVERITY_COLORS[suggestion.severity]   ?? SEVERITY_COLORS.Moderate;
  const conf   = CONFIDENCE_COLORS[suggestion.confidence] ?? CONFIDENCE_COLORS.High;
  const catIcon = CATEGORY_ICONS[suggestion.category]   ?? '✦';
  const proc   = PROC_TIME[suggestion.type] ?? '~2s';
  const boost  = QUALITY_BOOST[suggestion.severity] ?? '+5%';

  const isApplied   = suggestion.status === 'applied';
  const isDismissed = suggestion.status === 'dismissed';
  const isPending   = suggestion.status === 'pending';

  return (
    <div
      className={`
        ${styles.card}
        ${isApplied   ? styles.cardApplied   : ''}
        ${isDismissed ? styles.cardDismissed : ''}
      `}
    >
      {/* ── Card header ──────────────────────────────────────────────── */}
      <div
        className={styles.cardHeader}
        onClick={() => setExpanded(e => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        {/* Left: icon + meta */}
        <div className={styles.cardHeaderLeft}>
          <div className={styles.cardIconWrap} style={{ background: sev.bg, borderColor: sev.border }}>
            <span className={styles.cardIcon}>{suggestion.icon}</span>
          </div>
          <div className={styles.cardMeta}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitle}>{suggestion.title}</span>
              {suggestion.severity === 'Critical' && (
                <span className={styles.criticalDot} title="Critical issue" />
              )}
            </div>
            <div className={styles.cardBadgeRow}>
              <span className={styles.categoryChip}>
                {catIcon} {suggestion.category}
              </span>
              <span
                className={styles.severityChip}
                style={{ background: sev.bg, color: sev.text, borderColor: sev.border }}
              >
                {suggestion.severity}
              </span>
              {isApplied   && <span className={styles.appliedChip}>✓ Applied</span>}
              {isDismissed && <span className={styles.dismissedChip}>✕ Dismissed</span>}
            </div>
          </div>
        </div>

        {/* Right: confidence + chevron */}
        <div className={styles.cardHeaderRight}>
          <div className={styles.confWrap}>
            <span className={styles.confPct} style={{ color: conf.text }}>
              {suggestion.confidenceScore}%
            </span>
            <span className={styles.confLbl}>AI Confidence</span>
          </div>
          <svg
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ── Confidence bar ─────────────────────────────────────────────── */}
      <div className={styles.confBarTrack}>
        <div
          className={styles.confBarFill}
          style={{ width: `${suggestion.confidenceScore}%`, background: conf.bar }}
        />
      </div>

      {/* ── Short description (always visible) ──────────────────────── */}
      <p className={styles.cardDesc}>{suggestion.description}</p>

      {/* ── Expanded detail ──────────────────────────────────────────── */}
      {expanded && (
        <div className={styles.cardDetail}>

          {/* Why AI recommended this */}
          <div className={styles.whyBox}>
            <span className={styles.whyLabel}>✦ Why AI recommends this</span>
            <p className={styles.whyText}>{suggestion.reason}</p>
          </div>

          {/* Quick stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⚡</span>
              <span className={styles.statVal}>{boost}</span>
              <span className={styles.statLbl}>Quality</span>
            </div>
            <div className={styles.statSep} />
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⏱</span>
              <span className={styles.statVal}>{proc}</span>
              <span className={styles.statLbl}>Processing</span>
            </div>
            {(suggestion.clipStart != null || suggestion.clipEnd != null) && (
              <>
                <div className={styles.statSep} />
                <div className={styles.statItem}>
                  <span className={styles.statIcon}>🎬</span>
                  <span className={styles.statVal}>
                    {suggestion.clipStart != null ? `${suggestion.clipStart}s` : '—'}
                    {suggestion.clipEnd   != null ? `–${suggestion.clipEnd}s` : ''}
                  </span>
                  <span className={styles.statLbl}>Clip Range</span>
                </div>
              </>
            )}
            <div className={styles.statSep} />
            <div className={styles.statItem}>
              <span className={styles.statIcon}>{catIcon}</span>
              <span className={styles.statVal} style={{ fontSize: 10 }}>{suggestion.type}</span>
              <span className={styles.statLbl}>Type</span>
            </div>
          </div>

          {/* Before / After toggle */}
          <button
            className={styles.previewToggleBtn}
            onClick={() => setShowPreview(v => !v)}
          >
            <span>{showPreview ? '▲ Hide Preview' : '▼ Before / After Preview'}</span>
          </button>
          {showPreview && (
            <BeforeAfterPreview
              before={suggestion.beforePreview}
              after={suggestion.afterPreview}
              category={suggestion.category}
            />
          )}

          {/* Learn More toggle */}
          <button
            className={styles.learnMoreBtn}
            onClick={() => setShowLearn(v => !v)}
          >
            {showLearn ? '▲ Hide Technical Detail' : '🔬 Learn More'}
          </button>
          {showLearn && (
            <div className={styles.learnBox}>
              <p className={styles.learnText}>
                <strong>Type:</strong> {suggestion.type}<br />
                <strong>Category:</strong> {suggestion.category}<br />
                <strong>Confidence level:</strong> {suggestion.confidence} ({suggestion.confidenceScore}%)<br />
                <strong>Auto-applicable:</strong> {suggestion.autoApplicable ? 'Yes — no user input required' : 'No — requires review'}<br />
                <strong>Est. quality improvement:</strong> {boost}<br />
                <strong>Processing time:</strong> {proc}<br />
                {suggestion.clipStart != null &&
                  <><strong>Clip range:</strong> {suggestion.clipStart}s – {suggestion.clipEnd ?? 'end'}<br /></>
                }
                <em className={styles.aiFutureNote}>
                  [AI_FUTURE] In production, IBM watsonx.ai will generate detailed analysis parameters
                  and show a live preview comparison.
                </em>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Action row ───────────────────────────────────────────────── */}
      <div className={styles.cardActions}>
        {isPending && (
          <>
            <button
              className={styles.btnDismiss}
              onClick={() => onDismiss(suggestion.id)}
            >
              Dismiss
            </button>
            <button
              className={styles.btnApply}
              onClick={() => onApply(suggestion.id)}
            >
              {suggestion.autoApplicable ? 'Apply' : 'Review & Apply'}
            </button>
          </>
        )}
        {(isApplied || isDismissed) && (
          <button
            className={styles.btnUndo}
            onClick={() => onUndo(suggestion.id)}
          >
            ↩ Undo
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ statusTab }) {
  const msgs = {
    all:       { icon: '✦', title: 'No suggestions found', sub: 'Run a new analysis to detect improvements.' },
    pending:   { icon: '✓', title: 'All suggestions reviewed!', sub: 'You\'ve applied or dismissed every suggestion.' },
    applied:   { icon: '📋', title: 'No applied edits yet', sub: 'Apply suggestions to see them here.' },
    dismissed: { icon: '🗑', title: 'No dismissed suggestions', sub: 'Dismissed suggestions appear here.' },
  };
  const m = msgs[statusTab] ?? msgs.all;
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>{m.icon}</span>
      <p className={styles.emptyTitle}>{m.title}</p>
      <p className={styles.emptySub}>{m.sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SuggestionPanel
// ─────────────────────────────────────────────────────────────────────────────
export default function SuggestionPanel() {
  const {
    state,
    filteredSuggestions,
    suggestionStats,
    applyEdit,
    applyAll,
    dismissEdit,
    dismissAll,
    undoEdit,
    setCategoryFilter,
    setSuggestionSearch,
    setSessionState,
  } = useEditing();

  const [statusTab, setStatusTab] = useState('all');

  const session     = state.activeSession;
  const allSuggestions = session?.analysis?.suggestions ?? [];

  // Status-tab filter on top of context category filter
  const visibleSuggestions = filteredSuggestions.filter(s => {
    if (statusTab === 'all')       return true;
    if (statusTab === 'pending')   return s.status === 'pending';
    if (statusTab === 'applied')   return s.status === 'applied';
    if (statusTab === 'dismissed') return s.status === 'dismissed';
    return true;
  });

  // Tab counts
  const tabCounts = {
    all:       filteredSuggestions.length,
    pending:   filteredSuggestions.filter(s => s.status === 'pending').length,
    applied:   filteredSuggestions.filter(s => s.status === 'applied').length,
    dismissed: filteredSuggestions.filter(s => s.status === 'dismissed').length,
  };

  const handleApplyAll   = useCallback(() => { applyAll(); setStatusTab('applied'); }, [applyAll]);
  const handleDismissAll = useCallback(() => { dismissAll(); setStatusTab('dismissed'); }, [dismissAll]);
  const handleContinue   = useCallback(() => { setSessionState('complete'); }, [setSessionState]);

  const projectTitle = session?.projectTitle ?? 'Project';
  const editProgress = session?.editProgress ?? 0;

  return (
    <div className={styles.panel}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            <span>IBM watsonx.ai</span>
          </div>
          <h2 className={styles.headerTitle}>AI Suggestions</h2>
          <p className={styles.headerSub}>{projectTitle}</p>
        </div>
        <div className={styles.progressRing}>
          <svg viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
            <circle cx="20" cy="20" r="16"
              stroke="#6366f1" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - editProgress / 100)}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '20px 20px', transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <span className={styles.progressPct}>{editProgress}%</span>
        </div>
      </div>

      {/* ── Summary bar ──────────────────────────────────────────────── */}
      <SummaryBar suggestions={allSuggestions} />

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Search suggestions…"
          value={state.suggestionSearch}
          onChange={e => setSuggestionSearch(e.target.value)}
        />
        {state.suggestionSearch && (
          <button className={styles.searchClear} onClick={() => setSuggestionSearch('')}>✕</button>
        )}
      </div>

      {/* ── Category pills ───────────────────────────────────────────── */}
      <div className={styles.pillRow}>
        <button
          className={`${styles.pill} ${state.categoryFilter === 'all' ? styles.pillActive : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          All
        </button>
        {EDIT_CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`${styles.pill} ${state.categoryFilter === cat ? styles.pillActive : ''}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* ── Status tabs ──────────────────────────────────────────────── */}
      <div className={styles.tabRow}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${statusTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setStatusTab(tab.id)}
          >
            {tab.label}
            <span className={`${styles.tabCount} ${statusTab === tab.id ? styles.tabCountActive : ''}`}>
              {tabCounts[tab.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Suggestion list ──────────────────────────────────────────── */}
      <div className={styles.list}>
        {visibleSuggestions.length === 0 ? (
          <EmptyState statusTab={statusTab} />
        ) : (
          visibleSuggestions.map(s => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onApply={applyEdit}
              onDismiss={dismissEdit}
              onUndo={undoEdit}
            />
          ))
        )}
        <div style={{ height: 120 }} />
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────── */}
      <div className={styles.actionBar}>
        <button
          className={styles.btnDismissAll}
          onClick={handleDismissAll}
          disabled={suggestionStats.pending === 0}
        >
          Dismiss All
        </button>
        <button
          className={styles.btnApplyAll}
          onClick={handleApplyAll}
          disabled={suggestionStats.autoApplicable === 0}
        >
          Apply All ({suggestionStats.autoApplicable})
        </button>
        <button
          className={styles.btnContinue}
          onClick={handleContinue}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

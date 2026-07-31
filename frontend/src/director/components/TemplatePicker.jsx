/**
 * director/components/TemplatePicker.jsx
 *
 * AI Guided Mode — Step 1: Browse and select a cinematic template.
 * Shows template cards with category filter and search.
 *
 * Feature 5 — Workflow Preview Enhancement:
 * Tapping the "Preview" button on a card slides up a mini workflow
 * panel showing the step-by-step shot sequence before committing.
 */

import React, { useState } from 'react';
import styles from './TemplatePicker.module.css';
import { useDirector } from '../hooks/useDirector';
import { TEMPLATE_CATEGORIES } from '../data/mockDirectorData';

function DifficultyBadge({ level }) {
  const colors = {
    Beginner:     { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80',  border: 'rgba(34,197,94,0.3)' },
    Intermediate: { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d',  border: 'rgba(245,158,11,0.3)' },
    Advanced:     { bg: 'rgba(239,68,68,0.15)',   text: '#f87171',  border: 'rgba(239,68,68,0.3)' },
  };
  const c = colors[level] || colors.Beginner;
  return (
    <span className={styles.badge} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {level}
    </span>
  );
}

// ── Feature 5: Workflow preview sheet ─────────────────────────────────────────
function WorkflowPreview({ template, onClose, onSelect }) {
  const totalSecs = template.steps.reduce((s, st) => s + st.durationSeconds, 0);
  const estMin    = Math.max(1, Math.ceil(totalSecs / 60));

  return (
    <div className={styles.previewOverlay} onClick={onClose}>
      <div className={styles.previewSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.previewHandle} />

        {/* Header */}
        <div className={styles.previewHeader}>
          <div className={styles.previewHeaderLeft}>
            <div className={styles.previewIcon} style={{ background: template.coverColor }}>
              <span className={styles.previewIconEmoji}>{template.icon}</span>
            </div>
            <div>
              <h3 className={styles.previewTitle}>{template.name}</h3>
              <p className={styles.previewSub}>{template.steps.length} shots · ~{estMin} min</p>
            </div>
          </div>
          <button className={styles.previewClose} onClick={onClose} aria-label="Close preview">✕</button>
        </div>

        {/* AI Insight */}
        <div className={styles.previewAI}>
          <span className={styles.previewAIBadge}>✦ AI Insight</span>
          <p className={styles.previewAIText}>{template.aiInsight}</p>
        </div>

        {/* Shot sequence */}
        <p className={styles.previewSectionLabel}>Shot Sequence</p>
        <div className={styles.previewSteps}>
          {template.steps.map((step, i) => (
            <div key={step.id} className={styles.previewStep}>
              <div className={styles.previewStepLeft}>
                <div className={styles.previewStepNum}>{i + 1}</div>
                {i < template.steps.length - 1 && <div className={styles.previewStepLine} />}
              </div>
              <div className={styles.previewStepBody}>
                <div className={styles.previewStepTop}>
                  <span className={styles.previewStepName}>{step.title}</span>
                  <span className={styles.previewStepDur}>{step.durationSeconds}s</span>
                </div>
                <div className={styles.previewStepMeta}>
                  <span className={styles.previewStepTech}>{step.technique}</span>
                  <span className={styles.previewStepMove}>{step.movement}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.previewFooter}>
          <button className={styles.previewBtnCancel} onClick={onClose}>Cancel</button>
          <button className={styles.previewBtnStart} onClick={() => { onClose(); onSelect(template); }}>
            Start This Template →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Template card ──────────────────────────────────────────────────────────────
function TemplateCard({ template, onSelect, onPreview }) {
  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(template)}
      aria-label={`Select ${template.name} template`}
    >
      {/* Cover gradient */}
      <div
        className={styles.cardCover}
        style={{ background: template.coverColor }}
        onClick={() => onSelect(template)}
      >
        <span className={styles.cardIcon}>{template.icon}</span>
        <span className={styles.stepCount}>{template.steps.length} shots</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardName}>{template.name}</span>
          <DifficultyBadge level={template.targetAudience.split(' ')[0]} />
        </div>
        <p className={styles.cardDesc}>{template.description}</p>

        <div className={styles.cardMeta}>
          <span className={styles.duration}>⏱ {template.estimatedDuration}</span>
          <span className={styles.category}>{template.category}</span>
        </div>

        {/* AI Insight teaser */}
        <div className={styles.aiInsight}>
          <span className={styles.aiBadge}>✦ AI</span>
          <p className={styles.aiText}>{template.aiInsight}</p>
        </div>

        {/* Action row — Feature 5 */}
        <div className={styles.cardActions}>
          <button
            className={styles.btnPreview}
            onClick={e => { e.stopPropagation(); onPreview(template); }}
          >
            Preview Workflow
          </button>
          <button
            className={styles.btnSelect}
            onClick={e => { e.stopPropagation(); onSelect(template); }}
          >
            Start →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatePicker() {
  const {
    filteredTemplates,
    state,
    selectTemplate,
    goHome,
    setTemplateCategory,
    setTemplateSearch,
  } = useDirector();

  const [previewTemplate, setPreviewTemplate] = useState(null);

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={goHome} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.topMid}>
          <h1 className={styles.topTitle}>Choose Template</h1>
          <p className={styles.topSub}>AI Guided Mode</p>
        </div>
        <div className={styles.topBadge}>
          <span className={styles.aiBadgeDot} />
          AI
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Search templates…"
          value={state.templateSearch}
          onChange={e => setTemplateSearch(e.target.value)}
        />
        {state.templateSearch && (
          <button className={styles.searchClear} onClick={() => setTemplateSearch('')}>✕</button>
        )}
      </div>

      {/* Category pills */}
      <div className={styles.pillRow}>
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`${styles.pill} ${state.templateCategory === cat.id ? styles.pillActive : ''}`}
            onClick={() => setTemplateCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className={styles.scrollArea}>
        {filteredTemplates.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🔍</p>
            <p className={styles.emptyText}>No templates match your search.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredTemplates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onSelect={selectTemplate}
                onPreview={setPreviewTemplate}
              />
            ))}
          </div>
        )}
        <div style={{ height: 80 }} />
      </div>

      {/* Feature 5 — Workflow Preview Sheet */}
      {previewTemplate && (
        <WorkflowPreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={selectTemplate}
        />
      )}
    </div>
  );
}

/**
 * project/components/ProjectDetail.jsx
 *
 * Full-screen detail view for a selected project.
 * Slides in from the right.
 *
 * Tab sections: Overview | Media | Workflow | Timeline | AI Summary | Activity | Settings
 */

import React, { useState } from 'react';
import styles from './ProjectDetail.module.css';
import { useProject } from '../hooks/useProject';
import { STATUS_COLORS } from '../models/projectModel';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

const ACTIVITY_ICONS = {
  capture: '📷',
  edit:    '✂️',
  note:    '📝',
  export:  '📤',
  review:  '👁',
  created: '✨',
};

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'media',     label: 'Media' },
  { id: 'workflow',  label: 'Workflow' },
  { id: 'timeline',  label: 'Timeline' },
  { id: 'ai',        label: 'AI Summary' },
  { id: 'activity',  label: 'Activity' },
  { id: 'settings',  label: 'Settings' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

function SectionBlock({ title, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{title}</p>
      {children}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function TabOverview({ project }) {
  const statusStyle = STATUS_COLORS[project.status] || {};
  return (
    <div className={styles.tabContent}>
      <SectionBlock title="Description">
        <p className={styles.description}>{project.description}</p>
      </SectionBlock>

      <SectionBlock title="Details">
        <Row label="Category"       value={project.category} />
        <Row label="Status"
          value={
            <span className={styles.statusInline}
              style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
              {project.status}
            </span>
          }
        />
        <Row label="Progress"       value={`${project.progress}%`} />
        <Row label="Created"        value={formatDate(project.createdAt)} />
        <Row label="Last Modified"  value={formatDate(project.updatedAt)} />
      </SectionBlock>

      {project.tags.length > 0 && (
        <SectionBlock title="Tags">
          <div className={styles.tags}>
            {project.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
          </div>
        </SectionBlock>
      )}

      {/* Progress bar */}
      <SectionBlock title="Progress">
        <div className={styles.bigProgressWrap}>
          <div className={styles.bigProgressTrack}>
            <div className={styles.bigProgressBar} style={{ width: `${project.progress}%` }} />
          </div>
          <span className={styles.bigProgressLabel}>{project.progress}%</span>
        </div>
      </SectionBlock>
    </div>
  );
}

// ── Media tab ─────────────────────────────────────────────────────────────────
function TabMedia({ project }) {
  const { photos, videos, audio, notes } = project.mediaStats;
  const total = photos + videos + audio + notes;
  return (
    <div className={styles.tabContent}>
      <SectionBlock title="Media Statistics">
        <div className={styles.mediaGrid}>
          <div className={styles.mediaCard}>
            <span className={styles.mediaIcon}>🖼️</span>
            <span className={styles.mediaCount}>{photos}</span>
            <span className={styles.mediaLabel}>Photos</span>
          </div>
          <div className={styles.mediaCard}>
            <span className={styles.mediaIcon}>🎬</span>
            <span className={styles.mediaCount}>{videos}</span>
            <span className={styles.mediaLabel}>Videos</span>
          </div>
          <div className={styles.mediaCard}>
            <span className={styles.mediaIcon}>🎵</span>
            <span className={styles.mediaCount}>{audio}</span>
            <span className={styles.mediaLabel}>Audio</span>
          </div>
          <div className={styles.mediaCard}>
            <span className={styles.mediaIcon}>📝</span>
            <span className={styles.mediaCount}>{notes}</span>
            <span className={styles.mediaLabel}>Notes</span>
          </div>
        </div>
        <Row label="Total Assets" value={total.toLocaleString()} />
      </SectionBlock>

      {/* Simple visual breakdown */}
      <SectionBlock title="Breakdown">
        {total > 0 && (
          <div className={styles.breakdown}>
            {photos > 0 && (
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>Photos</span>
                <div className={styles.breakdownTrack}>
                  <div className={styles.breakdownBar} style={{ width: `${(photos/total)*100}%`, background: '#6366f1' }} />
                </div>
                <span className={styles.breakdownPct}>{Math.round((photos/total)*100)}%</span>
              </div>
            )}
            {videos > 0 && (
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>Videos</span>
                <div className={styles.breakdownTrack}>
                  <div className={styles.breakdownBar} style={{ width: `${(videos/total)*100}%`, background: '#3b82f6' }} />
                </div>
                <span className={styles.breakdownPct}>{Math.round((videos/total)*100)}%</span>
              </div>
            )}
            {audio > 0 && (
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>Audio</span>
                <div className={styles.breakdownTrack}>
                  <div className={styles.breakdownBar} style={{ width: `${(audio/total)*100}%`, background: '#8b5cf6' }} />
                </div>
                <span className={styles.breakdownPct}>{Math.round((audio/total)*100)}%</span>
              </div>
            )}
            {notes > 0 && (
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>Notes</span>
                <div className={styles.breakdownTrack}>
                  <div className={styles.breakdownBar} style={{ width: `${(notes/total)*100}%`, background: '#f59e0b' }} />
                </div>
                <span className={styles.breakdownPct}>{Math.round((notes/total)*100)}%</span>
              </div>
            )}
          </div>
        )}
      </SectionBlock>
    </div>
  );
}

// ── Workflow tab ──────────────────────────────────────────────────────────────
function TabWorkflow({ project }) {
  return (
    <div className={styles.tabContent}>
      <SectionBlock title="Assigned Workflow">
        {project.workflowId ? (
          <div className={styles.workflowCard}>
            <span className={styles.workflowIcon}>⚡</span>
            <div className={styles.workflowInfo}>
              <span className={styles.workflowName}>{project.workflowName}</span>
              <span className={styles.workflowId}>ID: {project.workflowId}</span>
            </div>
            <span className={styles.workflowBadge}>Active</span>
          </div>
        ) : (
          <div className={styles.noWorkflow}>
            <p className={styles.noWorkflowText}>No workflow assigned to this project.</p>
            <p className={styles.noWorkflowSub}>Assign a workflow from the Workflow Library to enable AI-powered capture settings.</p>
          </div>
        )}
      </SectionBlock>
    </div>
  );
}

// ── Timeline tab ──────────────────────────────────────────────────────────────
function TabTimeline({ project }) {
  return (
    <div className={styles.tabContent}>
      <SectionBlock title="Project Timeline">
        <div className={styles.timeline}>
          {project.timeline.map((entry, i) => (
            <div key={entry.id} className={styles.timelineEntry}>
              <div className={styles.timelineDotWrap}>
                <div className={`${styles.timelineDot} ${entry.complete ? styles.dotComplete : styles.dotPending}`} />
                {i < project.timeline.length - 1 && (
                  <div className={`${styles.timelineLine} ${entry.complete ? styles.lineComplete : ''}`} />
                )}
              </div>
              <div className={styles.timelineContent}>
                <span className={`${styles.timelineLabel} ${entry.complete ? styles.labelComplete : ''}`}>
                  {entry.label}
                </span>
                <span className={styles.timelineDate}>{formatDate(entry.date)}</span>
                {entry.complete && <span className={styles.timelineCheck}>✓ Complete</span>}
              </div>
            </div>
          ))}
          {project.timeline.length === 0 && (
            <p className={styles.emptyText}>No timeline entries yet.</p>
          )}
        </div>
      </SectionBlock>
    </div>
  );
}

// ── AI Summary tab ────────────────────────────────────────────────────────────
function TabAI({ project }) {
  return (
    <div className={styles.tabContent}>
      <SectionBlock title="AI Analysis">
        <div className={styles.aiCard}>
          <div className={styles.aiHeader}>
            <span className={styles.aiBadge}>✦ AI Summary</span>
          </div>
          <p className={styles.aiText}>{project.aiSummary || 'No AI analysis available for this project yet.'}</p>
        </div>
      </SectionBlock>

      <SectionBlock title="AI Insights">
        <Row label="Status Detected"   value={project.status} />
        <Row label="Progress Estimate" value={`${project.progress}%`} />
        <Row label="Media Analysed"    value={`${project.mediaStats.photos + project.mediaStats.videos} assets`} />
      </SectionBlock>
    </div>
  );
}

// ── Activity tab ──────────────────────────────────────────────────────────────
function TabActivity({ project }) {
  return (
    <div className={styles.tabContent}>
      <SectionBlock title="Recent Activity">
        <div className={styles.activityList}>
          {project.recentActivity.map(item => (
            <div key={item.id} className={styles.activityItem}>
              <span className={styles.activityIcon}>{ACTIVITY_ICONS[item.type] || '•'}</span>
              <div className={styles.activityBody}>
                <span className={styles.activityLabel}>{item.label}</span>
                <span className={styles.activityTime}>{formatRelative(item.time)}</span>
              </div>
            </div>
          ))}
          {project.recentActivity.length === 0 && (
            <p className={styles.emptyText}>No activity recorded yet.</p>
          )}
        </div>
      </SectionBlock>
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────
function TabSettings({ project, onEdit, onDuplicate, onArchive, onDeleteConfirm }) {
  return (
    <div className={styles.tabContent}>
      <SectionBlock title="Project Actions">
        <div className={styles.actionList}>
          <button className={styles.actionRow} onClick={onEdit}>
            <span className={styles.actionRowIcon}>✏️</span>
            <span className={styles.actionRowLabel}>Edit Project</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button className={styles.actionRow} onClick={onDuplicate}>
            <span className={styles.actionRowIcon}>📋</span>
            <span className={styles.actionRowLabel}>Duplicate Project</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          {project.status !== 'Archived' && (
            <button className={styles.actionRow} onClick={onArchive}>
              <span className={styles.actionRowIcon}>📦</span>
              <span className={styles.actionRowLabel}>Archive Project</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </SectionBlock>

      <SectionBlock title="Danger Zone">
        <button className={styles.deleteBtn} onClick={onDeleteConfirm}>
          Delete Project
        </button>
        <p className={styles.deleteSub}>This action cannot be undone.</p>
      </SectionBlock>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const {
    state,
    clearSelected,
    openEdit,
    duplicateProject,
    archiveProject,
    openDeleteConfirm,
    toggleFavorite,
  } = useProject();

  const { selectedProject: p } = state;
  const [activeTab, setActiveTab] = useState('overview');

  if (!p) return null;

  const statusStyle = STATUS_COLORS[p.status] || {};

  const handleDuplicate = () => {
    duplicateProject(p.id);
    clearSelected();
  };

  const handleArchive = () => {
    archiveProject(p.id);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.screen}>

        {/* ── Hero cover ────────────────────────────────────────────────── */}
        <div className={styles.hero} style={{ background: p.coverColor }}>
          <div className={styles.heroTop}>
            <button className={styles.backBtn} onClick={clearSelected} aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className={`${styles.heroFav} ${p.isFavorite ? styles.heroFavActive : ''}`}
              onClick={() => toggleFavorite(p.id)}
              aria-label="Toggle favorite"
            >
              {p.isFavorite ? '★' : '☆'}
            </button>
          </div>
          <div className={styles.heroBody}>
            <span className={styles.heroEmoji}>{p.coverEmoji}</span>
            <div className={styles.heroInfo}>
              <h1 className={styles.heroTitle}>{p.title}</h1>
              <div className={styles.heroBadges}>
                <span className={styles.heroCat}>{p.category}</span>
                <span
                  className={styles.heroStatus}
                  style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
                >
                  {p.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────────── */}
        <div className={styles.tabBar}>
          <div className={styles.tabScroll}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        <div className={styles.body}>
          {activeTab === 'overview'  && <TabOverview  project={p} />}
          {activeTab === 'media'     && <TabMedia     project={p} />}
          {activeTab === 'workflow'  && <TabWorkflow  project={p} />}
          {activeTab === 'timeline'  && <TabTimeline  project={p} />}
          {activeTab === 'ai'        && <TabAI        project={p} />}
          {activeTab === 'activity'  && <TabActivity  project={p} />}
          {activeTab === 'settings'  && (
            <TabSettings
              project={p}
              onEdit={() => openEdit(p)}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onDeleteConfirm={() => openDeleteConfirm(p.id)}
            />
          )}
          <div style={{ height: 80 }} />
        </div>

        {/* ── Action bar ───────────────────────────────────────────────── */}
        <div className={styles.actionBar}>
          <button className={styles.actionGhost} onClick={() => openEdit(p)}>Edit</button>
          <button className={styles.actionGhost} onClick={handleDuplicate}>Duplicate</button>
          <button className={styles.actionPrimary} onClick={() => { openDeleteConfirm(p.id); }}>
            {p.status === 'Archived' ? 'Delete' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}

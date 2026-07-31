/**
 * pages/DashboardPage.jsx — Creator Dashboard
 *
 * The main overview page showing:
 *  - Key statistics (projects, uploads, AI suggestions)
 *  - Recent projects grid
 *  - Quick action to create a new project
 *  - AI agent status panel (ready for future activation)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatCard      from '../components/ui/StatCard';
import ProjectCard   from '../components/ui/ProjectCard';
import styles        from './DashboardPage.module.css';

export default function DashboardPage() {
  const { state, fetchProjects, createProject, notify } = useApp();
  const navigate   = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', contentType: 'mixed' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setCreating(true);
    try {
      const project = await createProject(formData);
      setShowForm(false);
      setFormData({ title: '', description: '', contentType: 'mixed' });
      navigate(`/workspace/${project._id}`);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setCreating(false);
    }
  }

  const { projects, loading } = state;
  const totalAssets = projects.reduce((sum, p) => sum + (p.assets?.length || 0), 0);

  return (
    <div className={styles.page}>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total Projects"
          value={projects.length}
          accentColor="var(--color-accent)"
        />
        <StatCard
          label="Uploaded Assets"
          value={totalAssets}
          accentColor="var(--agent-camera)"
        />
        <StatCard
          label="AI Suggestions"
          value="—"
          accentColor="var(--agent-editing)"
        />
        <StatCard
          label="Completed Projects"
          value={projects.filter(p => p.status === 'completed').length}
          accentColor="var(--color-success)"
        />
      </div>

      {/* ── Projects Section ───────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Your Projects</h2>
            <p className={styles.sectionSubtitle}>Click any project to open the workspace</p>
          </div>
          <button className={styles.newBtn} onClick={() => setShowForm(true)}>
            + New Project
          </button>
        </div>

        {/* Create project form (inline) */}
        {showForm && (
          <form onSubmit={handleCreate} className={styles.createForm}>
            <h3 className={styles.formTitle}>Create New Project</h3>
            <div className={styles.formRow}>
              <input
                type="text"
                placeholder="Project title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={styles.input}
                required
                autoFocus
              />
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                className={styles.select}
              >
                <option value="mixed">Mixed</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
              </select>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={styles.textarea}
              rows={2}
            />
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn} disabled={creating}>
                {creating ? 'Creating...' : 'Create Project'}
              </button>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Project grid */}
        {loading ? (
          <div className={styles.emptyState}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p>No projects yet. Create your first project to get started.</p>
            <button className={styles.newBtn} onClick={() => setShowForm(true)}>
              + Create First Project
            </button>
          </div>
        ) : (
          <div className={styles.projectsGrid}>
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* ── AI Agent Status Panel ──────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>AI Agent Status</h2>
            <p className={styles.sectionSubtitle}>Agents will activate when IBM watsonx.ai is configured</p>
          </div>
        </div>
        <div className={styles.agentGrid}>
          {[
            { name: 'Camera Intelligence',  desc: 'Analyzes photo/video technical quality', color: 'var(--agent-camera)' },
            { name: 'Editing Intelligence', desc: 'Suggests color, exposure, and composition edits', color: 'var(--agent-editing)' },
            { name: 'Content Optimization', desc: 'Tailors content for Instagram, YouTube, TikTok', color: 'var(--agent-optimize)' },
            { name: 'Analytics Agent',      desc: 'Tracks performance and identifies patterns', color: 'var(--agent-analytics)' },
            { name: 'Creator Memory',       desc: 'Remembers your preferences for better suggestions', color: 'var(--color-accent)' },
          ].map((agent) => (
            <div key={agent.name} className={styles.agentPanel}>
              <div className={styles.agentPanelDot} style={{ background: agent.color }} />
              <div>
                <div className={styles.agentPanelName}>{agent.name}</div>
                <div className={styles.agentPanelDesc}>{agent.desc}</div>
              </div>
              <span className={styles.agentPanelStatus}>Standby</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

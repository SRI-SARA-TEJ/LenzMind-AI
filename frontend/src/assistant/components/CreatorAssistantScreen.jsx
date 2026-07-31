/**
 * assistant/components/CreatorAssistantScreen.jsx
 *
 * Module 10.1 — Realis AI Creator Assistant
 * Module 10.2 — Integrates MissionCard (Creator Mission Engine)
 *
 * Premium mobile-first AI assistant screen.  Read-only — consumes
 * CreatorAssistantContext (written by AssistantBridge) and renders the
 * daily creator briefing.  No business logic lives here.
 *
 * ── Sections ──────────────────────────────────────────────────────────────────
 *   1. Fixed header          — IBM badge, title, refresh button
 *   2. Greeting hero         — personalised greeting + time-of-day motif
 *   3. AI Recommendation     — primary recommendation card with priority ring
 *   4. Recommended Workflow  — workflow name + settings pill row
 *   5. Camera Settings       — recommended camera settings grid
 *   6. Expected Quality      — animated score bar + expected quality number
 *   7. Confidence meter      — how confident the AI is in this briefing
 *   8. Reasons               — why AI made this recommendation
 *   9. Daily Goal            — motivational creative goal for today
 *  10. Daily Mission         — MissionCard (10.2 — tasks, progress, reward)
 *  11. Create Now CTA        — full-width primary action button
 *  12. BottomNavBar          — shared navigation
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   Camera capture
 *     → CameraMemoryBridge   → CreatorMemoryContext
 *     → AnalyticsBridge      → AnalyticsContext
 *     → LearningBridge       → CreatorLearningContext
 *     → AssistantBridge      → CreatorAssistantContext  ← briefing
 *     → MissionBridge        → CreatorMissionContext    ← mission
 */

import React, { useCallback }  from 'react';
import { useNavigate }          from 'react-router-dom';
import styles                   from './CreatorAssistantScreen.module.css';

import { useCreatorAssistant }  from '../hooks/useCreatorAssistant';
import MissionCard              from '../../mission/components/MissionCard';

import BottomNavBar from '../../camera/components/BottomNavBar';

// ── Score colour helper ───────────────────────────────────────────────────────
function scoreColor(n) {
  if (!n) return 'rgba(255,255,255,0.25)';
  if (n >= 80) return '#4ade80';
  if (n >= 55) return '#fcd34d';
  return '#f87171';
}

// ── Priority colour/label ─────────────────────────────────────────────────────
const PRIORITY_META = {
  high:   { color: '#4ade80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)', label: 'High Priority' },
  medium: { color: '#fcd34d', bg: 'rgba(252,211,77,0.10)', border: 'rgba(252,211,77,0.25)', label: 'Medium Priority' },
  low:    { color: '#a5b4fc', bg: 'rgba(165,180,252,0.08)', border: 'rgba(165,180,252,0.2)', label: 'Building Profile' },
};

// ── Animated confidence arc (SVG) ─────────────────────────────────────────────
const ARC_R = 38;
const ARC_C = 2 * Math.PI * ARC_R;

function ConfidenceArc({ value = 0, color = '#6366f1' }) {
  const offset = ARC_C * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <svg viewBox="0 0 90 90" className={styles.arcSvg} aria-hidden="true">
      <circle cx="45" cy="45" r={ARC_R}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
      <circle cx="45" cy="45" r={ARC_R}
        fill="none" stroke={color}
        strokeWidth="7" strokeLinecap="round"
        strokeDasharray={ARC_C} strokeDashoffset={offset}
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
    </svg>
  );
}

// ── Camera settings pill ──────────────────────────────────────────────────────
function SettingPill({ icon, label, value }) {
  if (value == null) return null;
  const display = typeof value === 'boolean' ? (value ? 'On' : 'Off') : String(value);
  return (
    <div className={styles.settingPill}>
      <span className={styles.settingPillIcon}>{icon}</span>
      <div className={styles.settingPillText}>
        <span className={styles.settingPillVal}>{display}</span>
        <span className={styles.settingPillLbl}>{label}</span>
      </div>
    </div>
  );
}

// ── Reason item ───────────────────────────────────────────────────────────────
function ReasonItem({ text, index }) {
  return (
    <div className={styles.reasonItem} style={{ animationDelay: `${index * 0.05}s` }}>
      <span className={styles.reasonDot} />
      <span className={styles.reasonText}>{text}</span>
    </div>
  );
}

// ── Section shell ─────────────────────────────────────────────────────────────
function Section({ title, accent, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel} style={accent ? { color: accent } : undefined}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function BriefingSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.skeletonBar} ${styles.skeletonBarWide}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonBarMed}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonBarNarrow}`} />
    </div>
  );
}

// ══ Main screen ════════════════════════════════════════════════════════════════

export default function CreatorAssistantScreen() {
  const { briefing, isGenerating, refreshBriefing } = useCreatorAssistant();
  const navigate = useNavigate();

  const handleCTA = useCallback(() => {
    navigate(briefing.ctaPath ?? '/camera');
  }, [navigate, briefing.ctaPath]);

  const pmeta = PRIORITY_META[briefing.priority] ?? PRIORITY_META.low;
  const cs    = briefing.recommendedCameraSettings;

  return (
    <div className={styles.screen}>

      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            IBM watsonx.ai
          </span>
          <h1 className={styles.headerTitle}>AI Assistant</h1>
          <p className={styles.headerSub}>Your personalised daily briefing</p>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={refreshBriefing}
          disabled={isGenerating}
          aria-label="Refresh briefing"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" className={isGenerating ? styles.refreshSpin : undefined}
            width="18" height="18" aria-hidden="true">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div className={styles.scroll}>

        {isGenerating && <BriefingSkeleton />}

        {/* 1 ── Greeting hero */}
        <div className={styles.greetingHero}>
          <div className={styles.greetingGlow} aria-hidden="true" />
          <div className={styles.greetingContent}>
            <span className={styles.greetingEmoji}>✦</span>
            <p className={styles.greetingText}>{briefing.greeting}</p>
            {briefing.generatedAt && (
              <p className={styles.greetingTime}>
                {new Date(briefing.generatedAt).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>

        {/* 2 ── AI Recommendation card */}
        <div
          className={styles.recommendCard}
          style={{ background: pmeta.bg, borderColor: pmeta.border }}
        >
          <div className={styles.recommendTop}>
            <div className={styles.recommendIconWrap} style={{ background: pmeta.bg, borderColor: pmeta.border }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={pmeta.color}
                strokeWidth="1.8" strokeLinecap="round" width="20" height="20" aria-hidden="true">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.8-1.6 5.2-4 6.4V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.6C6.6 14.2 5 11.8 5 9a7 7 0 0 1 7-7z" />
                <path d="M9 21h6" /><path d="M10 17v1" /><path d="M14 17v1" />
              </svg>
            </div>
            <span className={styles.priorityBadge}
              style={{ color: pmeta.color, borderColor: pmeta.border, background: pmeta.bg }}>
              {pmeta.label}
            </span>
          </div>
          <p className={styles.recommendText}>
            {briefing.aiRecommendation}
          </p>
        </div>

        {/* 3 ── Recommended workflow */}
        {briefing.recommendedWorkflow && (
          <Section title="Recommended Workflow" accent="#6366f1">
            <div className={styles.workflowCard}>
              <div className={styles.workflowIcon}>⚙️</div>
              <div className={styles.workflowInfo}>
                <span className={styles.workflowName}>{briefing.recommendedWorkflow}</span>
                {briefing.recommendedWorkflowId && (
                  <span className={styles.workflowId}>{briefing.recommendedWorkflowId}</span>
                )}
              </div>
              <div className={styles.workflowArrow}>›</div>
            </div>
          </Section>
        )}

        {/* 4 ── Camera settings */}
        {cs && (
          <Section title="Recommended Camera Settings" accent="#06b6d4">
            <div className={styles.settingsGrid}>
              <SettingPill icon="🔲" label="Resolution" value={cs.resolution} />
              <SettingPill icon="🎞" label="FPS"        value={cs.fps != null ? `${cs.fps} fps` : null} />
              <SettingPill icon="✨" label="HDR"        value={cs.hdr} />
              <SettingPill icon="⚡" label="Flash"      value={cs.flash} />
              <SettingPill icon="🎥" label="Stabilize"  value={cs.stabilization} />
              <SettingPill icon="🎯" label="Focus"      value={cs.focusMode} />
              <SettingPill icon="🌡" label="White Bal." value={cs.whiteBalance} />
            </div>
          </Section>
        )}

        {/* 5 ── Expected quality + confidence */}
        <div className={styles.metricsRow}>
          {/* Expected quality bar */}
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Expected Quality</p>
            <div className={styles.metricScoreRow}>
              <span className={styles.metricBigVal}
                style={{ color: scoreColor(briefing.expectedQuality) }}>
                {briefing.expectedQuality}
              </span>
              <span className={styles.metricUnit}>/100</span>
            </div>
            <div className={styles.qualityTrack}>
              <div
                className={styles.qualityFill}
                style={{
                  width:      `${briefing.expectedQuality}%`,
                  background: scoreColor(briefing.expectedQuality),
                }}
              />
            </div>
          </div>

          {/* Confidence arc */}
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>AI Confidence</p>
            <div className={styles.arcWrap}>
              <ConfidenceArc value={briefing.confidence} color="#6366f1" />
              <div className={styles.arcInner}>
                <span className={styles.arcVal}
                  style={{ color: scoreColor(briefing.confidence) }}>
                  {briefing.confidence}
                </span>
                <span className={styles.arcUnit}>%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 ── Reasons */}
        {briefing.reasons?.length > 0 && (
          <Section title="Why This Recommendation" accent="#a78bfa">
            <div className={styles.reasonsList}>
              {briefing.reasons.map((r, i) => (
                <ReasonItem key={i} text={r} index={i} />
              ))}
            </div>
          </Section>
        )}

        {/* 7 ── Daily goal */}
        <div className={styles.goalCard}>
          <div className={styles.goalHeader}>
            <span className={styles.goalIcon}>🎯</span>
            <span className={styles.goalTitle}>Today's Creative Goal</span>
          </div>
          <p className={styles.goalText}>{briefing.dailyGoal}</p>
        </div>

        {/* 8 ── Daily Mission (Module 10.2) */}
        <MissionCard />

        {/* 9 ── CTA */}
        <button
          className={styles.ctaBtn}
          onClick={handleCTA}
          aria-label={briefing.ctaLabel}
        >
          <span className={styles.ctaBtnLabel}>{briefing.ctaLabel}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" width="18" height="18" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <div style={{ height: 100 }} />
      </div>

      <BottomNavBar />
    </div>
  );
}

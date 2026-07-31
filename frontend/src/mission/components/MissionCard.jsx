/**
 * mission/components/MissionCard.jsx
 *
 * Module 10.2 — Realis Creator Mission Engine
 *
 * Premium self-contained mission card designed to be embedded in the
 * AI Assistant screen.  Reads from CreatorMissionContext and renders:
 *
 *   • Mission header — title, difficulty stars, status badge
 *   • Progress bar   — animated fill showing % tasks completed
 *   • Task list      — tap-to-complete task rows with checkmarks
 *   • Stats row      — estimated improvement + reward
 *   • Reasoning      — why this mission was assigned
 *   • Refresh button — requests MissionBridge to regenerate
 *
 * ── Props ─────────────────────────────────────────────────────────────────────
 *   None. All data flows from useCreatorMission().
 *
 * ── No business logic ─────────────────────────────────────────────────────────
 *   Reads context, dispatches completeTask(id) / refreshMission().
 *   Zero computation inside this component.
 */

import React, { useCallback } from 'react';
import styles                 from './MissionCard.module.css';

import { useCreatorMission }  from '../hooks/useCreatorMission';
import { DIFFICULTY_META }    from '../models/missionModel';

// ── Stars renderer ────────────────────────────────────────────────────────────
function DifficultyStars({ difficulty }) {
  const meta   = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.easy;
  const filled = meta.stars;
  const total  = 4;
  return (
    <span className={styles.stars} aria-label={`Difficulty: ${meta.label}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={styles.star}
          style={{ color: i < filled ? meta.color : 'rgba(255,255,255,0.12)' }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ── Single task row ───────────────────────────────────────────────────────────
function TaskRow({ task_, onComplete }) {
  const handleClick = useCallback(() => {
    if (!task_.completed) onComplete(task_.id);
  }, [task_, onComplete]);

  return (
    <button
      className={`${styles.taskRow} ${task_.completed ? styles.taskRowDone : ''}`}
      onClick={handleClick}
      aria-label={task_.completed ? `${task_.label} — completed` : `Mark complete: ${task_.label}`}
      disabled={task_.completed}
    >
      <span
        className={`${styles.taskCheck} ${task_.completed ? styles.taskCheckDone : ''}`}
        aria-hidden="true"
      >
        {task_.completed ? '✓' : '○'}
      </span>
      <span className={styles.taskIcon} aria-hidden="true">{task_.icon}</span>
      <span className={styles.taskLabel}>{task_.label}</span>
    </button>
  );
}

// ── Reward chip ───────────────────────────────────────────────────────────────
function RewardChip({ reward }) {
  if (!reward) return null;
  return (
    <div className={styles.rewardChip}>
      <span className={styles.rewardIcon}>{reward.icon}</span>
      <span className={styles.rewardLabel}>{reward.label}</span>
    </div>
  );
}

// ══ MissionCard ════════════════════════════════════════════════════════════════

export default function MissionCard() {
  const { mission, isGenerating, completeTask, refreshMission } = useCreatorMission();

  const meta       = DIFFICULTY_META[mission.difficulty] ?? DIFFICULTY_META.easy;
  const isComplete = mission.completionProgress >= 100;

  return (
    <div className={`${styles.card} ${isComplete ? styles.cardComplete : ''}`}>

      {/* ── Card header ──────────────────────────────────────────────── */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <div className={styles.missionBadge}>
            <span className={styles.missionBadgeDot} />
            Daily Mission
          </div>
          <h3 className={styles.missionTitle}>{mission.missionTitle}</h3>
          <div className={styles.metaRow}>
            <DifficultyStars difficulty={mission.difficulty} />
            <span
              className={styles.difficultyLabel}
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            {isComplete && (
              <span className={styles.completeBadge}>✓ Complete</span>
            )}
          </div>
        </div>

        {/* Refresh button */}
        <button
          className={styles.refreshBtn}
          onClick={refreshMission}
          disabled={isGenerating}
          aria-label="Refresh mission"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" width="15" height="15"
            className={isGenerating ? styles.refreshSpin : undefined}
            aria-hidden="true">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Progress</span>
          <span className={styles.progressPct}>{mission.completionProgress}%</span>
        </div>
        <div className={styles.progressTrack} role="progressbar"
          aria-valuenow={mission.completionProgress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={styles.progressFill}
            style={{
              width:      `${mission.completionProgress}%`,
              background: isComplete
                ? 'linear-gradient(90deg,#4ade80,#86efac)'
                : `linear-gradient(90deg,${meta.color},${meta.color}cc)`,
            }}
          />
        </div>
      </div>

      {/* ── Task list ────────────────────────────────────────────────── */}
      {mission.tasks.length > 0 && (
        <div className={styles.taskList} role="list">
          {mission.tasks.map((t, i) => (
            <div
              key={t.id}
              role="listitem"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <TaskRow task_={t} onComplete={completeTask} />
            </div>
          ))}
        </div>
      )}

      {/* ── Stats row: improvement + reward ──────────────────────────── */}
      <div className={styles.statsRow}>
        <div className={styles.statCell}>
          <span className={styles.statVal} style={{ color: '#4ade80' }}>
            +{mission.estimatedImprovement}
          </span>
          <span className={styles.statLbl}>Est. Improvement</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statCell}>
          <RewardChip reward={mission.reward} />
          <span className={styles.statLbl}>Mission Reward</span>
        </div>
      </div>

      {/* ── Reasoning ────────────────────────────────────────────────── */}
      {mission.reasoning?.length > 0 && (
        <div className={styles.reasoningSection}>
          {mission.reasoning.map((r, i) => (
            <div key={i} className={styles.reasonRow}>
              <span className={styles.reasonDot} />
              <span className={styles.reasonText}>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Completion celebration ────────────────────────────────────── */}
      {isComplete && (
        <div className={styles.completionBanner}>
          <span className={styles.completionIcon}>🎉</span>
          <span className={styles.completionText}>Mission Complete! Refresh for a new challenge.</span>
        </div>
      )}
    </div>
  );
}

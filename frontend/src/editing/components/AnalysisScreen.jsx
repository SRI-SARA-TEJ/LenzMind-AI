/**
 * editing/components/AnalysisScreen.jsx
 *
 * AI Analysis Screen — full animated analysis sequence.
 *
 * States:
 *   idle       — landing card, "Start Analysis" button
 *   running    — animated phases with circular progress + task list
 *   complete   — results summary, auto-navigate to SuggestionPanel
 *   error      — error card with retry
 *
 * The analysis runs purely on the client (mock timers).
 * [AI_FUTURE] Each phase maps to a real IBM watsonx.ai model call.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './AnalysisScreen.module.css';
import { useEditing } from '../hooks/useEditing';
import { MOCK_SUGGESTIONS, ANALYSIS_PHASES } from '../data/mockEditingData';

// ── Analysis task list (8 detection tasks shown to user) ─────────────────────
const DETECTION_TASKS = [
  { id: 'scene',    label: 'Detecting scenes',           icon: '🎬', durationMs: 1300 },
  { id: 'faces',    label: 'Detecting faces',            icon: '👤', durationMs: 1100 },
  { id: 'lighting', label: 'Analysing lighting',         icon: '💡', durationMs: 1200 },
  { id: 'shake',    label: 'Detecting camera shake',     icon: '🎥', durationMs: 1000 },
  { id: 'audio',    label: 'Analysing audio quality',    icon: '🎙', durationMs: 1400 },
  { id: 'objects',  label: 'Detecting objects',          icon: '🔍', durationMs: 1100 },
  { id: 'privacy',  label: 'Detecting privacy issues',   icon: '🔒', durationMs: 900  },
  { id: 'build',    label: 'Building AI recommendations',icon: '✦',  durationMs: 1200 },
];

const TOTAL_MS = DETECTION_TASKS.reduce((s, t) => s + t.durationMs, 0);

// ── Circular SVG progress ring ────────────────────────────────────────────────
const RADIUS   = 54;
const CIRC     = 2 * Math.PI * RADIUS;

function CircularProgress({ pct }) {
  const offset = CIRC - (pct / 100) * CIRC;
  return (
    <svg className={styles.ring} viewBox="0 0 120 120" fill="none">
      {/* Track */}
      <circle
        cx="60" cy="60" r={RADIUS}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="8"
        fill="none"
      />
      {/* Glow layer */}
      <circle
        cx="60" cy="60" r={RADIUS}
        stroke="rgba(99,102,241,0.15)"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 0.4s ease' }}
      />
      {/* Main arc */}
      <circle
        cx="60" cy="60" r={RADIUS}
        stroke="url(#ringGrad)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 0.4s ease' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Single detection task row ─────────────────────────────────────────────────
function TaskRow({ task, state }) {
  // state: 'waiting' | 'running' | 'done'
  return (
    <div className={`${styles.taskRow} ${styles[`taskRow_${state}`]}`}>
      <div className={styles.taskIconWrap}>
        {state === 'done'
          ? <span className={styles.taskDoneIcon}>✓</span>
          : state === 'running'
            ? <span className={styles.taskRunIcon}>⟳</span>
            : <span className={styles.taskWaitIcon}>{task.icon}</span>
        }
      </div>
      <span className={styles.taskLabel}>{task.label}</span>
      <div className={styles.taskRight}>
        {state === 'running' && <span className={styles.taskSpinner} />}
        {state === 'done'    && <span className={styles.taskOkLabel}>Done</span>}
      </div>
    </div>
  );
}

// ── Idle landing ──────────────────────────────────────────────────────────────
function IdleCard({ projectTitle, onStart }) {
  return (
    <div className={styles.idleWrap}>
      {/* IBM AI badge */}
      <div className={styles.ibmBadge}>
        <span className={styles.ibmDot} />
        <span className={styles.ibmLabel}>IBM watsonx.ai</span>
      </div>

      {/* Hero icon */}
      <div className={styles.heroRing}>
        <div className={styles.heroRingInner}>
          <span className={styles.heroIcon}>✦</span>
        </div>
      </div>

      <h2 className={styles.idleTitle}>AI Editing Intelligence</h2>
      <p className={styles.idleSub}>
        {projectTitle
          ? `Ready to analyse "${projectTitle}"`
          : 'Ready to analyse your footage'}
      </p>

      {/* What AI checks */}
      <div className={styles.checkList}>
        {DETECTION_TASKS.map(t => (
          <div key={t.id} className={styles.checkListItem}>
            <span className={styles.checkListIcon}>{t.icon}</span>
            <span className={styles.checkListLabel}>{t.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.aiFutureBadge}>
        <span className={styles.aiFutureIcon}>🧠</span>
        <span className={styles.aiFutureText}>
          Powered by IBM watsonx.ai — Vision, Audio &amp; Language models
        </span>
      </div>

      <button className={styles.startBtn} onClick={onStart}>
        <span className={styles.startBtnIcon}>✦</span>
        Start AI Analysis
      </button>
    </div>
  );
}

// ── Error card ────────────────────────────────────────────────────────────────
function ErrorCard({ message, onRetry }) {
  return (
    <div className={styles.errorWrap}>
      <div className={styles.errorIcon}>⚠</div>
      <h3 className={styles.errorTitle}>Analysis Failed</h3>
      <p className={styles.errorMsg}>{message}</p>
      <button className={styles.retryBtn} onClick={onRetry}>Try Again</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalysisScreen() {
  const {
    state,
    startAnalysis,
    updateAnalysisProgress,
    completeAnalysis,
    failAnalysis,
    setSessionState,
  } = useEditing();

  const session  = state.activeSession;
  const analysis = session?.analysis;

  // Local animation state (separate from context — purely presentational)
  const [localState,   setLocalState]   = useState('idle');  // 'idle'|'running'|'complete'|'error'
  const [taskIdx,      setTaskIdx]      = useState(0);       // current task index
  const [doneTasks,    setDoneTasks]    = useState({});      // { taskId: true }
  const [pct,          setPct]          = useState(0);       // 0–100
  const [elapsed,      setElapsed]      = useState(0);       // ms elapsed
  const timerRef = useRef(null);

  // Derive from context when session already has a complete analysis
  useEffect(() => {
    if (analysis?.state === 'complete' && localState !== 'complete') {
      setLocalState('complete');
      setPct(100);
    }
    if (analysis?.state === 'error' && localState !== 'error') {
      setLocalState('error');
    }
  }, [analysis?.state, localState]);

  // Tick through tasks
  useEffect(() => {
    if (localState !== 'running') return;

    if (taskIdx >= DETECTION_TASKS.length) {
      // All tasks done — fire completeAnalysis
      clearTimeout(timerRef.current);
      const mockScores = {
        overall: 72, visual: 68, audio: 74, pacing: 81, colourGrade: 60, stability: 70,
      };
      const mockSummary =
        'AI detected 15 potential improvements across visual, audio, motion, and text categories. ' +
        'Critical: one uncleared background face requires immediate action. ' +
        'Overall quality score: 72/100.';
      completeAnalysis(MOCK_SUGGESTIONS, mockScores, mockSummary);
      setLocalState('complete');
      return;
    }

    const task    = DETECTION_TASKS[taskIdx];
    timerRef.current = setTimeout(() => {
      const newElapsed = elapsed + task.durationMs;
      const newPct     = Math.round((newElapsed / TOTAL_MS) * 100);

      setDoneTasks(d => ({ ...d, [task.id]: true }));
      setElapsed(newElapsed);
      setPct(newPct);
      updateAnalysisProgress(newPct, 'analysing');
      setTaskIdx(i => i + 1);
    }, task.durationMs);

    return () => clearTimeout(timerRef.current);
  }, [localState, taskIdx, elapsed, updateAnalysisProgress, completeAnalysis]);

  // Handlers
  const handleStart = useCallback(() => {
    startAnalysis();
    setLocalState('running');
    setTaskIdx(0);
    setDoneTasks({});
    setPct(0);
    setElapsed(0);
  }, [startAnalysis]);

  const handleRetry = useCallback(() => {
    setLocalState('idle');
    setPct(0);
    setTaskIdx(0);
    setDoneTasks({});
    setElapsed(0);
  }, []);

  // Estimated time remaining
  const remainingMs = DETECTION_TASKS
    .slice(taskIdx)
    .reduce((s, t) => s + t.durationMs, 0);
  const remainingSec = Math.ceil(remainingMs / 1000);

  // ── Idle ──
  if (localState === 'idle') {
    return (
      <div className={styles.screen}>
        <IdleCard
          projectTitle={session?.projectTitle ?? ''}
          onStart={handleStart}
        />
      </div>
    );
  }

  // ── Error ──
  if (localState === 'error') {
    return (
      <div className={styles.screen}>
        <ErrorCard
          message={analysis?.errorMessage ?? 'An unexpected error occurred.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // ── Complete ──
  if (localState === 'complete') {
    const scores = analysis?.scores ?? {};
    const count  = analysis?.suggestions?.length ?? 0;
    const critical = analysis?.suggestions?.filter(s => s.severity === 'Critical').length ?? 0;
    return (
      <div className={styles.screen}>
        <div className={styles.completeWrap}>

          {/* Success ring */}
          <div className={styles.completeRing}>
            <svg viewBox="0 0 120 120" fill="none" className={styles.completeRingSVG}>
              <circle cx="60" cy="60" r={RADIUS} stroke="rgba(34,197,94,0.15)" strokeWidth="8" fill="none" />
              <circle cx="60" cy="60" r={RADIUS} stroke="#22c55e" strokeWidth="8" fill="none"
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={0}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }} />
            </svg>
            <div className={styles.completeRingInner}>
              <span className={styles.completeCheckIcon}>✓</span>
            </div>
          </div>

          <div className={styles.ibmBadge}>
            <span className={styles.ibmDot} />
            <span className={styles.ibmLabel}>IBM watsonx.ai</span>
          </div>

          <h2 className={styles.completeTitle}>Analysis Complete</h2>
          <p className={styles.completeSub}>
            {count} improvement{count !== 1 ? 's' : ''} detected
            {critical > 0 ? ` — ${critical} critical` : ''}
          </p>

          {/* Quality scores */}
          {scores.overall != null && (
            <div className={styles.scoresWrap}>
              {[
                { label: 'Overall',    v: scores.overall },
                { label: 'Visual',     v: scores.visual },
                { label: 'Audio',      v: scores.audio },
                { label: 'Pacing',     v: scores.pacing },
                { label: 'Colour',     v: scores.colourGrade },
                { label: 'Stability',  v: scores.stability },
              ].map(({ label, v }) => (
                <div key={label} className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>{label}</span>
                  <div className={styles.scoreBarTrack}>
                    <div
                      className={styles.scoreBarFill}
                      style={{ width: `${v}%`, background: v >= 80 ? '#22c55e' : v >= 60 ? '#f59e0b' : '#ef4444' }}
                    />
                  </div>
                  <span className={styles.scoreVal}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI summary */}
          {analysis?.aiSummary && (
            <div className={styles.aiSummary}>
              <span className={styles.aiSummaryBadge}>✦ AI Summary</span>
              <p className={styles.aiSummaryText}>{analysis.aiSummary}</p>
            </div>
          )}

          <button className={styles.reviewBtn} onClick={() => setSessionState('reviewing')}>
            Review {count} Suggestions →
          </button>

          <div style={{ height: 24 }} />
        </div>
      </div>
    );
  }

  // ── Running ──
  const currentTask = DETECTION_TASKS[taskIdx] ?? DETECTION_TASKS[DETECTION_TASKS.length - 1];

  return (
    <div className={styles.screen}>
      <div className={styles.runningWrap}>

        {/* IBM badge */}
        <div className={styles.ibmBadge}>
          <span className={styles.ibmDot} />
          <span className={styles.ibmLabel}>IBM watsonx.ai · Analysing</span>
        </div>

        {/* Circular progress */}
        <div className={styles.ringWrap}>
          <CircularProgress pct={pct} />
          <div className={styles.ringCenter}>
            <span className={styles.ringPct}>{pct}%</span>
            <span className={styles.ringLabel}>Complete</span>
          </div>
        </div>

        {/* Current task + ETA */}
        <div className={styles.currentTask}>
          <span className={styles.currentTaskIcon}>{currentTask.icon}</span>
          <span className={styles.currentTaskLabel}>{currentTask.label}</span>
        </div>
        <p className={styles.etaLabel}>
          {remainingSec > 0 ? `~${remainingSec}s remaining` : 'Finishing…'}
        </p>

        {/* Task list */}
        <div className={styles.taskList}>
          {DETECTION_TASKS.map((task, i) => {
            const isDone    = !!doneTasks[task.id];
            const isRunning = !isDone && i === taskIdx;
            const taskState = isDone ? 'done' : isRunning ? 'running' : 'waiting';
            return (
              <TaskRow key={task.id} task={task} state={taskState} />
            );
          })}
        </div>

      </div>
    </div>
  );
}

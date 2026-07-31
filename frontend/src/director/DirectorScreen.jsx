/**
 * director/DirectorScreen.jsx — AI Director Mode Main Screen
 *
 * Screen routing (internal, no react-router):
 *   'home'          — Mode selector + saved Director Maps
 *   'template-picker' — AI Guided: choose a template
 *   'guided-session'  — AI Guided: step-by-step guide
 *   'create-own'      — Create My Own: recording + shot markers
 *   'director-map'    — View a saved Director Map
 *
 * This module wraps itself in DirectorProvider.
 * BottomNavBar handles navigation back to Camera, Projects, Workflows etc.
 */

import React, { useMemo } from 'react';
import styles from './DirectorScreen.module.css';

import { DirectorProvider }  from './context/DirectorContext';
import { useDirector }       from './hooks/useDirector';

import TemplatePicker        from './components/TemplatePicker';
import GuidedSession         from './components/GuidedSession';
import CreateOwnSession      from './components/CreateOwnSession';
import DirectorMapView       from './components/DirectorMapView';
import MapSaveDialog         from './components/MapSaveDialog';
import ReadyScreen           from './components/ReadyScreen';
import CameraPrep            from './components/CameraPrep';
import CreatorMemoryToast    from './components/CreatorMemoryToast';

import BottomNavBar          from '../camera/components/BottomNavBar';

// ── Mode cards ────────────────────────────────────────────────────────────────
function ModeCard({ icon, title, subtitle, badge, badgeColor, features, cta, onClick }) {
  return (
    <div className={styles.modeCard} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className={styles.modeCardTop}>
        <span className={styles.modeIcon}>{icon}</span>
        <span className={styles.modeBadge} style={{ background: badgeColor }}>{badge}</span>
      </div>
      <h3 className={styles.modeTitle}>{title}</h3>
      <p className={styles.modeSub}>{subtitle}</p>
      <ul className={styles.modeFeatures}>
        {features.map((f, i) => <li key={i} className={styles.modeFeature}>{f}</li>)}
      </ul>
      <button className={styles.modeCta} onClick={e => { e.stopPropagation(); onClick(); }}>
        {cta}
      </button>
    </div>
  );
}

// ── Saved Director Map card ───────────────────────────────────────────────────
function MapCard({ map, onOpen }) {
  const formatDate = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7)  return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const totalDur = map.shots.reduce((s, sh) => s + sh.durationSeconds, 0);

  return (
    <div className={styles.mapCard} onClick={() => onOpen(map)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen(map)}>
      <div className={styles.mapCardLeft}>
        <div className={styles.mapCardIcon}>🎬</div>
        <div className={styles.mapCardBody}>
          <span className={styles.mapCardName}>{map.name}</span>
          <div className={styles.mapCardMeta}>
            <span className={styles.mapCardShots}>{map.shots.length} shots</span>
            <span className={styles.mapCardSep}>·</span>
            <span className={styles.mapCardDur}>~{totalDur}s</span>
            {map.workflowName && (
              <>
                <span className={styles.mapCardSep}>·</span>
                <span className={styles.mapCardWf}>⚡ {map.workflowName}</span>
              </>
            )}
          </div>
          <span className={styles.mapCardDate}>{formatDate(map.updatedAt)}</span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function DirectorStats() {
  const { stats } = useDirector();
  return (
    <div className={styles.statsBar}>
      {[
        { v: stats.templates,         l: 'Templates' },
        { v: stats.savedMaps,         l: 'Maps' },
        { v: stats.sessionsCompleted, l: 'Sessions' },
        { v: stats.totalShots,        l: 'Shots Mapped' },
      ].map((s, i, arr) => (
        <React.Fragment key={s.l}>
          <div className={styles.statItem}>
            <span className={styles.statVal}>{s.v}</span>
            <span className={styles.statLbl}>{s.l}</span>
          </div>
          {i < arr.length - 1 && <div className={styles.statSep} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Home screen ───────────────────────────────────────────────────────────────
function DirectorHome() {
  const { state, setMode, selectDirectorMap } = useDirector();
  const { directorMaps } = state;

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.topTitle}>AI Director</h1>
          <p className={styles.topSub}>Cinematography Director Mode</p>
        </div>
        <div className={styles.aiBadge}>
          <span className={styles.aiBadgeDot} />
          AI Director
        </div>
      </div>

      {/* Stats */}
      <DirectorStats />

      {/* Scrollable content */}
      <div className={styles.content}>

        {/* Mode selection */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Choose Your Mode</h2>
          </div>
          <div className={styles.modeGrid}>
            <ModeCard
              icon="🤖"
              title="AI Guided"
              subtitle="Learn professional cinematography step by step with AI coaching."
              badge="AI Teaching"
              badgeColor="rgba(99,102,241,0.8)"
              features={[
                '10 cinematic templates',
                'Beginner-friendly instructions',
                'Step-by-step shot guidance',
                'Pro tips & motion cues',
              ]}
              cta="Start AI Guided →"
              onClick={() => setMode('ai-guided')}
            />
            <ModeCard
              icon="🎬"
              title="Create My Own"
              subtitle="Record freely and build your own cinematography with shot markers."
              badge="Free Form"
              badgeColor="rgba(34,197,94,0.7)"
              features={[
                'Free-form recording',
                'Custom shot markers',
                'Build Director Maps',
                'Save to workflows',
              ]}
              cta="Start Creating →"
              onClick={() => setMode('create-own')}
            />
          </div>
        </div>

        {/* Saved Director Maps */}
        {directorMaps.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Director Maps</h2>
              <span className={styles.sectionCount}>{directorMaps.length}</span>
            </div>
            <div className={styles.mapList}>
              {directorMaps.map(dm => (
                <MapCard key={dm.id} map={dm} onOpen={selectDirectorMap} />
              ))}
            </div>
          </div>
        )}

        {/* Future AI integration teaser */}
        <div className={styles.futureCard}>
          <div className={styles.futureHeader}>
            <span className={styles.futureBadge}>✦ Coming Soon</span>
          </div>
          <h3 className={styles.futureTitle}>AI Cinematography Analysis</h3>
          <p className={styles.futureSub}>
            IBM watsonx.ai will analyse your director maps, learn your style, and provide personalised coaching to evolve your cinematography.
          </p>
          <div className={styles.futureItems}>
            <div className={styles.futureItem}>🧠 Creator Memory Agent</div>
            <div className={styles.futureItem}>📊 Cinematic Score</div>
            <div className={styles.futureItem}>💡 AI Recommendations</div>
            <div className={styles.futureItem}>📈 Learning Progress</div>
          </div>
        </div>

        <div style={{ height: 100 }} />
      </div>

      <BottomNavBar />

      {/* Global overlays */}
      <MapSaveDialog />
      <ReadyScreen />
      <CameraPrep />
      <CreatorMemoryToast />
    </div>
  );
}

// ── Inner screen router ───────────────────────────────────────────────────────
function DirectorScreenInner() {
  const { state } = useDirector();
  const { screen } = state;

  if (screen === 'template-picker') return <TemplatePicker />;
  if (screen === 'guided-session')  return <GuidedSession />;
  if (screen === 'create-own')      return <CreateOwnSession />;
  if (screen === 'director-map')    return <DirectorMapView />;
  return <DirectorHome />;
}

// ── Root export: wraps provider ───────────────────────────────────────────────
export default function DirectorScreen() {
  return (
    <DirectorProvider>
      <DirectorScreenInner />
    </DirectorProvider>
  );
}

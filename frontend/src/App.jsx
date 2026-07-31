/**
 * App.jsx — Root Application Component
 *
 * Version 1 change: adds the Camera section routes.
 * Version 2 change: adds the Project Library route.
 * Module 8.5  change: lifts WorkflowProvider to app root so
 *   WorkflowApplicationBridge (mounted in CameraScreen) can call
 *   WorkflowContext.incrementUsage() when the active workflow changes.
 * Module 8.7  change: lifts CreatorMemoryProvider to app root.
 * Module 8.8  change: lifts AnalyticsProvider + mounts AnalyticsBridge.
 * Module 8.9  change: lifts CreatorLearningProvider + mounts LearningBridge.
 * Module 9    change: adds /intelligence route.
 * Module 10.1 change: lifts CreatorAssistantProvider + mounts AssistantBridge.
 * Module 10.2 change: lifts CreatorMissionProvider + mounts MissionBridge so
 *   the daily mission regenerates whenever the briefing or learning profile changes.
 * Module 10.3 change: lifts CreatorCoachProvider + mounts CoachBridge
 *   so the coaching session regenerates whenever any upstream intelligence layer changes.
 *   Adds /coach route. Navigation is unchanged (coach is an internal AI layer).
 * Module 10.4 change: lifts CreatorGrowthProvider (new innermost) + mounts GrowthBridge
 *   so the growth plan regenerates whenever any upstream intelligence layer changes.
 *   Adds /growth route. Navigation is unchanged (growth is an internal intelligence layer).
 *
 * Provider nesting (outer → inner):
 *   AppProvider
 *   └─ WorkflowProvider              (8.5 — lifted)
 *      └─ CreatorMemoryProvider      (8.7)
 *         └─ AnalyticsProvider       (8.8)
 *            └─ CreatorLearningProvider (8.9)
 *               └─ CreatorAssistantProvider  (10.1)
 *                  └─ CreatorMissionProvider  (10.2)
 *                     └─ CreatorCoachProvider  (10.3)
 *                        └─ CreatorGrowthProvider  (10.4 — new innermost)
 *                           └─ BrowserRouter
 *                              ├─ AnalyticsBridge   (8.8)
 *                              ├─ LearningBridge    (8.9)
 *                              ├─ AssistantBridge   (10.1)
 *                              ├─ MissionBridge     (10.2)
 *                              ├─ CoachBridge       (10.3)
 *                              ├─ GrowthBridge      (10.4)
 *                              └─ Routes / screens
 *                                 └─ CameraScreen
 *                                    ├─ CameraMemoryBridge          (8.7)
 *                                    └─ WorkflowApplicationBridge   (8.5)
 *
 * Camera routes use a full-screen mobile layout (no sidebar/topbar shell).
 * Existing dashboard routes retain the AppLayout wrapper.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AppProvider }               from './context/AppContext';
import { WorkflowProvider }          from './workflow/context/WorkflowContext';
import { CreatorMemoryProvider }     from './memory/context/CreatorMemoryContext';
import { AnalyticsProvider }         from './analytics/context/AnalyticsContext';
import { CreatorLearningProvider }   from './learning/context/CreatorLearningContext';
import { CreatorAssistantProvider }  from './assistant/context/CreatorAssistantContext';
import { CreatorMissionProvider }    from './mission/context/CreatorMissionContext';
import { CreatorCoachProvider }      from './coach/context/CreatorCoachContext';
import { CreatorGrowthProvider }     from './growth/context/CreatorGrowthContext';
import AnalyticsBridge               from './analytics/components/AnalyticsBridge';
import LearningBridge                from './learning/components/LearningBridge';
import AssistantBridge               from './assistant/components/AssistantBridge';
import MissionBridge                 from './mission/components/MissionBridge';
import CoachBridge                   from './coach/components/CoachBridge';
import GrowthBridge                  from './growth/components/GrowthBridge';
import AppLayout                     from './components/layout/AppLayout';

// ── Existing pages ────────────────────────────────────────────────────────────
import DashboardPage       from './pages/DashboardPage';
import UploadPage          from './pages/UploadPage';
import WorkspacePage       from './pages/WorkspacePage';
import RecommendationsPage from './pages/RecommendationsPage';
import AnalyticsPage       from './pages/AnalyticsPage';
import NotFoundPage        from './pages/NotFoundPage';

// ── Camera OS ─────────────────────────────────────────────────────────────────
import CameraScreen        from './camera/CameraScreen';
import PlaceholderScreen   from './pages/camera/PlaceholderScreen';

// ── Workflow Library ──────────────────────────────────────────────────────────
import WorkflowScreen      from './workflow/WorkflowScreen';

// ── Project Library ───────────────────────────────────────────────────────────
import ProjectLibraryScreen from './project/ProjectLibraryScreen';

// ── AI Director Mode ──────────────────────────────────────────────────────────
import DirectorScreen       from './director/DirectorScreen';

// ── AI Editing Intelligence ───────────────────────────────────────────────────
import EditingScreen        from './editing/EditingScreen';

// ── Creator Memory Intelligence ───────────────────────────────────────────────
import CreatorMemoryScreen  from './memory/CreatorMemoryScreen';

// ── Creator Analytics Intelligence ───────────────────────────────────────────
import AnalyticsScreen      from './analytics/components/AnalyticsScreen';

// ── Creator Intelligence Dashboard (Module 9) ─────────────────────────────────
import CreatorIntelligenceScreen from './intelligence/CreatorIntelligenceScreen';

// ── AI Creator Assistant (Module 10.1) ────────────────────────────────────────
import CreatorAssistantScreen from './assistant/components/CreatorAssistantScreen';

// ── Creator Coach Engine (Module 10.3) ────────────────────────────────────────
import CreatorCoachScreen     from './coach/components/CreatorCoachScreen';

// ── Creator Growth Engine (Module 10.4) ───────────────────────────────────────
import CreatorGrowthScreen    from './growth/components/CreatorGrowthScreen';

export default function App() {
  return (
    <AppProvider>
      {/*
        Module 8.5 — WorkflowProvider lifted to app root so WorkflowApplicationBridge
        (inside CameraScreen) can read and update WorkflowContext from /camera.
        WorkflowScreen no longer needs its own WorkflowProvider wrapper.
      */}
      <WorkflowProvider>
      {/*
        Module 8.7 — CreatorMemoryProvider: single shared session store used by
        CameraMemoryBridge (/camera) and CreatorMemoryScreen (/memory).
      */}
      <CreatorMemoryProvider>
        {/*
          Module 8.8 — AnalyticsProvider: single shared analytics store used by
          AnalyticsBridge (below) and AnalyticsScreen (/analytics).
          Must be inside CreatorMemoryProvider so AnalyticsBridge can call both.
        */}
        <AnalyticsProvider>
          {/*
            Module 8.9 — CreatorLearningProvider: single shared learning profile
            store used by LearningBridge (below) and any future Learning UI.
            Must be inside AnalyticsProvider so LearningBridge can call all three
            contexts (Memory, Analytics, Learning).
          */}
          <CreatorLearningProvider>
            {/*
              Module 10.1 — CreatorAssistantProvider: innermost shared store.
              Must be inside CreatorLearningProvider so AssistantBridge can
              call all four contexts (Memory, Analytics, Learning, Assistant).
            */}
            <CreatorAssistantProvider>
              {/*
                Module 10.2 — CreatorMissionProvider: inside CreatorAssistantProvider
                so MissionBridge can read the live briefing (4 contexts total).
              */}
              <CreatorMissionProvider>
                {/*
                  Module 10.3 — CreatorCoachProvider: new innermost provider.
                  Must be inside CreatorMissionProvider so CoachBridge can read
                  all five upstream contexts (Memory, Analytics, Learning,
                  Assistant, Mission).
                */}
                <CreatorCoachProvider>
                {/*
                  Module 10.4 — CreatorGrowthProvider: new innermost provider.
                  Must be inside CreatorCoachProvider so GrowthBridge can read
                  all six upstream contexts (Memory, Analytics, Learning,
                  Assistant, Mission, Coach).
                */}
                <CreatorGrowthProvider>
                <BrowserRouter>
                  {/* 8.8 — feeds Memory→Analytics */}
                  <AnalyticsBridge />
                  {/* 8.9 — feeds Memory+Analytics→Learning */}
                  <LearningBridge />
                  {/* 10.1 — feeds Learning+Memory+Analytics→Briefing */}
                  <AssistantBridge />
                  {/*
                    10.2 — MissionBridge (renderless).
                    Watches session count, learning computedAt, briefing
                    generatedAt, and refreshTick.  Calls generateMission()
                    and writes into CreatorMissionContext.
                  */}
                  <MissionBridge />
                  {/*
                    10.3 — CoachBridge (renderless).
                    Watches session count, learning computedAt, briefing
                    generatedAt, mission generatedAt, and refreshTick.
                    Calls generateCoachSession() and writes into
                    CreatorCoachContext.
                  */}
                  <CoachBridge />
                  {/*
                    10.4 — GrowthBridge (renderless).
                    Watches session count, learning computedAt, briefing
                    generatedAt, mission generatedAt, coach generatedAt,
                    and refreshTick.  Calls generateGrowthPlan() and writes
                    into CreatorGrowthContext.
                  */}
                  <GrowthBridge />

                  <Routes>
                  {/* ── Camera OS — full-screen, no shell ─────────────── */}
                  <Route path="/camera"       element={<CameraScreen />} />
                  <Route path="/projects"     element={<ProjectLibraryScreen />} />
                  <Route path="/director"     element={<DirectorScreen />} />
                  <Route path="/editing"      element={<EditingScreen />} />
                  <Route path="/workflows"    element={<WorkflowScreen />} />
                  <Route path="/memory"       element={<CreatorMemoryScreen />} />
                  <Route path="/analytics"    element={<AnalyticsScreen />} />
                  <Route path="/intelligence" element={<CreatorIntelligenceScreen />} />
                  <Route path="/assistant"    element={<CreatorAssistantScreen />} />
                  <Route path="/coach"        element={<CreatorCoachScreen />} />
                  <Route path="/growth"       element={<CreatorGrowthScreen />} />
                  <Route path="/profile"      element={<PlaceholderScreen screen="profile" />} />

                  {/* ── Existing dashboard shell ──────────────────────── */}
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<Navigate to="/camera" replace />} />
                    <Route path="dashboard"        element={<DashboardPage />} />
                    <Route path="upload"           element={<UploadPage />} />
                    <Route path="workspace/:id"    element={<WorkspacePage />} />
                    <Route path="recommendations"  element={<RecommendationsPage />} />
                    <Route path="analytics"        element={<AnalyticsPage />} />
                    <Route path="*"                element={<NotFoundPage />} />
                  </Route>
                  </Routes>
                </BrowserRouter>
                 </CreatorGrowthProvider>
                 </CreatorCoachProvider>
              </CreatorMissionProvider>
            </CreatorAssistantProvider>
          </CreatorLearningProvider>
        </AnalyticsProvider>
      </CreatorMemoryProvider>
      </WorkflowProvider>
    </AppProvider>
  );
}

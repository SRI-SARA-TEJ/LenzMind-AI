/**
 * services/recommendationService.js — Recommendation Business Logic
 *
 * Manages stored recommendation records and drives AI agent analysis.
 *
 * API contract is intentionally stable: controllers call the same functions
 * regardless of whether real Gemini AI calls happen or mock responses are
 * returned. The AI plumbing is fully behind the agentOrchestrator abstraction.
 *
 * Design principle: AI must explain itself.
 * Every recommendation MUST include an `explanation` field.
 */

'use strict';

const Recommendation    = require('../models/Recommendation');
const projectService    = require('./projectService');
const agentOrchestrator = require('./agentOrchestrator');

// ── Get all recommendations for a project ────────────────────────────────────
async function getRecommendationsForProject(projectId) {
  return Recommendation.find({ projectId }).sort({ createdAt: -1 });
}

// ── Create a single recommendation (called by agents / orchestrator) ──────────
// Design principle: AI must explain itself — `explanation` is required.
async function createRecommendation(data) {
  const rec = new Recommendation({
    projectId:   data.projectId,
    agentType:   data.agentType,
    title:       data.title,
    explanation: data.explanation,
    confidence:  data.confidence ?? null,
    tags:        data.tags || [],
  });
  return rec.save();
}

// ── Run AI analysis on a single asset and persist recommendations ─────────────
/**
 * Triggers the agent orchestrator for one asset, then saves every agent
 * result as a Recommendation document.
 *
 * Returns the list of saved Recommendation documents so the controller can
 * respond immediately without a second DB query.
 *
 * @param {string} projectId
 * @param {object} asset — asset subdocument (must include url, mimeType, etc.)
 * @returns {Promise<object[]>} — saved Recommendation documents
 */
async function runAnalysisForAsset(projectId, asset) {
  const agentResults = await agentOrchestrator.analyzeAsset(asset, projectId);

  if (agentResults.length === 0) return [];

  const saved = await Promise.all(
    agentResults.map((result) =>
      createRecommendation({
        projectId,
        agentType:   result.agentType,
        title:       result.title,
        explanation: result.explanation,
        confidence:  result.confidence ?? null,
        tags:        result.tags || [],
      })
    )
  );

  return saved;
}

// ── Run AI analysis across all assets in a project ────────────────────────────
/**
 * Fetches the full project, fans out analysis to all agents for all assets,
 * and persists every result as a Recommendation.
 *
 * @param {string} projectId
 * @returns {Promise<object[]>} — all saved Recommendation documents
 */
async function runAnalysisForProject(projectId) {
  const project      = await projectService.getProjectById(projectId);
  const agentResults = await agentOrchestrator.analyzeProject(project);

  if (agentResults.length === 0) return [];

  const saved = await Promise.all(
    agentResults.map((result) =>
      createRecommendation({
        projectId,
        agentType:   result.agentType,
        title:       result.title,
        explanation: result.explanation,
        confidence:  result.confidence ?? null,
        tags:        result.tags || [],
      })
    )
  );

  return saved;
}

// ── Record a user's decision on a recommendation ─────────────────────────────
// Human stays in control — they accept or dismiss every suggestion.
async function updateUserAction(id, action) {
  const validActions = ['accepted', 'dismissed'];
  if (!validActions.includes(action)) {
    const err = new Error(`Invalid action. Use: ${validActions.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const rec = await Recommendation.findByIdAndUpdate(
    id,
    { userAction: action },
    { new: true, runValidators: true }
  );

  if (!rec) {
    const err = new Error('Recommendation not found');
    err.statusCode = 404;
    throw err;
  }
  return rec;
}

module.exports = {
  getRecommendationsForProject,
  createRecommendation,
  runAnalysisForAsset,
  runAnalysisForProject,
  updateUserAction,
};

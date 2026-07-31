/**
 * controllers/analyticsController.js — Analytics HTTP Handlers
 *
 * Thin layer: validate → call analyticsService → respond.
 * All real logic lives in analyticsService.js.
 *
 * Routes (defined in routes/analytics.js):
 *   GET /api/v1/analytics/dashboard   — full dashboard in one call
 *   GET /api/v1/analytics/summary     — summary counts + rates only
 *   GET /api/v1/analytics/agents      — per-agent breakdown
 *   GET /api/v1/analytics/confidence  — confidence statistics
 *   GET /api/v1/analytics/insights    — creator insights + weekly trend
 */

'use strict';

const analyticsService = require('../services/analyticsService');
const asyncHandler     = require('../middleware/asyncHandler');

// ── GET /api/v1/analytics/dashboard ──────────────────────────────────────────
/**
 * Returns all four analytics datasets in a single response.
 * This is the primary endpoint used by the Analytics Dashboard page.
 */
const getDashboard = asyncHandler(async function(req, res) {
  const data = await analyticsService.getFullDashboard();
  res.json({ success: true, data });
});

// ── GET /api/v1/analytics/summary ────────────────────────────────────────────
const getSummary = asyncHandler(async function(req, res) {
  const data = await analyticsService.getSummaryStats();
  res.json({ success: true, data });
});

// ── GET /api/v1/analytics/agents ─────────────────────────────────────────────
const getAgents = asyncHandler(async function(req, res) {
  const data = await analyticsService.getAgentBreakdown();
  res.json({ success: true, data });
});

// ── GET /api/v1/analytics/confidence ─────────────────────────────────────────
const getConfidence = asyncHandler(async function(req, res) {
  const data = await analyticsService.getConfidenceStats();
  res.json({ success: true, data });
});

// ── GET /api/v1/analytics/insights ───────────────────────────────────────────
const getInsights = asyncHandler(async function(req, res) {
  const data = await analyticsService.getCreatorInsights();
  res.json({ success: true, data });
});

module.exports = {
  getDashboard,
  getSummary,
  getAgents,
  getConfidence,
  getInsights,
};

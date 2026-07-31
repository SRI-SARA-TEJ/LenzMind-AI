/**
 * controllers/recommendationController.js
 *
 * HTTP boundary for all recommendation operations:
 *  GET    /:projectId         — fetch stored recommendations for a project
 *  PATCH  /:id/action         — user accepts or dismisses a recommendation
 *  POST   /analyze/:projectId — trigger AI analysis for all project assets
 *  POST   /analyze-asset      — trigger AI analysis for a single asset
 */

'use strict';

const asyncHandler          = require('../middleware/asyncHandler');
const recommendationService = require('../services/recommendationService');

// ── Fetch stored recommendations for a project ────────────────────────────────
const getRecommendations = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const recs = await recommendationService.getRecommendationsForProject(projectId);
  res.json({ success: true, count: recs.length, data: recs });
});

// ── User accepts or dismisses a recommendation ────────────────────────────────
const respondToRecommendation = asyncHandler(async (req, res) => {
  const { id }     = req.params;
  const { action } = req.body; // 'accepted' | 'dismissed'
  const rec = await recommendationService.updateUserAction(id, action);
  res.json({ success: true, data: rec });
});

// ── Trigger AI analysis for all assets in a project ───────────────────────────
// POST /api/v1/recommendations/analyze/:projectId
const analyzeProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const saved = await recommendationService.runAnalysisForProject(projectId);
  res.status(201).json({
    success: true,
    count:   saved.length,
    message: saved.length === 0
      ? 'No assets found in this project to analyze.'
      : `Analysis complete. ${saved.length} recommendation(s) generated.`,
    data: saved,
  });
});

// ── Trigger AI analysis for a single asset ────────────────────────────────────
// POST /api/v1/recommendations/analyze-asset
// Body: { projectId: string, asset: { url, mimeType, filename, originalName } }
const analyzeAsset = asyncHandler(async (req, res) => {
  const { projectId, asset } = req.body;

  if (!projectId) {
    const err = new Error('projectId is required');
    err.statusCode = 400;
    throw err;
  }
  if (!asset || !asset.url) {
    const err = new Error('asset with a url is required');
    err.statusCode = 400;
    throw err;
  }

  const saved = await recommendationService.runAnalysisForAsset(projectId, asset);
  res.status(201).json({
    success: true,
    count:   saved.length,
    message: `Analysis complete. ${saved.length} recommendation(s) generated.`,
    data:    saved,
  });
});

module.exports = {
  getRecommendations,
  respondToRecommendation,
  analyzeProject,
  analyzeAsset,
};

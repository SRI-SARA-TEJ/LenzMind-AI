/**
 * routes/recommendations.js — AI Recommendation Routes
 *
 * GET   /api/v1/recommendations/:projectId        → get stored recs for a project
 * PATCH /api/v1/recommendations/:id/action        → user accepts or dismisses
 * POST  /api/v1/recommendations/analyze/:projectId → run AI on all project assets
 * POST  /api/v1/recommendations/analyze-asset      → run AI on a single asset
 *
 * Route ordering: literal paths (/analyze-asset, /analyze/:id) are declared
 * before the wildcard (/:projectId) so Express matches them correctly.
 */

const express    = require('express');
const controller = require('../controllers/recommendationController');
const router     = express.Router();

// Literal routes first — must precede /:projectId wildcard
router.post('/analyze-asset',          controller.analyzeAsset);
router.post('/analyze/:projectId',     controller.analyzeProject);

// Parameterized routes
router.get('/:projectId',              controller.getRecommendations);
router.patch('/:id/action',            controller.respondToRecommendation);

module.exports = router;

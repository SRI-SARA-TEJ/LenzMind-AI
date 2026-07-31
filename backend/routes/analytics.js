/**
 * routes/analytics.js — Analytics Routes
 *
 * All read-only GET endpoints.  No writes — analytics is purely observational.
 *
 *   GET /api/v1/analytics/dashboard   → analyticsController.getDashboard
 *   GET /api/v1/analytics/summary     → analyticsController.getSummary
 *   GET /api/v1/analytics/agents      → analyticsController.getAgents
 *   GET /api/v1/analytics/confidence  → analyticsController.getConfidence
 *   GET /api/v1/analytics/insights    → analyticsController.getInsights
 */

'use strict';

const { Router } = require('express');
const controller = require('../controllers/analyticsController');

const router = Router();

router.get('/dashboard',  controller.getDashboard);
router.get('/summary',    controller.getSummary);
router.get('/agents',     controller.getAgents);
router.get('/confidence', controller.getConfidence);
router.get('/insights',   controller.getInsights);

module.exports = router;

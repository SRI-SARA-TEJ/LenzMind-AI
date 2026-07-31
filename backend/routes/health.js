/**
 * routes/health.js — Health Check Endpoint
 *
 * GET /api/v1/health
 *
 * Used by load balancers, monitoring tools, and developers to confirm
 * the server is alive. Returns basic server info and timestamp.
 */

const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'AI Creator OS API is running',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

/**
 * routes/uploads.js — File Upload Routes
 *
 * POST /api/v1/uploads   → upload a file and attach it to a project
 *   Body: multipart/form-data
 *     - file      (required) — the file binary
 *     - projectId (required) — project to attach the asset to
 */

const express    = require('express');
const controller = require('../controllers/uploadController');
const router     = express.Router();

router.post('/', controller.uploadFile);

module.exports = router;

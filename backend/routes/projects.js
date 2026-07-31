/**
 * routes/projects.js — Project CRUD Routes
 *
 * GET    /api/v1/projects          → list all
 * POST   /api/v1/projects          → create new
 * GET    /api/v1/projects/:id      → get one
 * PUT    /api/v1/projects/:id      → update
 * DELETE /api/v1/projects/:id      → delete
 */

const express    = require('express');
const controller = require('../controllers/projectController');
const router     = express.Router();

router.get('/',     controller.listProjects);
router.post('/',    controller.createProject);
router.get('/:id',  controller.getProject);
router.put('/:id',  controller.updateProject);
router.delete('/:id', controller.deleteProject);

module.exports = router;

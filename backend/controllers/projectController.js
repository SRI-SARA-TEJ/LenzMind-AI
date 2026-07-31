/**
 * controllers/projectController.js
 *
 * Handles HTTP request/response for project operations.
 * All business logic is delegated to projectService.
 * All async errors are caught by the asyncHandler wrapper.
 */

const asyncHandler    = require('../middleware/asyncHandler');
const projectService  = require('../services/projectService');

const listProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getAllProjects();
  res.json({ success: true, count: projects.length, data: projects });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  res.json({ success: true, data: project });
});

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body);
  res.status(201).json({ success: true, data: project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);
  res.json({ success: true, data: project });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id);
  res.json({ success: true, message: 'Project deleted' });
});

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};

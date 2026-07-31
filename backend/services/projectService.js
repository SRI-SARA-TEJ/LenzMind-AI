/**
 * services/projectService.js — Project Business Logic
 *
 * Services sit between controllers and models.
 * Controllers handle HTTP; services handle business rules.
 * This separation makes logic testable without spinning up an Express server.
 */

const Project = require('../models/Project');

// ── List all projects (newest first) ─────────────────────────────────────────
async function getAllProjects() {
  return Project.find({})
    .select('title description contentType status assets createdAt updatedAt')
    .sort({ updatedAt: -1 });
}

// ── Get a single project by ID ────────────────────────────────────────────────
async function getProjectById(id) {
  const project = await Project.findById(id);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  return project;
}

// ── Create a new project ──────────────────────────────────────────────────────
async function createProject(data) {
  const project = new Project({
    title:       data.title,
    description: data.description,
    contentType: data.contentType || 'mixed',
  });
  return project.save();
}

// ── Update project fields ─────────────────────────────────────────────────────
async function updateProject(id, data) {
  const allowed = ['title', 'description', 'contentType', 'status'];
  const update  = {};
  allowed.forEach((key) => { if (data[key] !== undefined) update[key] = data[key]; });

  const project = await Project.findByIdAndUpdate(id, update, {
    new: true,           // return the updated document
    runValidators: true, // enforce schema validations on update
  });

  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  return project;
}

// ── Attach an uploaded asset to a project ────────────────────────────────────
async function addAssetToProject(id, assetData) {
  const project = await getProjectById(id);
  project.assets.push(assetData);
  project.status = 'in-progress';
  return project.save();
}

// ── Delete a project ──────────────────────────────────────────────────────────
async function deleteProject(id) {
  const project = await Project.findByIdAndDelete(id);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  return project;
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  addAssetToProject,
  deleteProject,
};

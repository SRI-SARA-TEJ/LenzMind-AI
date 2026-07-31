/**
 * services/api.js — Backend API Client
 *
 * All HTTP calls are centralised here.
 * Components and context never call fetch() directly — they call this module.
 *
 * This pattern means:
 *  1. Changing the API base URL requires editing one file.
 *  2. Adding auth headers later requires editing one file.
 *  3. API calls read like plain English: api.getProjects(), api.createProject()
 */

const BASE_URL = '/api/v1';

// ── Shared fetch wrapper ──────────────────────────────────────────────────────
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || `API error: ${response.status}`);
  }

  return json;
}

// ── Projects ──────────────────────────────────────────────────────────────────
export async function getProjects() {
  const res = await request('/projects');
  return res.data;
}

export async function getProject(id) {
  const res = await request(`/projects/${id}`);
  return res.data;
}

export async function createProject(data) {
  const res = await request('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateProject(id, data) {
  const res = await request(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

// ── File Uploads ──────────────────────────────────────────────────────────────
// Note: upload uses FormData (not JSON) so we omit Content-Type header
// and let the browser set it with the correct multipart boundary.
export async function uploadFile(projectId, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);

  const response = await fetch(`${BASE_URL}/uploads`, {
    method: 'POST',
    body: formData,
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.message || 'Upload failed');
  return json;
}

// ── Recommendations ───────────────────────────────────────────────────────────
export async function getRecommendations(projectId) {
  const res = await request(`/recommendations/${projectId}`);
  return res.data;
}

export async function respondToRecommendation(id, action) {
  const res = await request(`/recommendations/${id}/action`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  return res.data;
}

// Trigger AI analysis for every asset in a project.
// Returns the newly created recommendation documents.
export async function analyzeProject(projectId) {
  const res = await request(`/recommendations/analyze/${projectId}`, {
    method: 'POST',
  });
  return res; // { success, count, message, data }
}

// Trigger AI analysis for a single asset.
// asset: { url, mimeType, filename, originalName }
export async function analyzeAsset(projectId, asset) {
  const res = await request('/recommendations/analyze-asset', {
    method: 'POST',
    body: JSON.stringify({ projectId, asset }),
  });
  return res; // { success, count, message, data }
}

// ── Analytics ─────────────────────────────────────────────────────────────────
// Returns the full analytics dashboard payload:
//   { summary, agents, confidence, insights }
export async function getAnalyticsDashboard() {
  const res = await request('/analytics/dashboard');
  return res.data;
}

// ── Health ────────────────────────────────────────────────────────────────────
export async function checkHealth() {
  return request('/health');
}

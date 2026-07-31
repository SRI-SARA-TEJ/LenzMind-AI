/**
 * services/agentOrchestrator.js — Agent Orchestration Layer
 *
 * The orchestrator decides WHICH agents run for a given context and fans out
 * calls to them in parallel. Results are returned to the caller (typically
 * recommendationService) for persistence.
 *
 * Responsibilities:
 *  - Route assets to the right agents based on content type / MIME type.
 *  - Run agents in parallel (Promise.allSettled — one agent failing never
 *    blocks the others).
 *  - Normalize every agent result into the recommendationService shape.
 *  - Log which agents ran, how long they took, and their status.
 *
 * Adding a new agent:
 *  1. Import it here.
 *  2. Add a routing rule in _selectAgentsForAsset() or _selectAgentsForProject().
 *  3. No changes needed anywhere else.
 */

'use strict';

// ── Agent imports ─────────────────────────────────────────────────────────────
const cameraIntelligenceAgent    = require('../agents/cameraIntelligence');
const editingIntelligenceAgent   = require('../agents/editingIntelligence');
const contentOptimizationAgent   = require('../agents/contentOptimization');
const creatorMemoryAgent         = require('../agents/creatorMemory');
// Uncomment as each agent is implemented:
// const analyticsAgent           = require('../agents/analytics');

// ── Routing helpers ───────────────────────────────────────────────────────────

/** MIME type prefixes that the Camera Intelligence Agent can handle. */
const VISUAL_MIME_PREFIXES = ['image/', 'video/'];

function isVisualAsset(asset) {
  if (!asset.mimeType) return true; // assume visual if unknown
  return VISUAL_MIME_PREFIXES.some((prefix) => asset.mimeType.startsWith(prefix));
}

/**
 * Return the list of agents to run for a single asset.
 * Extend this function as more agents come online.
 */
function _selectAgentsForAsset(asset) {
  const agents = [];
  if (isVisualAsset(asset)) {
    agents.push(cameraIntelligenceAgent);
    agents.push(editingIntelligenceAgent);
    agents.push(contentOptimizationAgent);
  }
  return agents;
}

// ── Core orchestration ────────────────────────────────────────────────────────

/**
 * Run all relevant agents against a single asset.
 *
 * @param {object} asset     — asset subdocument from the Project model
 * @param {string} projectId — parent project's _id (string)
 * @returns {Promise<AgentResult[]>}
 *
 * @typedef {{
 *   agentType:   string,
 *   title:       string,
 *   explanation: string,
 *   confidence:  number|null,
 *   tags:        string[],
 *   status:      'ok'|'mock'|'error',
 *   projectId:   string,
 *   details:     object,
 *   durationMs:  number,
 * }} AgentResult
 */
async function analyzeAsset(asset, projectId) {
  const agents  = _selectAgentsForAsset(asset);

  if (agents.length === 0) {
    console.log(`[orchestrator] No agents selected for asset "${asset.filename}" (${asset.mimeType})`);
    return [];
  }

  console.log(`[orchestrator] Running ${agents.length} agent(s) for asset "${asset.filename}"`);

  const settled = await Promise.allSettled(
    agents.map((agent) => _runWithTiming(agent, asset)),
  );

  const results = [];

  settled.forEach((outcome, i) => {
    const agentName = agents[i].name;
    if (outcome.status === 'fulfilled') {
      const result = outcome.value;
      console.log(`[orchestrator] ${agentName} → status=${result.status} (${result.durationMs}ms)`);
      results.push({ ...result, projectId });
    } else {
      // Promise.allSettled should not hit this branch because agents always
      // resolve, but we handle it defensively.
      console.error(`[orchestrator] ${agentName} rejected unexpectedly:`, outcome.reason);
      results.push({
        agentType:   agents[i].agentType,
        title:       `${agentName} failed`,
        explanation: `Unexpected orchestrator-level error: ${outcome.reason?.message ?? 'unknown'}`,
        confidence:  null,
        tags:        ['error'],
        status:      'error',
        projectId,
        details:     { error: String(outcome.reason) },
        durationMs:  0,
      });
    }
  });

  return results;
}

/**
 * Convenience wrapper — run all agents against every asset in a project,
 * then run the Creator Memory Agent once at project level.
 *
 * The Creator Memory Agent runs after per-asset agents so it can be given
 * the full asset-level context if needed in the future.  It always runs
 * once per project analysis, regardless of asset count, because its input
 * is the creator's historical decision record — not any individual asset.
 *
 * @param {object} project — full Project mongoose document
 * @returns {Promise<AgentResult[]>}
 */
async function analyzeProject(project) {
  const projectId = project._id.toString();
  const results   = [];

  // ── Per-asset agents (camera, editing, content-optimization) ──────────────
  if (project.assets && project.assets.length > 0) {
    const perAsset = await Promise.all(
      project.assets.map((asset) => analyzeAsset(asset, projectId)),
    );
    results.push(...perAsset.flat());
  } else {
    console.log(`[orchestrator] Project "${projectId}" has no assets — skipping per-asset agents.`);
  }

  // ── Project-level agent: Creator Memory ───────────────────────────────────
  // Runs once per project regardless of asset count.
  // Passes { project } context; the agent fetches its own history internally.
  console.log(`[orchestrator] Running Creator Memory Agent for project "${projectId}"`);
  const memoryOutcome = await Promise.allSettled([
    _runWithTiming(creatorMemoryAgent, { project }),
  ]);

  memoryOutcome.forEach((outcome) => {
    if (outcome.status === 'fulfilled') {
      const result = outcome.value;
      console.log(`[orchestrator] ${creatorMemoryAgent.name} → status=${result.status} (${result.durationMs}ms)`);
      results.push({ ...result, projectId });
    } else {
      console.error(`[orchestrator] ${creatorMemoryAgent.name} rejected unexpectedly:`, outcome.reason);
      results.push({
        agentType:   creatorMemoryAgent.agentType,
        title:       creatorMemoryAgent.name + ' failed',
        explanation: 'Unexpected orchestrator-level error: ' + (outcome.reason?.message ?? 'unknown'),
        confidence:  null,
        tags:        ['error'],
        status:      'error',
        projectId,
        details:     { error: String(outcome.reason) },
        durationMs:  0,
      });
    }
  });

  return results;
}

// ── Internal timing wrapper ───────────────────────────────────────────────────

async function _runWithTiming(agent, asset) {
  const start  = Date.now();
  const result = await agent.analyze(asset);
  return { ...result, durationMs: Date.now() - start };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = { analyzeAsset, analyzeProject };

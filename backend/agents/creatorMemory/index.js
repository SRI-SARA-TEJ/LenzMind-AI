/**
 * agents/creatorMemory/index.js — Creator Memory Agent
 *
 * Learns from a creator's decision history across all their projects to
 * surface personalised suggestions: which recommendation types they tend to
 * accept or dismiss, what content style they favour, which platforms they
 * prefer, and how their editing decisions have evolved over time.
 *
 * Architectural difference from the other agents:
 *   Camera, Editing, and Content agents analyse a single *asset* in isolation.
 *   Creator Memory analyses the creator's *full decision history across
 *   all projects*.  It therefore runs once per project analysis (not once
 *   per asset) and receives a richer context object instead of just an asset.
 *
 * Input (via analyze(context)):
 *   context.project    — the current Project document
 *   context.history    — past Recommendation documents (all projects, all agents)
 *
 * Google Gemini AI integration:
 *   Uses aiService.generateText() (Gemini 1.5 Flash).  The agent builds a
 *   compact plain-text summary of decision history and asks the model to
 *   identify patterns and recommend personalised guidance.  When
 *   GEMINI_API_KEY is unset, aiService returns a clearly-labelled mock so
 *   the full stack keeps working without credentials.
 *
 * Design principles:
 *   - Users must be able to inspect and delete their memory (future work —
 *     the data already lives transparently in MongoDB Recommendation docs).
 *   - requiresApproval is always true — no preference is applied automatically.
 *   - The agent gracefully handles the case where there is no prior history.
 *
 * To activate real analysis:
 *   1. Get a free key at https://aistudio.google.com/app/apikey
 *   2. Set GEMINI_API_KEY in Render environment variables
 *
 * Data flow:
 *   agentOrchestrator.analyzeProject()
 *     → creatorMemoryAgent.analyze({ project, history })
 *     → aiService.generateText(systemPrompt, userPrompt)
 *     → recommendationService.createRecommendation()
 */

'use strict';

const Recommendation = require('../../models/Recommendation');
const aiService      = require('../../services/aiService');

// ── History fetch limit ───────────────────────────────────────────────────────
// Cap how many past decisions we load to keep prompts reasonable in size.
// Newer decisions are more relevant — sort descending by createdAt.
const HISTORY_LIMIT = 50;

// ── Prompt templates ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a personalised creative advisor who has studied a
creator's complete history of accepted and dismissed AI suggestions.

Using the provided decision history, identify patterns and generate personalised
guidance that will help this creator improve their work over time.

Always respond ONLY with valid JSON matching this exact structure — no extra text:

{
  "acceptancePattern": {
    "summary": "one sentence describing what types of suggestions this creator usually accepts",
    "reason":  "one sentence explaining why this pattern matters"
  },
  "dismissalPattern": {
    "summary": "one sentence describing what types of suggestions this creator usually dismisses",
    "reason":  "one sentence explaining what this reveals about their style"
  },
  "stylePreference": {
    "summary": "one sentence describing the creator's inferred content style preference",
    "reason":  "one sentence explaining the evidence"
  },
  "platformPreference": {
    "summary": "one sentence naming the platform(s) this creator appears to favour",
    "reason":  "one sentence explaining why"
  },
  "nextActionAdvice": {
    "advice": "one specific, actionable recommendation for the creator's next project",
    "reason": "one sentence explaining why this will help based on their history"
  },
  "overallScore": 0.0,
  "topInsight": "short label for the single most valuable personalised insight",
  "explanation": "two sentences a non-expert creator can understand",
  "requiresApproval": true
}

Rules:
- overallScore is 0.0–1.0 representing how confident you are in the pattern (higher = stronger signal in the data).
- requiresApproval must always be true.
- If there is insufficient history (fewer than 3 decisions), set overallScore to 0.2 and explain that more data is needed.
- Base every insight strictly on the provided history — do not invent patterns.`;

/**
 * Build a compact history summary the model can reason over.
 * We keep it tight: agent type, title (truncated), and user action.
 * Full explanation text is omitted to keep prompt size manageable.
 */
function _summariseHistory(history) {
  if (!history || history.length === 0) {
    return 'No previous recommendation decisions found.';
  }

  const lines = history.map(function(rec) {
    const title  = (rec.title || 'untitled').substring(0, 80);
    const action = rec.userAction || 'pending';
    const agent  = rec.agentType  || 'unknown';
    return '- [' + agent + '] "' + title + '" → ' + action;
  });

  return (
    'Past recommendation decisions (' + history.length + ' total):\n' +
    lines.join('\n')
  );
}

function buildUserPrompt(project, history) {
  const projectName = project.title || 'unnamed project';
  const contentType = project.contentType || 'mixed';
  const historySummary = _summariseHistory(history);

  return (
    'Analyse this creator\'s history and generate personalised guidance.\n' +
    'Current project: "' + projectName + '" (' + contentType + ' content)\n\n' +
    historySummary
  );
}

// ── Tag derivation ────────────────────────────────────────────────────────────

function _deriveTags(parsed, history) {
  const tags = ['creator-memory', 'personalised'];

  if (parsed.platformPreference && parsed.platformPreference.summary) {
    // Extract platform name from summary if present (e.g. "instagram")
    const platforms = ['instagram', 'youtube', 'tiktok', 'linkedin', 'twitter'];
    const found = platforms.find(function(p) {
      return parsed.platformPreference.summary.toLowerCase().indexOf(p) !== -1;
    });
    if (found) tags.push(found);
  }

  if (history && history.length >= 10) tags.push('strong-signal');
  else if (history && history.length >= 3)  tags.push('early-signal');
  else tags.push('insufficient-data');

  return tags;
}

// ── Agent class ───────────────────────────────────────────────────────────────

class CreatorMemoryAgent {
  constructor() {
    this.name      = 'Creator Memory Agent';
    this.agentType = 'creator-memory';
  }

  /**
   * Fetch the creator's decision history, then analyse it to produce
   * personalised suggestions for the current project.
   *
   * Always resolves (never throws) so the orchestrator can fan-out safely.
   *
   * @param {object} context
   * @param {object} context.project  — current Project document
   * @param {Array}  [context.history] — pre-fetched history (optional;
   *                                     fetched internally when omitted)
   * @returns {Promise<AgentResult>}
   */
  async analyze(context) {
    // Support being called with a plain asset (orchestrator default path)
    // or with the richer { project, history } context object.
    // When called with just an asset (shouldn't happen, but defensive):
    const project = context && context.project ? context.project : context;
    let   history = context && context.history  ? context.history  : null;

    try {
      // Fetch history lazily if not provided by the caller.
      if (!history) {
        history = await this._fetchHistory(project._id);
      }

      const aiResponse = await aiService.generateText(
        SYSTEM_PROMPT,
        buildUserPrompt(project, history),
        { maxTokens: 700, temperature: 0.35 },
      );

      const isMock = aiResponse.raw && aiResponse.raw.mock === true;
      if (isMock) {
        return this._mockResult(project, history);
      }

      const parsed = this._parseModelOutput(aiResponse.text);

      return {
        status:           'ok',
        agentType:        this.agentType,
        title:            parsed.topInsight
                            ? 'Memory: ' + parsed.topInsight
                            : 'Creator pattern analysis complete',
        explanation:      parsed.explanation || aiResponse.text,
        confidence:       parsed.overallScore != null ? parsed.overallScore : aiResponse.confidence,
        tags:             _deriveTags(parsed, history),
        requiresApproval: true,
        details:          parsed,
      };
    } catch (err) {
      return {
        status:           'error',
        agentType:        this.agentType,
        title:            'Creator Memory analysis failed',
        explanation:      'The creator memory agent encountered an error: ' + err.message,
        confidence:       null,
        tags:             ['error'],
        requiresApproval: true,
        details:          { error: err.message },
      };
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Fetch the most recent resolved (non-pending) recommendations across all
   * projects.  We exclude pending items because they haven't been acted on yet
   * and carry no signal about the creator's preferences.
   *
   * Does NOT filter by projectId — Creator Memory is cross-project by design.
   * Uses the existing Recommendation model; no new collection needed.
   */
  async _fetchHistory(currentProjectId) {
    void currentProjectId; // retained for future per-project scoping
    return Recommendation.find({
      userAction: { $in: ['accepted', 'dismissed'] },
      agentType:  { $ne:  'creator-memory' },  // exclude our own past outputs
    })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .select('agentType title userAction createdAt')
      .lean();
  }

  /**
   * Parse the JSON the model was prompted to emit.
   * Strips markdown code fences if present; falls back gracefully.
   */
  _parseModelOutput(text) {
    try {
      const cleaned = text
        .replace(/^```(?:json)?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim();
      return JSON.parse(cleaned);
    } catch (_) {
      return {
        explanation:      text,
        overallScore:     null,
        topInsight:       null,
        requiresApproval: true,
      };
    }
  }

  /**
   * Mock result returned when watsonx.ai is not configured.
   * Clearly labelled — never mistaken for real output.
   * Reflects actual history size so the mock is informative.
   */
  _mockResult(project, history) {
    const count       = history ? history.length : 0;
    const projectName = (project && project.title) ? project.title : 'this project';
    const historyNote = count > 0
      ? count + ' past decision' + (count !== 1 ? 's' : '') + ' found in history.'
      : 'No past decisions found yet — run analysis on more projects to build history.';

    return {
      status:           'mock',
      agentType:        this.agentType,
      title:            'Creator patterns (mock — watsonx.ai not configured)',
      explanation:      'Mock memory analysis for "' + projectName + '". ' +
                        historyNote + ' Set WATSONX_API_KEY in .env to enable real IBM watsonx.ai personalisation.',
      confidence:       null,
      tags:             count >= 10 ? ['mock', 'creator-memory', 'personalised', 'strong-signal']
                      : count >= 3  ? ['mock', 'creator-memory', 'personalised', 'early-signal']
                      :               ['mock', 'creator-memory', 'personalised', 'insufficient-data'],
      requiresApproval: true,
      details:          { mock: true, historyCount: count },
    };
  }
}

module.exports = new CreatorMemoryAgent();

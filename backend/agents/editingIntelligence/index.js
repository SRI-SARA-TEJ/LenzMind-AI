/**
 * agents/editingIntelligence/index.js — Editing Intelligence Agent
 *
 * Generates structured post-production editing recommendations for a media
 * asset: brightness, contrast, crop, colour enhancement, sharpness, and
 * workflow guidance.
 *
 * Google Gemini AI integration:
 *   Uses aiService.generateText() (Gemini 1.5 Flash) to reason about how
 *   the asset should be edited based on its metadata and type.  When
 *   GEMINI_API_KEY is not set, aiService returns a clearly-labelled mock
 *   so the full stack keeps working end-to-end.
 *
 * To activate real analysis:
 *   1. Get a free key at https://aistudio.google.com/app/apikey
 *   2. Set GEMINI_API_KEY in Render environment variables
 *
 * Data flow:
 *   agentOrchestrator.analyzeAsset()
 *     → editingIntelligenceAgent.analyze(asset)
 *     → aiService.generateText(systemPrompt, userPrompt)
 *     → recommendationService.createRecommendation()
 *
 * requiresApproval is always true — no edit is applied automatically.
 */

'use strict';

const aiService = require('../../services/aiService');

// ── Prompt templates ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional photo and video editing consultant.
Your task is to suggest specific, actionable post-production edits for a media asset.

Always respond ONLY with valid JSON matching this exact structure — no extra text:

{
  "brightness":  { "adjustment": "-10 to +10 EV", "reason": "one sentence why" },
  "contrast":    { "adjustment": "description",    "reason": "one sentence why" },
  "crop":        { "suggestion": "description",    "reason": "one sentence why" },
  "colorGrade":  { "suggestion": "description",    "reason": "one sentence why" },
  "sharpness":   { "suggestion": "description",    "reason": "one sentence why" },
  "workflow":    { "advice": "one workflow tip",   "reason": "one sentence why" },
  "overallScore": 0.0,
  "topSuggestion": "short label for the single highest-impact edit",
  "explanation": "two sentences a non-expert can understand",
  "requiresApproval": true
}

Rules:
- overallScore is 0.0–1.0 representing how much editing improvement is possible (higher = more room to improve).
- requiresApproval must always be true — no edit is ever applied automatically.
- Keep every suggestion concrete and specific, not generic.`;

function buildUserPrompt(asset) {
  const type = asset.mimeType || 'unknown type';
  const name = asset.originalName || asset.filename || 'unknown file';
  return (
    `Suggest editing improvements for this asset.\n` +
    `File: "${name}"\n` +
    `Type: ${type}\n` +
    `URL: ${asset.url}\n\n` +
    `Provide specific, actionable editing recommendations based on the file type and name.`
  );
}

// ── Editing dimension tags ────────────────────────────────────────────────────

/** Derive UI tags from the dimensions that the model flagged as needing work. */
function _deriveTags(parsed) {
  const tags = ['editing'];

  // Flag dimensions that carry explicit suggestions (not just generic defaults)
  const dimensions = {
    brightness: parsed.brightness?.adjustment,
    contrast:   parsed.contrast?.adjustment,
    crop:       parsed.crop?.suggestion,
    colorGrade: parsed.colorGrade?.suggestion,
    sharpness:  parsed.sharpness?.suggestion,
  };

  for (const [dim, value] of Object.entries(dimensions)) {
    if (value && typeof value === 'string' && value.trim().length > 0) {
      tags.push(dim.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase());
    }
  }

  return tags;
}

// ── Agent class ───────────────────────────────────────────────────────────────

class EditingIntelligenceAgent {
  constructor() {
    this.name      = 'Editing Intelligence Agent';
    this.agentType = 'editing-intelligence';
  }

  /**
   * Analyze a media asset and return structured editing recommendations.
   *
   * Always resolves (never throws) so the orchestrator can fan-out safely.
   * Errors are captured in the result shape via `status: 'error'`.
   *
   * @param {object} asset — asset subdocument from the Project model
   * @param {string} asset.url
   * @param {string} [asset.mimeType]
   * @param {string} [asset.originalName]
   * @param {string} [asset.filename]
   * @returns {Promise<{
   *   status:           'ok'|'mock'|'error',
   *   agentType:        string,
   *   title:            string,
   *   explanation:      string,
   *   confidence:       number|null,
   *   tags:             string[],
   *   requiresApproval: true,
   *   details:          object,
   * }>}
   */
  async analyze(asset) {
    try {
      const aiResponse = await aiService.generateText(
        SYSTEM_PROMPT,
        buildUserPrompt(asset),
        { maxTokens: 600, temperature: 0.3 },
      );

      // aiService returns raw.mock === true when watsonx.ai is not configured.
      const isMock = aiResponse.raw && aiResponse.raw.mock === true;

      if (isMock) {
        return this._mockResult(asset);
      }

      const parsed = this._parseModelOutput(aiResponse.text);

      return {
        status:           'ok',
        agentType:        this.agentType,
        title:            parsed.topSuggestion
                            ? `Editing: ${parsed.topSuggestion}`
                            : 'Editing suggestions ready',
        explanation:      parsed.explanation || aiResponse.text,
        confidence:       parsed.overallScore ?? aiResponse.confidence,
        tags:             _deriveTags(parsed),
        requiresApproval: true,
        details:          parsed,
      };
    } catch (err) {
      return {
        status:           'error',
        agentType:        this.agentType,
        title:            'Editing analysis failed',
        explanation:      `The editing intelligence agent encountered an error: ${err.message}`,
        confidence:       null,
        tags:             ['error'],
        requiresApproval: true,
        details:          { error: err.message },
      };
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

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
    } catch {
      return {
        explanation:      text,
        overallScore:     null,
        topSuggestion:    null,
        requiresApproval: true,
      };
    }
  }

  /**
   * Mock result returned when watsonx.ai is not configured.
   * Labelled clearly — never mistaken for real analysis output.
   */
  _mockResult(asset) {
    const name = asset.originalName || asset.filename || 'asset';
    return {
      status:           'mock',
      agentType:        this.agentType,
      title:            'Editing suggestions (mock — watsonx.ai not configured)',
      explanation:      `Mock result for "${name}". Set WATSONX_API_KEY in .env to enable real IBM watsonx.ai editing analysis.`,
      confidence:       null,
      tags:             ['mock', 'editing'],
      requiresApproval: true,
      details:          { mock: true },
    };
  }
}

module.exports = new EditingIntelligenceAgent();

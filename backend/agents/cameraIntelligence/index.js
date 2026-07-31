/**
 * agents/cameraIntelligence/index.js — Camera Intelligence Agent
 *
 * Analyzes photo/video technical quality: sharpness, exposure, noise,
 * focus accuracy, and lens distortion.
 *
 * IBM watsonx.ai integration:
 *   This agent calls aiService.analyzeImage() which proxies to the
 *   watsonx.ai Vision model (granite-vision). When WATSONX_API_KEY is not
 *   set, aiService returns a clearly-labelled mock response so the rest of
 *   the stack (orchestrator, recommendationService, controllers) keeps
 *   working end-to-end.
 *
 * To activate real analysis:
 *   1. Set WATSONX_API_KEY, WATSONX_PROJECT_ID, WATSONX_URL in .env
 *   2. npm install @ibm-cloud/watsonx-ai
 *   3. Uncomment the WatsonXAI client lines in services/aiService.js
 *
 * Data flow:
 *   uploadController  →  agentOrchestrator.analyzeAsset()
 *                     →  cameraIntelligenceAgent.analyze(asset)
 *                     →  aiService.analyzeImage()
 *                     →  recommendationService.createRecommendation()
 */

'use strict';

const aiService = require('../../services/aiService');

// ── Prompt templates ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional camera and photography technical analyst.
Evaluate the provided media asset for technical quality. Always respond in the following
JSON structure — no extra text outside the JSON:

{
  "sharpness":    { "score": 0.0-1.0, "note": "one sentence" },
  "exposure":     { "score": 0.0-1.0, "note": "one sentence" },
  "noise":        { "score": 0.0-1.0, "note": "one sentence" },
  "composition":  { "score": 0.0-1.0, "note": "one sentence" },
  "overallScore": 0.0-1.0,
  "topIssue":     "short label for the single most important problem",
  "suggestion":   "one actionable sentence the creator can act on",
  "explanation":  "two-sentence explanation a non-expert can understand"
}`;

function buildUserPrompt(asset) {
  const type = asset.mimeType || 'unknown';
  const name = asset.originalName || asset.filename || 'unknown file';
  return `Analyze this ${type} asset named "${name}". URL: ${asset.url}`;
}

// ── Agent class ───────────────────────────────────────────────────────────────

class CameraIntelligenceAgent {
  constructor() {
    this.name      = 'Camera Intelligence Agent';
    this.agentType = 'camera-intelligence';
  }

  /**
   * Analyze a media asset for camera/technical quality.
   *
   * Always resolves (never throws) so the orchestrator can fan-out safely.
   * Errors are captured into the result shape and surfaced via `status`.
   *
   * @param {object} asset — asset subdocument from the Project model
   * @param {string} asset.url
   * @param {string} [asset.mimeType]
   * @param {string} [asset.originalName]
   * @param {string} [asset.filename]
   * @returns {Promise<{
   *   status: 'ok'|'mock'|'error',
   *   agentType: string,
   *   title: string,
   *   explanation: string,
   *   confidence: number|null,
   *   tags: string[],
   *   details: object
   * }>}
   */
  async analyze(asset) {
    try {
      const aiResponse = await aiService.analyzeImage(
        asset.url,
        buildUserPrompt(asset),
      );

      // If watsonx.ai is not configured, aiService returns a mock response.
      const isMock = aiResponse.raw && aiResponse.raw.mock === true;

      if (isMock) {
        return this._mockResult(asset);
      }

      // Parse the structured JSON the model was prompted to emit.
      const parsed = this._parseModelOutput(aiResponse.text);

      return {
        status:      'ok',
        agentType:   this.agentType,
        title:       parsed.topIssue
                       ? `Camera: ${parsed.topIssue}`
                       : 'Camera quality analysis complete',
        explanation: parsed.explanation || aiResponse.text,
        confidence:  parsed.overallScore ?? aiResponse.confidence,
        tags:        this._deriveTags(parsed),
        details:     parsed,
      };
    } catch (err) {
      return {
        status:      'error',
        agentType:   this.agentType,
        title:       'Camera analysis failed',
        explanation: `The camera intelligence agent encountered an error: ${err.message}`,
        confidence:  null,
        tags:        ['error'],
        details:     { error: err.message },
      };
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Try to parse JSON from the model's raw text output.
   * Falls back to wrapping the raw text if parsing fails.
   */
  _parseModelOutput(text) {
    try {
      // The model may wrap the JSON in a markdown code block — strip it.
      const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
      return JSON.parse(cleaned);
    } catch {
      return { explanation: text, overallScore: null, topIssue: null };
    }
  }

  /** Build UI-friendly tags from scored dimensions. */
  _deriveTags(parsed) {
    const tags = ['camera-quality'];
    const dimensions = ['sharpness', 'exposure', 'noise', 'composition'];
    for (const dim of dimensions) {
      if (parsed[dim] && typeof parsed[dim].score === 'number') {
        if (parsed[dim].score < 0.5) tags.push(dim);
      }
    }
    return tags;
  }

  /**
   * Mock result returned when watsonx.ai is not configured.
   * Clearly labelled so it is never mistaken for real analysis.
   */
  _mockResult(asset) {
    const name = asset.originalName || asset.filename || 'asset';
    return {
      status:      'mock',
      agentType:   this.agentType,
      title:       'Camera analysis (mock — watsonx.ai not configured)',
      explanation: `Mock result for "${name}". Set WATSONX_API_KEY in .env to enable real IBM watsonx.ai vision analysis.`,
      confidence:  null,
      tags:        ['mock', 'camera-quality'],
      details:     { mock: true },
    };
  }
}

module.exports = new CameraIntelligenceAgent();

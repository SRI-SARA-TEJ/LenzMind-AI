/**
 * agents/contentOptimization/index.js — Content Optimization Agent
 *
 * Generates structured publishing recommendations for a media asset:
 * caption suggestions, keywords, hashtags, platform selection,
 * audience engagement advice, and posting strategy.
 *
 * Google Gemini AI integration:
 *   Uses aiService.generateText() (Gemini 1.5 Flash) — content optimization
 *   is a language reasoning task, not a vision task.  The agent reasons about
 *   the asset's filename, type, and project context to produce platform-aware
 *   publishing advice.  When GEMINI_API_KEY is unset, aiService returns a
 *   clearly-labelled mock so the full stack keeps working end-to-end.
 *
 * requiresApproval is always true — no content is published automatically.
 *
 * To activate real analysis:
 *   1. Get a free key at https://aistudio.google.com/app/apikey
 *   2. Set GEMINI_API_KEY in Render environment variables
 *
 * Data flow:
 *   agentOrchestrator.analyzeAsset()
 *     → contentOptimizationAgent.analyze(asset)
 *     → aiService.generateText(systemPrompt, userPrompt)
 *     → recommendationService.createRecommendation()
 */

'use strict';

const aiService = require('../../services/aiService');

// ── Prompt templates ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert social media content strategist who helps creators
maximize the reach and engagement of their photo and video content.

Analyze the provided media asset and return publishing recommendations.
Always respond ONLY with valid JSON matching this exact structure — no extra text outside the JSON:

{
  "caption": {
    "suggestion": "a ready-to-use caption under 150 characters",
    "reason": "one sentence explaining why this caption works"
  },
  "keywords": {
    "list": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "reason": "one sentence explaining the keyword strategy"
  },
  "hashtags": {
    "list": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "reason": "one sentence explaining the hashtag selection"
  },
  "platform": {
    "primary": "instagram | youtube | tiktok | linkedin | twitter",
    "reason": "one sentence explaining why this platform fits the content"
  },
  "engagement": {
    "advice": "one concrete audience engagement tip",
    "reason": "one sentence explaining why this drives engagement"
  },
  "postingStrategy": {
    "advice": "specific day and time recommendation with rationale",
    "reason": "one sentence explaining the timing strategy"
  },
  "overallScore": 0.0,
  "topRecommendation": "short label for the single highest-impact publishing action",
  "explanation": "two sentences a non-expert creator can understand",
  "requiresApproval": true
}

Rules:
- overallScore is 0.0–1.0 representing publishing potential (higher = stronger content for social).
- requiresApproval must always be true — no content is ever published automatically.
- Caption must be ready to use, not a generic placeholder.
- Hashtags must start with #.
- Platform must be one of: instagram, youtube, tiktok, linkedin, twitter.`;

function buildUserPrompt(asset) {
  const type = asset.mimeType || 'unknown type';
  const name = asset.originalName || asset.filename || 'unknown file';
  return (
    'Suggest publishing optimizations for this asset.\n' +
    'File: "' + name + '"\n' +
    'Type: ' + type + '\n' +
    'URL: ' + asset.url + '\n\n' +
    'Provide specific, platform-aware publishing recommendations ' +
    'based on the file name, type, and content category you can infer.'
  );
}

// ── Tag derivation ────────────────────────────────────────────────────────────

/**
 * Build UI-friendly tags from the parsed model output.
 * Adds the primary platform as a tag so creators can filter by platform.
 */
function _deriveTags(parsed) {
  const tags = ['content-optimization'];

  if (parsed.platform && parsed.platform.primary) {
    tags.push(parsed.platform.primary);
  }
  if (parsed.hashtags && Array.isArray(parsed.hashtags.list) && parsed.hashtags.list.length > 0) {
    tags.push('hashtags');
  }
  if (parsed.caption && parsed.caption.suggestion) {
    tags.push('caption');
  }
  if (parsed.postingStrategy && parsed.postingStrategy.advice) {
    tags.push('posting-strategy');
  }

  return tags;
}

// ── Agent class ───────────────────────────────────────────────────────────────

class ContentOptimizationAgent {
  constructor() {
    this.name      = 'Content Optimization Agent';
    this.agentType = 'content-optimization';
  }

  /**
   * Analyze a media asset and return structured content publishing recommendations.
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
        { maxTokens: 700, temperature: 0.4 },
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
        title:            parsed.topRecommendation
                            ? 'Optimize: ' + parsed.topRecommendation
                            : 'Content optimization suggestions ready',
        explanation:      parsed.explanation || aiResponse.text,
        confidence:       parsed.overallScore != null ? parsed.overallScore : aiResponse.confidence,
        tags:             _deriveTags(parsed),
        requiresApproval: true,
        details:          parsed,
      };
    } catch (err) {
      return {
        status:           'error',
        agentType:        this.agentType,
        title:            'Content optimization failed',
        explanation:      'The content optimization agent encountered an error: ' + err.message,
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
    } catch (_) {
      return {
        explanation:        text,
        overallScore:       null,
        topRecommendation:  null,
        requiresApproval:   true,
      };
    }
  }

  /**
   * Mock result returned when watsonx.ai is not configured.
   * Clearly labelled — never mistaken for real analysis output.
   */
  _mockResult(asset) {
    const name = asset.originalName || asset.filename || 'asset';
    return {
      status:           'mock',
      agentType:        this.agentType,
      title:            'Content optimization (mock — watsonx.ai not configured)',
      explanation:      'Mock result for "' + name + '". Set WATSONX_API_KEY in .env to enable real IBM watsonx.ai content optimization.',
      confidence:       null,
      tags:             ['mock', 'content-optimization'],
      requiresApproval: true,
      details:          { mock: true },
    };
  }
}

module.exports = new ContentOptimizationAgent();

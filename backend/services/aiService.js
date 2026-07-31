/**
 * services/aiService.js — IBM watsonx.ai Integration Layer
 *
 * This is the single choke-point for every AI model call in the application.
 * Agents NEVER import the watsonx SDK directly — they always go through here.
 *
 * ── Mode selection ────────────────────────────────────────────────────────────
 * LIVE MODE  — all three env vars present (WATSONX_API_KEY, WATSONX_PROJECT_ID,
 *              WATSONX_URL) AND @ibm-cloud/watsonx-ai is installed.
 * MOCK MODE  — any variable missing, or SDK not installed.  Mock responses are
 *              returned immediately; no network calls are made.  The application
 *              runs fully in this mode during development and CI.
 *
 * ── What lives here ───────────────────────────────────────────────────────────
 *  1. Client initialisation (IamAuthenticator + WatsonXAI singleton)
 *  2. generateText()  — text generation via WatsonXAI.textChat()
 *                        (chat API gives cleaner system/user separation)
 *  3. analyzeImage()  — vision integration point for Camera Intelligence Agent
 *                        (uses generateText as the current vision fallback;
 *                         a dedicated multimodal endpoint can be swapped in here
 *                         without touching any agent code)
 *  4. Retry logic     — exponential back-off, configurable attempts
 *  5. Timeout         — per-request AbortSignal / timeLimit parameter
 *  6. Structured logging — request/response metadata to stdout
 *  7. Response parsing — extracts text from both textChat and generateText shapes
 *  8. Mock fallback   — identical response shape, clearly labelled
 *
 * ── SDK response shapes ───────────────────────────────────────────────────────
 *  textChat:    response.result.choices[0].message.content  (string)
 *  generateText: response.result.results[0].generated_text  (string)
 *
 * ── Environment variables ─────────────────────────────────────────────────────
 *  WATSONX_API_KEY         IBM Cloud IAM API key
 *  WATSONX_PROJECT_ID      watsonx.ai project UUID
 *  WATSONX_URL             service URL (default: https://us-south.ml.cloud.ibm.com)
 *  WATSONX_TEXT_MODEL      override default text model ID
 *  WATSONX_VISION_MODEL    override default vision model ID
 *  WATSONX_TIMEOUT_MS      per-request timeout in ms (default: 30000)
 *  WATSONX_MAX_RETRIES     max retry attempts on transient errors (default: 2)
 */

'use strict';

// ── SDK import (guarded) ──────────────────────────────────────────────────────
// We require() inside a try/catch so the app starts cleanly even when the
// SDK is not installed — it just falls into mock mode.
let WatsonXAI        = null;
let IamAuthenticator = null;

try {
  WatsonXAI        = require('@ibm-cloud/watsonx-ai').WatsonXAI;
  IamAuthenticator = require('ibm-cloud-sdk-core').IamAuthenticator;
} catch (_) {
  // SDK not installed — mock mode will be used automatically.
}

// ── Supported model IDs ───────────────────────────────────────────────────────
const MODELS = {
  // Granite 3 — strong instruction-following for agent prompts.
  // Override with WATSONX_TEXT_MODEL env var.
  TEXT:   process.env.WATSONX_TEXT_MODEL   || 'ibm/granite-3-8b-instruct',
  // Granite Vision — image understanding for Camera Intelligence Agent.
  // Override with WATSONX_VISION_MODEL env var.
  VISION: process.env.WATSONX_VISION_MODEL || 'ibm/granite-vision-3-2-2b',
};

// ── Tuning constants (all overridable via env) ────────────────────────────────
const TIMEOUT_MS   = parseInt(process.env.WATSONX_TIMEOUT_MS  || '30000', 10);
const MAX_RETRIES  = parseInt(process.env.WATSONX_MAX_RETRIES || '2',     10);

// Transient HTTP status codes that are safe to retry.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

// ── Runtime mode detection ────────────────────────────────────────────────────
/**
 * Returns true only when all three required env vars are set AND the SDK is
 * available.  This is the single source of truth for mode selection.
 */
function isWatsonxConfigured() {
  return !!(
    WatsonXAI &&
    IamAuthenticator &&
    process.env.WATSONX_API_KEY &&
    process.env.WATSONX_PROJECT_ID &&
    process.env.WATSONX_URL
  );
}

// ── Lazy singleton client ─────────────────────────────────────────────────────
// Initialised once on first real call; reused for every subsequent request.
// Lazy init means the server starts even when credentials are missing.
let _client = null;

function _getClient() {
  if (_client) return _client;

  _client = new WatsonXAI({
    version:       '2024-05-31',
    serviceUrl:    process.env.WATSONX_URL,
    authenticator: new IamAuthenticator({
      apikey: process.env.WATSONX_API_KEY,
    }),
  });

  _log('info', 'WatsonXAI client initialised', {
    serviceUrl: process.env.WATSONX_URL,
    projectId:  process.env.WATSONX_PROJECT_ID,
  });

  return _client;
}

// ── Structured logger ─────────────────────────────────────────────────────────
/**
 * Emits a single-line JSON log entry to stdout.
 * Using JSON makes logs easy to parse in IBM Log Analysis / OpenSearch.
 */
function _log(level, message, meta) {
  const entry = Object.assign(
    { ts: new Date().toISOString(), level, service: 'aiService', message },
    meta || {},
  );
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────
/**
 * Execute `fn` with exponential back-off.
 *
 * Retries only when:
 *  - The error has a status code in RETRYABLE_STATUS, OR
 *  - The error message contains "ECONNRESET", "ETIMEDOUT", or "network"
 *
 * @param {Function} fn          — async function to execute
 * @param {string}   opName      — label for log messages
 * @param {number}   [maxRetries] — override MAX_RETRIES
 * @returns {Promise<any>}
 */
async function _withRetry(fn, opName, maxRetries) {
  const limit = (maxRetries != null) ? maxRetries : MAX_RETRIES;
  let   lastErr;

  for (let attempt = 0; attempt <= limit; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      const isRetryable =
        RETRYABLE_STATUS.has(err.status || err.statusCode) ||
        /ECONNRESET|ETIMEDOUT|network|socket hang up/i.test(err.message || '');

      if (!isRetryable || attempt === limit) break;

      const delayMs = Math.pow(2, attempt) * 500; // 500 ms, 1 s, 2 s …
      _log('warn', opName + ': retrying after ' + delayMs + 'ms', {
        attempt:    attempt + 1,
        maxRetries: limit,
        error:      err.message,
        status:     err.status || err.statusCode,
      });

      await new Promise(function(resolve) { setTimeout(resolve, delayMs); });
    }
  }

  throw lastErr;
}

// ── Core text generation ──────────────────────────────────────────────────────
/**
 * Generate text via IBM watsonx.ai (chat completions API).
 *
 * Uses the `textChat` endpoint which maps cleanly to system + user prompts.
 * Falls back to mock mode transparently when credentials are unavailable.
 *
 * @param {string}   systemPrompt  — agent persona / task framing
 * @param {string}   userPrompt    — dynamic content derived from asset/project
 * @param {object}   [options]
 * @param {string}   [options.modelId]    — override the default text model
 * @param {number}   [options.maxTokens]  — default 512
 * @param {number}   [options.temperature] — default 0.3 (factual)
 * @param {number}   [options.maxRetries] — override MAX_RETRIES
 * @returns {Promise<{text: string, confidence: number|null, raw: object}>}
 */
async function generateText(systemPrompt, userPrompt, options) {
  options = options || {};

  const modelId     = options.modelId     || MODELS.TEXT;
  const maxTokens   = options.maxTokens   || 512;
  const temperature = options.temperature != null ? options.temperature : 0.3;

  if (!isWatsonxConfigured()) {
    _log('debug', 'generateText: mock mode', { modelId });
    return _mockTextResponse(systemPrompt, userPrompt);
  }

  const client    = _getClient();
  const projectId = process.env.WATSONX_PROJECT_ID;
  const startMs   = Date.now();

  _log('info', 'generateText: request', {
    modelId,
    projectId,
    maxTokens,
    temperature,
    promptLength: systemPrompt.length + userPrompt.length,
  });

  try {
    const response = await _withRetry(async function() {
      return client.textChat({
        modelId,
        projectId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        maxTokens,
        temperature,
        timeLimit: TIMEOUT_MS,
      });
    }, 'generateText', options.maxRetries);

    const text = _extractTextChatContent(response);
    const durationMs = Date.now() - startMs;

    _log('info', 'generateText: response', {
      modelId,
      durationMs,
      outputLength: text.length,
      finishReason: _safeGet(response, 'result.choices.0.finish_reason'),
    });

    return {
      text,
      confidence: null, // textChat API does not expose a scalar confidence
      raw:        response.result || response,
    };
  } catch (err) {
    const durationMs = Date.now() - startMs;
    _log('error', 'generateText: failed — falling back to mock', {
      modelId,
      durationMs,
      error:  err.message,
      status: err.status || err.statusCode,
    });

    // Graceful degradation: return a labelled mock rather than crashing the
    // agent.  The agent's own error handler will catch it if this also fails,
    // but returning a mock keeps the orchestrator fan-out intact.
    return _mockTextResponse(systemPrompt, userPrompt, err);
  }
}

// ── Image analysis ────────────────────────────────────────────────────────────
/**
 * Analyze a media asset via IBM watsonx.ai.
 *
 * Current implementation: uses the text-chat endpoint with the vision model
 * and embeds the image URL in the prompt.  When IBM releases a stable
 * multimodal endpoint, swap only the body of this function — no agent changes.
 *
 * @param {string}   imageUrl  — publicly accessible URL or base64 data URI
 * @param {string}   prompt    — task description
 * @param {object}   [options]
 * @param {string}   [options.modelId]
 * @param {number}   [options.maxTokens]
 * @param {number}   [options.maxRetries]
 * @returns {Promise<{text: string, confidence: number|null, raw: object}>}
 */
async function analyzeImage(imageUrl, prompt, options) {
  options = options || {};

  const modelId   = options.modelId   || MODELS.VISION;
  const maxTokens = options.maxTokens || 512;

  if (!isWatsonxConfigured()) {
    _log('debug', 'analyzeImage: mock mode', { modelId });
    return _mockVisionResponse(imageUrl, prompt);
  }

  const client    = _getClient();
  const projectId = process.env.WATSONX_PROJECT_ID;
  const startMs   = Date.now();

  _log('info', 'analyzeImage: request', {
    modelId,
    projectId,
    imageUrl,
    promptLength: prompt.length,
  });

  // Build the prompt for the vision model.
  // The image URL is embedded inline; when the multimodal API is stable this
  // block is replaced with a message that includes an image_url content part.
  const visionSystemPrompt = [
    'You are an expert visual analyst.',
    'The user will provide an image URL and a task.',
    'Analyse the image at the given URL and respond as instructed.',
  ].join(' ');

  const visionUserPrompt = [
    'Image URL: ' + imageUrl,
    '',
    prompt,
  ].join('\n');

  try {
    const response = await _withRetry(async function() {
      return client.textChat({
        modelId,
        projectId,
        messages: [
          { role: 'system', content: visionSystemPrompt },
          { role: 'user',   content: visionUserPrompt   },
        ],
        maxTokens,
        temperature: 0.2, // keep vision responses deterministic
        timeLimit:   TIMEOUT_MS,
      });
    }, 'analyzeImage', options.maxRetries);

    const text       = _extractTextChatContent(response);
    const durationMs = Date.now() - startMs;

    _log('info', 'analyzeImage: response', {
      modelId,
      durationMs,
      outputLength: text.length,
    });

    return {
      text,
      confidence: null,
      raw:        response.result || response,
    };
  } catch (err) {
    const durationMs = Date.now() - startMs;
    _log('error', 'analyzeImage: failed — falling back to mock', {
      modelId,
      durationMs,
      error:  err.message,
      status: err.status || err.statusCode,
    });

    return _mockVisionResponse(imageUrl, prompt, err);
  }
}

// ── Response extraction helpers ───────────────────────────────────────────────

/**
 * Extract the generated text string from a textChat response.
 * Guards against unexpected API response shapes.
 *
 * Shape: response.result.choices[0].message.content
 */
function _extractTextChatContent(response) {
  try {
    const content = response.result.choices[0].message.content;
    if (typeof content === 'string' && content.trim().length > 0) {
      return content.trim();
    }
  } catch (_) { /* fall through */ }

  // Fallback: check the legacy generateText shape as a safety net.
  try {
    const genText = response.result.results[0].generated_text;
    if (typeof genText === 'string') return genText.trim();
  } catch (_) { /* fall through */ }

  throw new Error(
    'Unexpected watsonx.ai response shape — could not extract generated text. ' +
    'Raw: ' + JSON.stringify(response).substring(0, 200),
  );
}

/**
 * Safe deep-get helper — avoids try/catch noise for log metadata.
 * @param {object} obj
 * @param {string} path — dot-separated, supports numeric array indices
 */
function _safeGet(obj, path) {
  try {
    return path.split('.').reduce(function(cur, key) {
      return cur != null ? cur[key] : undefined;
    }, obj);
  } catch (_) {
    return undefined;
  }
}

// ── Mock responses ────────────────────────────────────────────────────────────
// Identical shape to real responses so agent code is unaffected by mock mode.
// raw.mock === true is the contract agents use to detect mock mode.

function _mockTextResponse(systemPrompt, userPrompt, causeErr) {
  void systemPrompt;
  void userPrompt;
  const message = causeErr
    ? '[MOCK — watsonx.ai call failed: ' + causeErr.message + '] Set WATSONX_API_KEY to enable real responses.'
    : '[MOCK] AI text generation is not configured. Set WATSONX_API_KEY in .env to enable real responses.';
  return {
    text:       message,
    confidence: null,
    raw:        { mock: true, cause: causeErr ? causeErr.message : null },
  };
}

function _mockVisionResponse(imageUrl, prompt, causeErr) {
  void imageUrl;
  void prompt;
  const message = causeErr
    ? '[MOCK — watsonx.ai vision call failed: ' + causeErr.message + '] Set WATSONX_API_KEY to enable real responses.'
    : '[MOCK] AI vision analysis is not configured. Set WATSONX_API_KEY in .env to enable real responses.';
  return {
    text:       message,
    confidence: null,
    raw:        { mock: true, cause: causeErr ? causeErr.message : null },
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  generateText,
  analyzeImage,
  isWatsonxConfigured,
  MODELS,
};

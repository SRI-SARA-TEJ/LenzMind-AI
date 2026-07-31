/**
 * services/aiService.js — Google Gemini AI Integration Layer
 *
 * This is the single choke-point for every AI model call in the application.
 * Agents NEVER call the Gemini API directly — they always go through here.
 *
 * ── Mode selection ────────────────────────────────────────────────────────────
 * LIVE MODE  — GEMINI_API_KEY env var is set.
 * MOCK MODE  — GEMINI_API_KEY is missing. Mock responses are returned
 *              immediately; no network calls are made. The application
 *              runs fully in this mode during development.
 *
 * ── What lives here ───────────────────────────────────────────────────────────
 *  1. generateText()  — text generation via Gemini Flash (text model)
 *  2. analyzeImage()  — vision analysis via Gemini Flash (multimodal model)
 *  3. Retry logic     — exponential back-off on transient errors
 *  4. Timeout         — per-request timeout via AbortSignal
 *  5. Structured logging — request/response metadata to stdout
 *  6. Mock fallback   — identical response shape, clearly labelled
 *
 * ── Models used ───────────────────────────────────────────────────────────────
 *  Text + Vision : gemini-1.5-flash  (free tier: 15 req/min, 1500 req/day)
 *
 * ── Environment variables ─────────────────────────────────────────────────────
 *  GEMINI_API_KEY      — Google AI Studio API key (required for live mode)
 *  GEMINI_MODEL        — override model (default: gemini-1.5-flash)
 *  GEMINI_TIMEOUT_MS   — per-request timeout in ms (default: 30000)
 *  GEMINI_MAX_RETRIES  — max retry attempts on transient errors (default: 2)
 */

'use strict';

const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL       = process.env.GEMINI_MODEL       || 'gemini-1.5-flash';
const TIMEOUT_MS  = parseInt(process.env.GEMINI_TIMEOUT_MS  || '30000', 10);
const MAX_RETRIES = parseInt(process.env.GEMINI_MAX_RETRIES || '2',     10);

// Transient HTTP status codes that are safe to retry
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

// ── Mode detection ────────────────────────────────────────────────────────────
function isGeminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

// ── Structured logger ─────────────────────────────────────────────────────────
function _log(level, message, meta) {
  const entry = Object.assign(
    { ts: new Date().toISOString(), level, service: 'aiService', message },
    meta || {},
  );
  console.log(JSON.stringify(entry));
}

// ── Low-level Gemini REST call ─────────────────────────────────────────────────
/**
 * POST to the Gemini generateContent endpoint.
 * @param {Array}  contents  — Gemini contents array
 * @param {object} [opts]
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 * @returns {Promise<string>} — generated text
 */
async function _callGemini(contents, opts) {
  opts = opts || {};
  const apiKey      = process.env.GEMINI_API_KEY;
  const maxTokens   = opts.maxTokens   || 512;
  const temperature = opts.temperature != null ? opts.temperature : 0.3;

  const body = JSON.stringify({
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Gemini request timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    const req = https.request(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        clearTimeout(timer);
        try {
          const parsed = JSON.parse(data);

          // Surface API-level errors clearly
          if (parsed.error) {
            const err = new Error(parsed.error.message || 'Gemini API error');
            err.status = parsed.error.code || res.statusCode;
            return reject(err);
          }

          // Non-2xx HTTP status
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(`Gemini HTTP ${res.statusCode}: ${data.substring(0, 200)}`);
            err.status = res.statusCode;
            return reject(err);
          }

          // Extract generated text from response shape:
          // { candidates: [{ content: { parts: [{ text: "..." }] } }] }
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === 'string' && text.trim().length > 0) {
            return resolve(text.trim());
          }

          reject(new Error('Gemini returned an empty response. Raw: ' + data.substring(0, 200)));
        } catch (parseErr) {
          reject(new Error('Failed to parse Gemini response: ' + parseErr.message));
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────
async function _withRetry(fn, opName, maxRetries) {
  const limit = (maxRetries != null) ? maxRetries : MAX_RETRIES;
  let lastErr;

  for (let attempt = 0; attempt <= limit; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      const isRetryable =
        RETRYABLE_STATUS.has(err.status || err.statusCode) ||
        /ECONNRESET|ETIMEDOUT|network|socket hang up/i.test(err.message || '');

      if (!isRetryable || attempt === limit) break;

      const delayMs = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s…
      _log('warn', opName + ': retrying after ' + delayMs + 'ms', {
        attempt:    attempt + 1,
        maxRetries: limit,
        error:      err.message,
        status:     err.status || err.statusCode,
      });

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastErr;
}

// ── generateText ──────────────────────────────────────────────────────────────
/**
 * Generate text using Google Gemini.
 * Used by: Editing Intelligence, Content Optimization, Creator Memory agents.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} [options]
 * @param {number} [options.maxTokens]
 * @param {number} [options.temperature]
 * @param {number} [options.maxRetries]
 * @returns {Promise<{ text: string, confidence: null, raw: object }>}
 */
async function generateText(systemPrompt, userPrompt, options) {
  options = options || {};

  if (!isGeminiConfigured()) {
    _log('debug', 'generateText: mock mode (GEMINI_API_KEY not set)');
    return _mockTextResponse();
  }

  const startMs = Date.now();
  _log('info', 'generateText: request', { model: MODEL, promptLength: systemPrompt.length + userPrompt.length });

  try {
    // Gemini uses a single "user" turn — we embed the system prompt at the top
    const contents = [{
      role: 'user',
      parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
    }];

    const text = await _withRetry(
      () => _callGemini(contents, { maxTokens: options.maxTokens, temperature: options.temperature }),
      'generateText',
      options.maxRetries,
    );

    _log('info', 'generateText: response', { model: MODEL, durationMs: Date.now() - startMs, outputLength: text.length });

    return { text, confidence: null, raw: { model: MODEL } };
  } catch (err) {
    _log('error', 'generateText: failed — falling back to mock', {
      model: MODEL, durationMs: Date.now() - startMs, error: err.message,
    });
    return _mockTextResponse(err);
  }
}

// ── analyzeImage ──────────────────────────────────────────────────────────────
/**
 * Analyze an image using Google Gemini vision (multimodal).
 * Used by: Camera Intelligence Agent.
 *
 * Gemini 1.5 Flash is natively multimodal — it can see the actual image
 * pixels when given a publicly accessible URL.
 *
 * @param {string} imageUrl   — publicly accessible image URL
 * @param {string} prompt     — task description / system prompt
 * @param {object} [options]
 * @param {number} [options.maxTokens]
 * @param {number} [options.maxRetries]
 * @returns {Promise<{ text: string, confidence: null, raw: object }>}
 */
async function analyzeImage(imageUrl, prompt, options) {
  options = options || {};

  if (!isGeminiConfigured()) {
    _log('debug', 'analyzeImage: mock mode (GEMINI_API_KEY not set)');
    return _mockVisionResponse(imageUrl);
  }

  const startMs = Date.now();
  _log('info', 'analyzeImage: request', { model: MODEL, imageUrl });

  try {
    // Gemini multimodal: pass image URL inline in the parts array
    const contents = [{
      role: 'user',
      parts: [
        { text: prompt },
        { image_url: { url: imageUrl } },
      ],
    }];

    const text = await _withRetry(
      () => _callGemini(contents, { maxTokens: options.maxTokens || 512, temperature: 0.2 }),
      'analyzeImage',
      options.maxRetries,
    );

    _log('info', 'analyzeImage: response', { model: MODEL, durationMs: Date.now() - startMs, outputLength: text.length });

    return { text, confidence: null, raw: { model: MODEL } };
  } catch (err) {
    _log('error', 'analyzeImage: failed — falling back to mock', {
      model: MODEL, durationMs: Date.now() - startMs, error: err.message,
    });
    return _mockVisionResponse(imageUrl, err);
  }
}

// ── Mock responses ────────────────────────────────────────────────────────────
// Identical shape to real responses — raw.mock === true is the contract
// that agents use to detect mock mode.

function _mockTextResponse(causeErr) {
  const message = causeErr
    ? '[MOCK — Gemini call failed: ' + causeErr.message + '] Set GEMINI_API_KEY in Render env vars to enable real AI.'
    : '[MOCK] AI text generation is not configured. Set GEMINI_API_KEY in Render env vars to enable real responses.';
  return { text: message, confidence: null, raw: { mock: true, cause: causeErr ? causeErr.message : null } };
}

function _mockVisionResponse(imageUrl, causeErr) {
  void imageUrl;
  const message = causeErr
    ? '[MOCK — Gemini vision call failed: ' + causeErr.message + '] Set GEMINI_API_KEY in Render env vars to enable real AI.'
    : '[MOCK] AI vision analysis is not configured. Set GEMINI_API_KEY in Render env vars to enable real responses.';
  return { text: message, confidence: null, raw: { mock: true, cause: causeErr ? causeErr.message : null } };
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  generateText,
  analyzeImage,
  isGeminiConfigured,
  MODELS: { TEXT: MODEL, VISION: MODEL }, // same model handles both
};

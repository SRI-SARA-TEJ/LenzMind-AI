const asyncHandler = require('../middleware/asyncHandler');
const { configureUploads } = require('../config/storage');
const cameraIntelligenceAgent = require('../agents/cameraIntelligence');

const upload = configureUploads();

// ── Scene-to-workflow mapping ─────────────────────────────────────────────────
// Maps common scene keywords (returned by the Camera Intelligence Agent's
// `topIssue` / title) to the canonical workflow names held in the front-end
// workflow library.  The front-end resolves the full Workflow object by name.
// Add entries here as new scenes / workflows are introduced.
const SCENE_WORKFLOW_MAP = [
  { keywords: ['golden hour', 'outdoor', 'travel', 'landscape', 'warm light'], workflow: 'Travel Vlog' },
  { keywords: ['indoor', 'low light', 'interview', 'talking head', 'corporate'], workflow: 'Interview / Talking Head' },
  { keywords: ['urban', 'street', 'city', 'high contrast'],  workflow: 'Urban Street' },
  { keywords: ['food', 'macro', 'cooking', 'restaurant', 'close-up'], workflow: 'Food Creator' },
  { keywords: ['concert', 'event', 'stage', 'live', 'performance'], workflow: 'Live Event Highlights' },
  { keywords: ['sport', 'action', 'fast movement', 'motion'], workflow: 'Sports Action' },
  { keywords: ['portrait', 'person', 'face', 'people'], workflow: 'Portrait Session' },
  { keywords: ['product', 'ecommerce', 'commercial', 'showcase'], workflow: 'Product Photography' },
  { keywords: ['cinematic', 'film', 'documentary', 'manual'], workflow: 'Cinematic Video' },
  { keywords: ['reel', 'social', 'vertical', 'short-form'], workflow: 'Short-Form Reel' },
  { keywords: ['wedding', 'ceremony', 'romantic'], workflow: 'Wedding Shoot' },
];

/**
 * Infer a workflow name from the AI agent's title / explanation text.
 * Returns null when no confident match is found — the front-end falls back
 * to the currently active workflow in that case.
 */
function inferWorkflowFromScene(title, explanation) {
  const haystack = `${title} ${explanation}`.toLowerCase();
  for (const entry of SCENE_WORKFLOW_MAP) {
    if (entry.keywords.some(kw => haystack.includes(kw))) {
      return entry.workflow;
    }
  }
  return null;
}

const analyzeImage = [
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      const error = new Error('An image file is required.');
      error.statusCode = 400;
      throw error;
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const result = await cameraIntelligenceAgent.analyze({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      url: imageUrl,
    });

    const details = result.details ?? {};

    // Module 8.5 — populate the workflow field so the front-end can activate
    // the matching workflow and apply its camera settings automatically.
    const workflow = inferWorkflowFromScene(result.title, result.explanation);

    res.status(200).json({
      success: true,
      analysis: {
        scene: result.title,
        recommendations: details.suggestion ? [details.suggestion] : [result.explanation],
        workflow,           // string | null — front-end resolves to full object
        confidence: result.confidence,
        status: result.status,
        details,
      },
    });
  }),
];

module.exports = { analyzeImage };


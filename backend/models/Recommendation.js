/**
 * models/Recommendation.js — AI Recommendation Data Model
 *
 * Stores AI-generated suggestions linked to a project.
 * Each recommendation has:
 *   - which AI agent produced it
 *   - a human-readable explanation (principle: AI must explain itself)
 *   - a confidence score (0–1)
 *   - whether the user accepted/dismissed it (human stays in control)
 *
 * In the MVP these records are stubs. Real agents will create them via
 * the recommendations service once IBM watsonx.ai is integrated.
 */

const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    // Which agent produced this recommendation
    agentType: {
      type: String,
      enum: [
        'camera-intelligence',
        'editing-intelligence',
        'content-optimization',
        'creator-memory',
        'analytics',
      ],
      required: true,
    },

    // Short human-readable title shown in the UI
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Full explanation — AI must always explain its reasoning
    explanation: {
      type: String,
      required: true,
    },

    // 0.0 – 1.0 confidence from the AI model
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    // Category tags for grouping in the UI (e.g. "composition", "color")
    tags: [{ type: String }],

    // User's decision on this recommendation
    userAction: {
      type: String,
      enum: ['pending', 'accepted', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);

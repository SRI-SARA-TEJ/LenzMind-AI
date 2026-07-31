/**
 * models/Project.js — Project Data Model
 *
 * A Project is the central unit of work for a creator.
 * It groups related media assets, editing sessions, and AI recommendations.
 *
 * Fields are kept simple for the MVP but the schema is designed to hold
 * future AI agent outputs (cameraAnalysis, editingSuggestions, etc.)
 * without requiring a migration — just adding optional fields.
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Content type helps route to the right AI agent in the future
    contentType: {
      type: String,
      enum: ['photo', 'video', 'mixed'],
      default: 'mixed',
    },

    status: {
      type: String,
      enum: ['draft', 'in-progress', 'completed'],
      default: 'draft',
    },

    // Uploaded media assets associated with this project
    assets: [
      {
        filename:     String,  // stored filename on disk / object storage
        originalName: String,  // original filename from the user
        mimeType:     String,
        size:         Number,  // bytes
        url:          String,  // public access URL
        uploadedAt:   { type: Date, default: Date.now },
      },
    ],

    // ── Future AI agent output placeholders ─────────────────────
    // These fields are empty in the MVP. Agents will populate them.
    cameraAnalysis:      { type: mongoose.Schema.Types.Mixed, default: null },
    editingSuggestions:  { type: mongoose.Schema.Types.Mixed, default: null },
    optimizationTips:    { type: mongoose.Schema.Types.Mixed, default: null },
    analyticsData:       { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,         // adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

module.exports = mongoose.model('Project', projectSchema);

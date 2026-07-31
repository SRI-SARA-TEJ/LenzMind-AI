/**
 * controllers/uploadController.js
 *
 * Handles file uploads via Multer.
 * After a successful upload, the file metadata is attached to the project.
 */

const path           = require('path');
const asyncHandler   = require('../middleware/asyncHandler');
const projectService = require('../services/projectService');
const { configureUploads } = require('../config/storage');

const upload = configureUploads();

// Single file upload handler
const uploadFile = [
  // Multer middleware runs first — it parses the multipart body and
  // attaches `req.file` before our async handler runs.
  upload.single('file'),

  asyncHandler(async (req, res) => {
    if (!req.file) {
      const err = new Error('No file provided');
      err.statusCode = 400;
      throw err;
    }

    const { projectId } = req.body;
    if (!projectId) {
      const err = new Error('projectId is required');
      err.statusCode = 400;
      throw err;
    }

    const assetData = {
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url:          `/uploads/${req.file.filename}`,
    };

    const project = await projectService.addAssetToProject(projectId, assetData);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      asset:   assetData,
      project: project._id,
    });
  }),
];

module.exports = { uploadFile };

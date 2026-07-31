/**
 * config/storage.js — File Upload Configuration
 *
 * We use Multer (Express middleware) for handling multipart/form-data.
 *
 * Design decisions:
 *  - Files go to a local `uploads/` folder for the MVP.
 *  - In production this would be replaced with IBM Cloud Object Storage
 *    or AWS S3 — the configureUploads() shape is kept simple so that
 *    swap is a single-file change.
 *  - File type filtering is enforced here, not in controllers,
 *    so it is consistently applied across all upload routes.
 */

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_DIR     = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE  = parseInt(process.env.MAX_FILE_SIZE, 10) || 104_857_600; // 100 MB

// Ensure the upload directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Accepted MIME types for creator content
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
]);

function configureUploads() {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      // Prefix with timestamp to avoid name collisions
      const timestamp = Date.now();
      const ext       = path.extname(file.originalname);
      cb(null, `${timestamp}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });

  const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported.`), false);
    }
  };

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});

upload.dest = UPLOAD_DIR;

return upload;
}

module.exports = { configureUploads };

/**
 * server.js — Application Entry Point
 *
 * Responsibilities:
 *  1. Load environment variables
 *  2. Create the Express app
 *  3. Connect to the database
 *  4. Register middleware and routes
 *  5. Start the HTTP server
 *
 * Design decision: Keep this file thin. All real logic lives in
 * config/, middleware/, and routes/ so this file stays readable.
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { connectDatabase } = require('./config/database');
const { configureUploads } = require('./config/storage');
const errorHandler        = require('./middleware/errorHandler');
const requestLogger       = require('./middleware/requestLogger');

// ── Route modules ──────────────────────────────────────────────
const healthRoutes         = require('./routes/health');
const projectRoutes        = require('./routes/projects');
const uploadRoutes         = require('./routes/uploads');
const recommendationRoutes = require('./routes/recommendations');
const analyticsRoutes      = require('./routes/analytics');
const aiRoutes             = require('./routes/ai');

// ── App setup ──────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Core middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',   // Vite dev server default
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve uploaded files statically (development convenience)
app.use('/uploads', express.static(configureUploads().dest));

// ── API Routes (versioned) ─────────────────────────────────────
// Versioning lets us evolve the API without breaking clients.
app.use('/api/v1/health',           healthRoutes);
app.use('/api/v1/projects',         projectRoutes);
app.use('/api/v1/uploads',          uploadRoutes);
app.use('/api/v1/recommendations',  recommendationRoutes);
app.use('/api/v1/analytics',        analyticsRoutes);
app.use('/api/v1/ai',               aiRoutes);
app.use('/api/ai',                  aiRoutes);

// ── Global error handler (must be last) ───────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────
async function start() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`\n🚀 AI Creator OS Backend`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   Server      : http://localhost:${PORT}`);
    console.log(`   API base    : http://localhost:${PORT}/api/v1\n`);
  });
}

start();

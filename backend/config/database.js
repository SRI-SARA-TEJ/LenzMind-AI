/**
 * config/database.js — Database Connection
 *
 * Why Mongoose / MongoDB?
 *   Creator content (projects, assets, AI recommendations) is naturally
 *   document-shaped. A flexible schema lets us evolve the data model as
 *   AI agents add new fields without painful migrations.
 *
 * The connectDatabase() function is deliberately non-blocking at startup:
 *   if no MONGODB_URI is set we log a warning and continue. This lets the
 *   server run and serve static/health routes even before a DB is wired up.
 */

const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      '⚠️  MONGODB_URI not set. Database features will be unavailable.\n' +
      '   Copy .env.example → .env and add your connection string.'
    );
    return;
  }

  try {
    await mongoose.connect(uri, {
      // These options silence deprecation warnings and are recommended defaults.
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅  MongoDB connected');
  } catch (err) {
    // Log the error but do not crash — allows the server to start without DB
    // so developers can test non-DB routes during local development.
    console.error('❌  MongoDB connection failed:', err.message);
  }
}

module.exports = { connectDatabase };

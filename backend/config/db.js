/**
 * config/database.js
 * AcademySphere — MongoDB connection
 *
 * NOTE: useNewUrlParser and useUnifiedTopology were removed in Mongoose 6.
 * Passing them causes "options not supported" crash on Mongoose 6 / 7 / 8.
 */

'use strict';

const mongoose = require('mongoose');
const logger   = require('./logger');

const connectDB = async () => {
  try {
    // ── Mongoose 6+ does NOT accept useNewUrlParser / useUnifiedTopology ──
    // Only pass options that are still valid.
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,   // fail fast if no server found
      socketTimeoutMS:          45000,  // close sockets after 45 s of inactivity
    });

    logger.info(
      `MongoDB connected — host: ${conn.connection.host} | db: ${conn.connection.name}`
    );

    // ── Connection lifecycle events ───────────────────────────────────────
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
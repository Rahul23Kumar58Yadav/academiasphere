/**
 * config/logger.js
 * AcademySphere — Winston Logger
 *
 * Transports:
 *   Development  → colourised console (human-readable)
 *   Production   → combined.log + error.log (JSON, machine-parseable)
 *                  + console in JSON for container stdout capture
 *
 * Usage anywhere in the app:
 *   const logger = require('../config/logger');
 *   logger.info('User logged in', { userId, ip });
 *   logger.warn('Rate limit hit',  { route });
 *   logger.error('DB write failed', { error: err.message, stack: err.stack });
 *   logger.debug('Cache miss',     { key });        // silent in production
 */

'use strict';

const winston     = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');  // optional — see note
const path        = require('path');

// ─── Paths ────────────────────────────────────────────────────────────────────

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// ─── Log level ────────────────────────────────────────────────────────────────
//   Hierarchy: error > warn > info > http > verbose > debug > silly
//   In production only error/warn/info/http are emitted.
//   In development debug is also emitted.

const LOG_LEVEL = process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'http' : 'debug');

// ─── Custom format: timestamp + level + message + metadata ───────────────────

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

// Pretty format for the console in development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? '\n  ' + JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')
      : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
  })
);

// Structured JSON format for production / log aggregators (Datadog, CloudWatch, etc.)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json()
);

// ─── Transports ───────────────────────────────────────────────────────────────

const transports = [];

const isDev  = process.env.NODE_ENV !== 'production';
const isProd = process.env.NODE_ENV === 'production';

// ── Console ───────────────────────────────────────────────────────────────────
transports.push(
  new winston.transports.Console({
    level:  LOG_LEVEL,
    format: isDev ? devFormat : prodFormat,
    silent: process.env.NODE_ENV === 'test',  // suppress logs during Jest runs
  })
);

// ── File transports (production only) ─────────────────────────────────────────
if (isProd) {
  // Check whether winston-daily-rotate-file is installed; fall back to plain files
  try {
    require.resolve('winston-daily-rotate-file');

    // Rotates daily, keeps 14 days, compresses old files
    transports.push(
      new DailyRotateFile({
        level:         'http',
        dirname:       LOG_DIR,
        filename:      'combined-%DATE%.log',
        datePattern:   'YYYY-MM-DD',
        zippedArchive: true,
        maxSize:       '20m',
        maxFiles:      '14d',
        format:        prodFormat,
      }),
      new DailyRotateFile({
        level:         'error',
        dirname:       LOG_DIR,
        filename:      'error-%DATE%.log',
        datePattern:   'YYYY-MM-DD',
        zippedArchive: true,
        maxSize:       '20m',
        maxFiles:      '30d',
        format:        prodFormat,
      })
    );
  } catch {
    // winston-daily-rotate-file not installed — use plain File transports
    transports.push(
      new winston.transports.File({
        level:    'http',
        dirname:  LOG_DIR,
        filename: 'combined.log',
        format:   prodFormat,
        maxsize:  20 * 1024 * 1024,   // 20 MB
        maxFiles: 5,
        tailable: true,
      }),
      new winston.transports.File({
        level:    'error',
        dirname:  LOG_DIR,
        filename: 'error.log',
        format:   prodFormat,
        maxsize:  20 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
      })
    );
  }
}

// ─── Logger instance ──────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level:             LOG_LEVEL,
  defaultMeta:       { service: 'academysphere-api' },
  transports,
  // Don't crash the process on unhandled logger errors
  exitOnError:       false,
});

// ─── Stream — used by Morgan HTTP request logger ──────────────────────────────
//
// Wire it in app.js:
//   const morgan = require('morgan');
//   app.use(morgan('combined', { stream: logger.stream }));

logger.stream = {
  write(message) {
    // Morgan appends a newline — strip it so Winston doesn't double-space
    logger.http(message.trimEnd());
  },
};

// ─── Unhandled rejection / exception forwarding ───────────────────────────────
//   Only active outside of test environment to avoid noise in Jest output.

if (process.env.NODE_ENV !== 'test') {
  logger.exceptions.handle(
    new winston.transports.Console({ format: isDev ? devFormat : prodFormat })
  );

  logger.rejections.handle(
    new winston.transports.Console({ format: isDev ? devFormat : prodFormat })
  );
}

module.exports = logger;
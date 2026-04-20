"use strict";
const logger = require("../utils/logger");

/**
 * Global error handler middleware — the SINGLE exit point for all errors.
 *
 * Handles:
 * - Mongoose ValidationError → 422
 * - Mongoose duplicate key   → 409
 * - Multer file-size          → 413
 * - Multer file type          → 415
 * - JWT errors                → 401
 * - Operational AppErrors     → custom statusCode
 * - Unknown errors            → 500 (stack hidden in production)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // ─── Mongoose validation error → 422 ────────────────────────────────────
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(" ");
    return res.status(422).json({ success: false, message });
  }

  // ─── Mongoose duplicate key → 409 ───────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ success: false, message: `${field} is already registered.` });
  }

  // ─── Multer errors ──────────────────────────────────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "Image must be under 3 MB." });
  }
  if (err.message && err.message.includes("Only JPEG")) {
    return res.status(415).json({ success: false, message: err.message });
  }

  // ─── JWT errors ─────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Session invalid. Please sign in again." });
  }

  // ─── Mongoose CastError (invalid ObjectId) ─────────────────────────────
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  // ─── Operational errors ─────────────────────────────────────────────────
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  const message =
    err.isOperational
      ? err.message
      : isProd
      ? "Internal server error. Please try again later."
      : err.message || "Internal server error.";

  if (statusCode >= 500) {
    logger.error({ message: err.message, stack: err.stack, statusCode });
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;

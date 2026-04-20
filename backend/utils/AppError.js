"use strict";

/**
 * Operational (expected) errors that flow through the error handler.
 * These are client-facing mistakes — NOT bugs.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

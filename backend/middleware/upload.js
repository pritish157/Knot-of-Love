"use strict";
const multer   = require("multer");
const AppError = require("../utils/AppError");

// ─── Memory storage ───────────────────────────────────────────────────────────
// Files are kept as Buffer in req.file.buffer — never written to disk.
// We upload the buffer directly to ImageKit in the controller.
const storage = multer.memoryStorage();

// ─── File type whitelist ──────────────────────────────────────────────────────
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

// KYC documents also allow PDFs
const ALLOWED_MIME_DOCS = new Set([...ALLOWED_MIME, "application/pdf"]);

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;  // 3 MB
const MAX_DOC_BYTES   = 5 * 1024 * 1024;  // 5 MB

// ─── Profile photo upload ─────────────────────────────────────────────────────
const photoUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new AppError("Only JPEG, PNG, and WebP images are allowed.", 415), false);
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 }
});

// ─── KYC document upload ──────────────────────────────────────────────────────
const documentUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_DOCS.has(file.mimetype)) {
      return cb(new AppError("Only JPEG, PNG, WebP, or PDF files are allowed.", 415), false);
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_DOC_BYTES, files: 1 }
});

// Export both so routes can choose the correct one
module.exports = { photoUpload, documentUpload };
"use strict";
const path     = require("path");
const Document = require("../models/Document");
const User     = require("../models/User");
const AppError = require("../utils/AppError");
const { uploadToImageKit } = require("../utils/imagekit");

/**
 * POST /api/kyc/upload
 * Requires identification type, number and file
 */
exports.uploadKYC = async (req, res, next) => {
  const { type, idNumber } = req.body;

  if (!req.file) return next(new AppError("Identity document file is required", 400));
  if (!type || !idNumber) return next(new AppError("ID type and number are required", 400));

  const existing = await Document.findOne({ userId: req.user.id });
  if (existing && existing.status === "Approved") {
    return next(new AppError("KYC already approved. Cannot re-upload.", 400));
  }

  // Upload buffer to ImageKit — /knot/kyc folder is private in ImageKit dashboard
  const ext      = path.extname(req.file.originalname).toLowerCase() || ".pdf";
  const fileName = `kyc-${req.user.id}${ext}`;
  const { url: fileUrl } = await uploadToImageKit(req.file.buffer, fileName, "/knot/kyc");

  const docData = {
    userId: req.user.id,
    idProof: { type, idNumber, fileUrl },
    status: "Pending"
  };

  const document = await Document.findOneAndUpdate(
    { userId: req.user.id },
    { $set: docData },
    { new: true, upsert: true }
  );

  res.status(201).json({
    success: true,
    message: "KYC documents uploaded successfully. Awaiting admin approval.",
    status: document.status
  });
};

/**
 * GET /api/kyc/status
 */
exports.getKYCStatus = async (req, res, next) => {
  const doc = await Document.findOne({ userId: req.user.id });
  if (!doc) return res.json({ success: true, status: "None" });

  res.json({
    success: true,
    status: doc.status,
    reason: doc.rejectionReason,
    submittedAt: doc.createdAt
  });
};

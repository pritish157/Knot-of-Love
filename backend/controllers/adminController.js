"use strict";
const User     = require("../models/User");
const Document = require("../models/Document");
const AdminLog = require("../models/AdminLog");
const Profile  = require("../models/Profile");
const AppError = require("../utils/AppError");
const logger   = require("../utils/logger");

/**
 * GET /api/admin/contact-email  — PUBLIC (no auth required)
 * Returns the admin contact email from .env so the frontend can display it.
 */
exports.getContactEmail = (req, res) => {
  res.json({
    success: true,
    email: process.env.ADMIN_CONTACT_EMAIL || "support@knotofflove.in"
  });
};

/**
 * GET /api/admin/members?page&limit&search&gender&verified
 * Paginated, searchable list of all registered users (role=User).
 */
exports.getMembers = async (req, res, next) => {
  const { page = 1, limit = 20, search = "", gender = "", verified = "" } = req.query;

  const filter = { role: "User" };
  if (gender)              filter.gender = gender;
  if (verified === "true")  filter.isProfileVerified = true;
  if (verified === "false") filter.isProfileVerified = false;
  if (search.trim()) {
    filter.$or = [
      { name:     new RegExp(search.trim(), "i") },
      { email:    new RegExp(search.trim(), "i") },
      { memberId: new RegExp(search.trim(), "i") }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email gender memberId trustScore isProfileVerified createdAt")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    users,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
};

/**
 * GET /api/admin/activity?page&limit
 * Paginated audit log of all admin actions.
 */
exports.getActivity = async (req, res, next) => {
  const { page = 1, limit = 30 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    AdminLog.find({})
      .populate("admin",      "name email")
      .populate("targetUser", "name email memberId")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AdminLog.countDocuments()
  ]);

  res.json({
    success: true,
    logs,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
};

/**
 * GET /api/admin/stats
 */
exports.getStats = async (req, res, next) => {
  const [totalUsers, verifiedUsers, pendingDocs] = await Promise.all([
    User.countDocuments({ role: "User" }),
    User.countDocuments({ isProfileVerified: true }),
    Document.countDocuments({ status: "Pending" })
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      verifiedUsers,
      pendingDocs,
      verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0
    }
  });
};

/**
 * GET /api/admin/pending-users
 * Get users who have uploaded documents and are pending approval
 */
exports.getPendingUsers = async (req, res, next) => {
  const docs = await Document.find({ status: "Pending" })
    .populate("userId", "name email phone isProfileVerified isProfileComplete trustScore")
    .sort("-createdAt")
    .lean();

  // Map to a cleaner user-centric response
  const users = docs.map(doc => ({
    docId: doc._id,
    idProof: doc.idProof,
    jobProof: doc.jobProof,
    submittedAt: doc.createdAt,
    user: doc.userId
  }));

  res.json({ success: true, pendingUsers: users });
};

/**
 * POST /api/admin/approve
 * Approves a user's KYC documents
 */
exports.approveUser = async (req, res, next) => {
  const { docId, userId } = req.body;
  if (!docId && !userId) return next(new AppError("Either docId or userId is required", 400));

  const query = docId ? { _id: docId } : { userId, status: "Pending" };
  const doc = await Document.findOne(query);
  
  if (!doc) return next(new AppError("Pending document not found", 404));

  doc.status = "Approved";
  doc.verifiedAt = new Date();
  doc.verifiedBy = req.user.id;
  await doc.save();

  const user = await User.findById(doc.userId);
  if (user) {
    user.isProfileVerified = true;
    const profile = await Profile.findOne({ userId: user._id });
    user.trustScore = user.calculateTrustScore(profile);
    await user.save();
  }

  await AdminLog.create({
    admin: req.user.id,
    action: "APPROVE_DOCUMENT",
    targetUser: doc.userId,
    metadata: { docId: doc._id }
  });

  logger.info(`[ADMIN] User ${doc.userId} approved by Admin ${req.user.id}`);
  res.json({ success: true, message: "User successfully approved" });
};

/**
 * POST /api/admin/reject
 * Rejects a user's KYC documents
 */
exports.rejectUser = async (req, res, next) => {
  const { docId, userId, reason } = req.body;
  if (!docId && !userId) return next(new AppError("Either docId or userId is required", 400));
  if (!reason) return next(new AppError("Rejection reason is required", 400));

  const query = docId ? { _id: docId } : { userId, status: "Pending" };
  const doc = await Document.findOne(query);
  
  if (!doc) return next(new AppError("Pending document not found", 404));

  doc.status = "Rejected";
  doc.rejectionReason = reason;
  doc.verifiedBy = req.user.id;
  await doc.save();

  const user = await User.findById(doc.userId);
  if (user) {
    user.isProfileVerified = false;
    const profile = await Profile.findOne({ userId: user._id });
    user.trustScore = user.calculateTrustScore(profile);
    await user.save();
  }

  await AdminLog.create({
    admin: req.user.id,
    action: "REJECT_DOCUMENT",
    targetUser: doc.userId,
    metadata: { docId: doc._id, reason }
  });

  logger.info(`[ADMIN] User ${doc.userId} rejected by Admin ${req.user.id}. Reason: ${reason}`);
  res.json({ success: true, message: "User successfully rejected", reason });
};

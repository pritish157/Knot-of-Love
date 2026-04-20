"use strict";
const User     = require("../models/User");
const Document = require("../models/Document");
const AdminLog = require("../models/AdminLog");
const Profile  = require("../models/Profile");
const Match    = require("../models/Match");
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

/**
 * GET /api/admin/reports?page&limit
 * Lists all USER_REPORTED entries from the audit log with full reporter
 * and reported-user details. Sorted newest-first.
 */
exports.getReports = async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { action: "USER_REPORTED" };

  const [logs, total] = await Promise.all([
    AdminLog.find(filter)
      .populate("targetUser", "name email memberId isFlagged trustScore isProfileVerified")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AdminLog.countDocuments(filter)
  ]);

  // Enrich each log entry with the reporter identity
  // adminId field was repurposed as reporterId in matchController.reportUser
  const reporterIds = logs.map(l => l.admin);
  const reporters = await User.find({ _id: { $in: reporterIds } })
    .select("name email memberId")
    .lean();
  const reporterMap = {};
  for (const r of reporters) reporterMap[r._id.toString()] = r;

  const enriched = logs.map(l => ({
    _id:        l._id,
    reportedAt: l.createdAt,
    reason:     l.details || (l.metadata?.reason) || "",
    reporter:   reporterMap[l.admin?.toString()] || null,
    reported:   l.targetUser || null
  }));

  res.json({
    success: true,
    reports: enriched,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
};

/**
 * POST /api/admin/flag/:userId
 * Toggle fake-profile flag on a user.
 * Body: { flagReason: string } — pass empty string to unflag.
 */
exports.flagUser = async (req, res, next) => {
  const { userId } = req.params;
  const { flagReason = "" } = req.body;

  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found.", 404));
  if (user.role === "Admin") return next(new AppError("Cannot flag an admin account.", 403));

  const wasFlagged = user.isFlagged;
  user.isFlagged  = !wasFlagged;                       // toggle
  user.flagReason = user.isFlagged ? flagReason.trim() : "";

  // Lower trust score aggressively when flagging; restore base when clearing
  if (user.isFlagged) {
    user.trustScore = Math.max(0, user.trustScore - 40);
  } else {
    const profile = await Profile.findOne({ userId: user._id });
    user.trustScore = user.calculateTrustScore(profile);
  }

  await user.save();

  await AdminLog.create({
    admin:      req.user.id,
    action:     user.isFlagged ? "FLAG_USER" : "UNFLAG_USER",
    targetUser: user._id,
    metadata:   { flagReason: user.flagReason }
  });

  // Also flag / unblock any matches involving this user if flagged
  if (user.isFlagged) {
    await Match.updateMany(
      {
        $or: [{ senderId: user._id }, { receiverId: user._id }],
        status: { $nin: ["Blocked", "Rejected"] }
      },
      { status: "Blocked", blockedBy: user._id }
    );
  }

  logger.warn(`[ADMIN] User ${userId} ${user.isFlagged ? "FLAGGED" : "UNFLAGGED"} by Admin ${req.user.id}`);
  res.json({
    success: true,
    message: `User ${user.isFlagged ? "flagged" : "unflagged"} successfully.`,
    isFlagged:  user.isFlagged,
    flagReason: user.flagReason
  });
};

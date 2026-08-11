"use strict";
const Notification = require("../models/Notification");
const User         = require("../models/User");
const AppError     = require("../utils/AppError");
const logger       = require("../utils/logger");

// ─── GET /api/notifications ───────────────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  const rawLimit = parseInt(req.query.limit, 10);
  const limit = (!isNaN(rawLimit) && rawLimit > 0) ? Math.min(rawLimit, 100) : 50;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ receiverId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit),
    Notification.countDocuments({ receiverId: req.user.id, isRead: false })
  ]);

  res.json({ success: true, count: notifications.length, unreadCount, notifications });
};

// ─── POST /api/notifications/read/:id ─────────────────────────────────────────
exports.markAsRead = async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, receiverId: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  res.json({ success: true, notification });
};

// ─── POST /api/notifications/read-all ───────────────────────────────────────
exports.markAllAsRead = async (req, res, next) => {
  await Notification.updateMany(
    { receiverId: req.user.id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true, message: "All notifications marked as read." });
};

// ─── PUT /api/notifications/fcm-token ────────────────────────────────────────
// Saves or updates the FCM device token for push notifications.
exports.saveFcmToken = async (req, res, next) => {
  const { token } = req.body;
  if (!token || typeof token !== "string") {
    return next(new AppError("A valid FCM token is required.", 400));
  }

  // Add token to the user's fcmTokens array (avoid duplicates, cap at 5 devices)
  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError("User not found.", 404));

  if (!user.fcmTokens.includes(token)) {
    user.fcmTokens.push(token);
    // Keep only the last 5 device tokens (oldest first, rotate out)
    if (user.fcmTokens.length > 5) {
      user.fcmTokens = user.fcmTokens.slice(-5);
    }
    await user.save();
    logger.info(`[FCM] Token saved for user ${req.user.id}`);
  }

  res.json({ success: true, message: "FCM token saved." });
};

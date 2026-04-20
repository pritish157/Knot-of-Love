"use strict";
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");

// ─── GET /api/notifications ───────────────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  const notifications = await Notification.find({ receiverId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    receiverId: req.user.id,
    isRead: false
  });

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

"use strict";
const Message  = require("../models/Message");
const Match    = require("../models/Match");
const AppError = require("../utils/AppError");

/**
 * POST /api/messages/send
 * Send a message within an accepted match. Both parties can send.
 */
exports.sendMessage = async (req, res, next) => {
  const { matchId, text } = req.body;
  if (!matchId) return next(new AppError("matchId is required", 400));
  if (!text || !text.trim()) return next(new AppError("Message text is required", 400));
  if (text.trim().length > 500) return next(new AppError("Message cannot exceed 500 characters", 400));

  const match = await Match.findById(matchId);
  if (!match) return next(new AppError("Match not found", 404));

  // Only accepted matches can exchange messages
  if (match.status !== "Accepted") {
    return next(new AppError("Messages can only be sent in accepted matches", 403));
  }

  // Verify the requester is part of this match
  const sid = match.senderId.toString();
  const rid = match.receiverId.toString();
  const me  = req.user.id;
  if (me !== sid && me !== rid) {
    return next(new AppError("You are not part of this match", 403));
  }

  const receiverId = me === sid ? match.receiverId : match.senderId;

  const message = await Message.create({
    matchId,
    senderId:   req.user.id,
    receiverId,
    text:       text.trim()
  });

  res.status(201).json({ success: true, message });
};

/**
 * GET /api/messages/:matchId
 * Get full conversation for a match (only parties involved).
 */
exports.getMessages = async (req, res, next) => {
  const { matchId } = req.params;

  const match = await Match.findById(matchId);
  if (!match) return next(new AppError("Match not found", 404));

  const me = req.user.id;
  if (match.senderId.toString() !== me && match.receiverId.toString() !== me) {
    return next(new AppError("Access denied", 403));
  }

  const messages = await Message.find({ matchId })
    .sort("createdAt")
    .lean();

  // Mark incoming messages as read
  await Message.updateMany(
    { matchId, receiverId: req.user.id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({ success: true, messages });
};

/**
 * GET /api/messages/unread-count
 * Total unread messages for the logged-in user.
 */
exports.getUnreadCount = async (req, res, next) => {
  const count = await Message.countDocuments({
    receiverId: req.user.id,
    isRead: false
  });
  res.json({ success: true, count });
};

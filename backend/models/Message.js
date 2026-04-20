"use strict";
const mongoose = require("mongoose");

// ─── Message Schema ──────────────────────────────────────────────────────────
// Short matrimonial messages exchanged after a match is accepted.
const MessageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      maxlength: [500, "Message cannot exceed 500 characters"],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Conversation fetch (sorted by time)
MessageSchema.index({ matchId: 1, createdAt: 1 });
// Unread count per receiver
MessageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model("Message", MessageSchema);

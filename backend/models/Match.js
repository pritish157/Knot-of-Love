"use strict";
const mongoose = require("mongoose");

// ─── Match Schema ────────────────────────────────────────────────────────────
// Interest requests and match tracking between users.
const MatchSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Blocked", "Unmatched"],
      default: "Pending"
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    archivedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    actionDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Prevent duplicate interest requests between same pair
MatchSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

// Efficient lookup for "my matches"
MatchSchema.index({ senderId: 1, status: 1 });
MatchSchema.index({ receiverId: 1, status: 1 });

module.exports = mongoose.model("Match", MatchSchema);

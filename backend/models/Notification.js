"use strict";
const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["NEW_MESSAGE", "MATCH_ACCEPTED", "INTEREST_RECEIVED"],
      required: true
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match"
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    actionUrl: { type: String } // e.g., "/chat", "/dashboard"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);

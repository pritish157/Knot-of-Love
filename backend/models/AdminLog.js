"use strict";
const mongoose = require("mongoose");

const AdminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    action: {
      type: String,
      required: true // e.g., "APPROVE_DOCUMENT", "REJECT_PROFILE", "DELETE_USER"
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed // JSON details about the change
    }
  },
  { timestamps: true }
);

// Index for audit queries
AdminLogSchema.index({ admin: 1, createdAt: -1 });
AdminLogSchema.index({ targetUser: 1 });

module.exports = mongoose.model("AdminLog", AdminLogSchema);

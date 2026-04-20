"use strict";
const mongoose = require("mongoose");

// ─── Document Schema ────────────────────────────────────────────────────────
// KYC & verification documents — identity proof and employment proof.
const DocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // ─── Identity Proof ────────────────────────────────────────────────────────
    idProof: {
      type: {
        type: String,
        enum: ["Aadhar", "PAN", "Passport", "Driving License", "Voter ID"],
        required: [true, "ID proof type is required"]
      },
      fileUrl:  { type: String, required: [true, "ID proof file is required"] },
      idNumber: { type: String, required: [true, "ID number is required"] }
    },

    // ─── Employment Proof ──────────────────────────────────────────────────────
    jobProof: {
      fileUrl: { type: String, default: "" }
    },

    // ─── Verification ──────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },
    rejectionReason: { type: String, default: "" },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// Index for admin queries
DocumentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Document", DocumentSchema);

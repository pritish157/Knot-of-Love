"use strict";
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ─── OTP Schema ─────────────────────────────────────────────────────────────
// Dedicated OTP collection — removes OTP fields from User model.
// Auto-expires via MongoDB TTL index for zero-maintenance cleanup.
const OTPSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    otp: {
      type: String,
      required: [true, "OTP is required"]
      // Stored hashed — never in plaintext
    },
    purpose: {
      type: String,
      enum: ["email_verification", "phone_verification", "password_reset"],
      required: true,
      default: "email_verification"
    },
    attempts: { type: Number, default: 0, max: 5 },
    expiry: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }
  },
  { timestamps: true }
);

// ─── TTL Index — auto-delete expired OTPs ─────────────────────────────────
OTPSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

// ─── Compound index: one active OTP per user per purpose ──────────────────
OTPSchema.index({ userId: 1, purpose: 1 });

// ─── Hash OTP before save ─────────────────────────────────────────────────
OTPSchema.pre("save", async function (next) {
  if (this.isModified("otp")) {
    const salt = await bcrypt.genSalt(12);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  next();
});

// ─── Compare OTP ──────────────────────────────────────────────────────────
OTPSchema.methods.compareOTP = async function (candidate) {
  return bcrypt.compare(candidate, this.otp);
};

module.exports = mongoose.model("OTP", OTPSchema);

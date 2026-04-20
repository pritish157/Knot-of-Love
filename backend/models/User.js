"use strict";
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ─── User Schema ─────────────────────────────────────────────────────────────
// Core identity & auth only — profile, preferences, OTP live in separate models.
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, "Name is required"],
      trim: true, minlength: 3, maxlength: 80
    },
    email: {
      type: String, required: [true, "Email is required"],
      unique: true, lowercase: true, trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"]
    },
    phone: {
      type: String, required: [true, "Phone number is required"],
      unique: true, match: [/^\d{10}$/, "Phone must be 10 digits"]
    },
    password: {
      type: String, required: [true, "Password is required"],
      minlength: 8, select: false
    },
    dob: { type: Date, required: [true, "Date of birth is required"] },
    gender: {
      type: String, required: true,
      enum: ["Male", "Female"]
    },
    createdFor: {
      type: String,
      enum: ["Self", "Son", "Daughter", "Brother", "Sister", "Friend"],
      default: "Self"
    },
    maritalStatus: {
      type: String, required: [true, "Marital status is required"],
      enum: ["Single", "Divorced", "Widowed", "Awaiting Divorce"]
    },

    // ─── Trust & Verification ──────────────────────────────────────────────────
    role: { type: String, enum: ["User", "Admin"], default: "User" },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isProfileVerified: { type: Boolean, default: false }, // Admin approved via KYC
    isProfileComplete: { type: Boolean, default: false },
    trustScore: { type: Number, default: 10, min: 0, max: 100 },
    onboardingStep: { type: Number, default: 1, min: 1, max: 12 },
    profileViews: { type: Number, default: 0 },

    // ─── Admin Moderation ──────────────────────────────────────────────────────
    isFlagged: { type: Boolean, default: false },          // Fake / suspicious profile flag
    flagReason: { type: String, default: "", trim: true }, // Reason set by admin

    // Unique member ID (KOL-00001 format)
    memberId: { type: String, unique: true, sparse: true },

    // ─── Password Reset & Security ─────────────────────────────────────────────
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ gender: 1, isEmailVerified: 1, isProfileComplete: 1 });
UserSchema.index({ trustScore: -1, createdAt: -1 });
UserSchema.index({ isFlagged: 1 }); // Admin: quickly query suspected fake profiles

// ─── Generate memberId before save ──────────────────────────────────────────
UserSchema.pre("save", async function (next) {
  if (!this.memberId && this.isNew) {
    let nextSeq = 1;
    try {
      const lastUser = await mongoose.model("User")
        .findOne({ memberId: { $exists: true, $ne: null } }, "memberId")
        .sort({ memberId: -1 });
      
      if (lastUser && lastUser.memberId && lastUser.memberId.startsWith("KOL-")) {
        const lastSeq = parseInt(lastUser.memberId.replace("KOL-", ""), 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      } else {
        const count = await mongoose.model("User").countDocuments();
        nextSeq = count + 1;
      }
    } catch (err) {
      console.error("[User Model] Error generating memberId:", err);
      // Fallback
      nextSeq = Date.now() % 100000; 
    }
    this.memberId = `KOL-${String(nextSeq).padStart(5, "0")}`;
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// ─── Trust score auto-calculation ───────────────────────────────────────────
UserSchema.methods.calculateTrustScore = function (profile) {
  let score = 10; // base
  if (this.isEmailVerified)   score += 15;
  if (this.isPhoneVerified)   score += 15;
  if (this.isProfileVerified) score += 30; // admin KYC

  // Profile-based scoring (pass profile document if available)
  if (profile) {
    if (profile.profileImage) score += 10;
    if (profile.aboutMe && profile.aboutMe.length >= 50) score += 10;
    if (profile.education)  score += 5;
    if (profile.profession) score += 5;
  }

  return Math.min(100, score);
};

// ─── Instance methods ────────────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", UserSchema);
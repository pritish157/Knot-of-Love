"use strict";
const mongoose = require("mongoose");

// ─── Profile Schema ──────────────────────────────────────────────────────────
// All personal, professional, and lifestyle data — separated from auth/identity.
const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // ─── Religious & Cultural ──────────────────────────────────────────────────
    religion: { type: String, trim: true, default: "" },
    subCaste: { type: String, trim: true, default: "" },

    // ─── Education & Career ────────────────────────────────────────────────────
    education: { type: String, trim: true, default: "" },
    profession: { type: String, trim: true, default: "" },
    income: { type: String, trim: true, default: "" },    // income range string

    // ─── Location ──────────────────────────────────────────────────────────────
    location: {
      country:  { type: String, trim: true, default: "" },
      state:    { type: String, trim: true, default: "" },
      city:     { type: String, trim: true, default: "" }
    },
    livingInSince: { type: Number },
    placeOfBirth:  { type: String, trim: true, default: "" },
    nationality:   { type: String, trim: true, default: "" },
    visaStatus:    { type: String, trim: true, default: "" },
    ethnicity:     { type: String, trim: true, default: "" },

    // ─── Physical Attributes ───────────────────────────────────────────────────
    height: { type: String, trim: true, default: "" },         // e.g. "5'8\""
    weight: { type: Number, min: 30, max: 200 },               // in kg
    bodyType: { type: String, trim: true, default: "" },
    complexion: { type: String, trim: true, default: "" },

    // ─── Family ────────────────────────────────────────────────────────────────
    familyStatus:     { type: String, trim: true, default: "" },
    livingWithFamily: { type: String, enum: ["Yes", "No", ""], default: "" },

    // ─── Lifestyle ─────────────────────────────────────────────────────────────
    lifestyle: {
      diet:     { type: String, trim: true, default: "" },
      drinking: { type: String, trim: true, default: "" },
      smoking:  { type: String, trim: true, default: "" }
    },

    // ─── About & Bio ───────────────────────────────────────────────────────────
    aboutMe: { type: String, maxlength: 2000, trim: true, default: "" },
    bioModerationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },

    // ─── Media ─────────────────────────────────────────────────────────────────
    profileImage: { type: String, default: "" },
    galleryImages: [{ type: String }]
  },
  { timestamps: true }
);

// ─── Performance Indexes ──────────────────────────────────────────────────────
ProfileSchema.index({ religion: 1, "location.state": 1, "location.city": 1 });
ProfileSchema.index({ profession: 1 });

// ─── Profile completion percentage ──────────────────────────────────────────
ProfileSchema.methods.calculateCompletion = function () {
  const fields = [
    "religion", "education", "profession", "income",
    "location.country", "location.state", "location.city",
    "height", "bodyType", "complexion",
    "lifestyle.diet", "aboutMe", "profileImage"
  ];

  let filled = 0;
  for (const path of fields) {
    const parts = path.split(".");
    let value = this;
    for (const p of parts) {
      value = value?.[p];
    }
    if (value && String(value).trim() !== "") filled++;
  }
  return Math.round((filled / fields.length) * 100);
};

module.exports = mongoose.model("Profile", ProfileSchema);

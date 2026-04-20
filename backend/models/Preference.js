"use strict";
const mongoose = require("mongoose");

// ─── Preference Schema ──────────────────────────────────────────────────────
// Partner preferences — used for matchmaking engine.
const PreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    ageRange: {
      min: { type: Number, default: 18, min: 18, max: 80 },
      max: { type: Number, default: 60, min: 18, max: 80 }
    },

    maritalStatus: [{ type: String }],
    religion: [{ type: String }],
    education: [{ type: String }],
    country: [{ type: String }],

    habits: {
      drinking: { type: String, trim: true, default: "" },  // "No", "Occasionally", etc.
      smoking:  { type: String, trim: true, default: "" }
    }
  },
  { timestamps: true }
);

// Validate ageRange.min <= ageRange.max
PreferenceSchema.pre("validate", function (next) {
  if (this.ageRange && this.ageRange.min > this.ageRange.max) {
    this.invalidate("ageRange.min", "Minimum age cannot exceed maximum age");
  }
  next();
});

module.exports = mongoose.model("Preference", PreferenceSchema);

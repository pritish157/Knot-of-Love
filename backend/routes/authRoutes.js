"use strict";
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const protect = require("../middleware/auth");
const validate = require("../middleware/validate");
const { photoUpload } = require("../middleware/upload");
const {
  register, sendOTP, verifyOTP, login,
  saveOnboardingStep, getMe, uploadProfilePhoto,
  forgotPassword, resetPassword, getConstants, deleteAccount
} = require("../controllers/authController");

// ─── Auth-specific rate limiter ──────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many attempts. Please try again in 15 minutes." }
});

// ─── Public routes ───────────────────────────────────────────────────────────
router.get("/constants", getConstants);

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().isLength({ min: 3 }).withMessage("Name must be at least 3 characters."),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("phone").matches(/^\d{10}$/).withMessage("Phone must be a 10-digit number."),
    body("dob").isISO8601().withMessage("Valid date of birth is required."),
    body("gender").isIn(["Male", "Female"]).withMessage("Gender must be Male or Female."),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
  ],
  validate,
  register
);

router.post("/send-otp", authLimiter, sendOTP);
router.post("/verify-otp", authLimiter, verifyOTP);

router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password").notEmpty().withMessage("Password is required.")
  ],
  validate,
  login
);

router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// ─── Protected routes ────────────────────────────────────────────────────────
router.get("/me", protect, getMe);
router.patch("/onboarding", protect, saveOnboardingStep);
router.post("/upload-photo", protect, photoUpload.single("image"), uploadProfilePhoto);
router.delete("/account", protect, deleteAccount);

module.exports = router;
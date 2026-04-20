"use strict";
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const path   = require("path");
const User     = require("../models/User");
const Profile  = require("../models/Profile");
const Preference = require("../models/Preference");
const OTP      = require("../models/OTP");
const Match    = require("../models/Match");
const AppError = require("../utils/AppError");
const logger   = require("../utils/logger");
const sendEmail   = require("../utils/sendEmail");
const generateOTP = require("../utils/otpUtility");
const { uploadToImageKit } = require("../utils/imagekit");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signToken(userId) {
  return jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: "HS256"
  });
}

/**
 * Build a rich user payload for the frontend.
 * Single source of truth for what the client receives.
 */
async function buildUserPayload(user, extras = {}) {
  const profile = await Profile.findOne({ userId: user._id }).lean();
  const preference = await Preference.findOne({ userId: user._id }).lean();

  return {
    _id: user._id,
    memberId: user.memberId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dob: user.dob,
    maritalStatus: user.maritalStatus,
    createdFor: user.createdFor,

    // Profile data
    religion:  profile?.religion || "",
    subCaste:  profile?.subCaste || "",
    education: profile?.education || "",
    profession: profile?.profession || "",
    incomeRange: profile?.income || "",
    country: profile?.location?.country || "",
    state:   profile?.location?.state || "",
    city:    profile?.location?.city || "",
    height:  profile?.height || "",
    weight:  profile?.weight || null,
    bodyType:   profile?.bodyType || "",
    complexion: profile?.complexion || "",
    diet:     profile?.lifestyle?.diet || "",
    drinking: profile?.lifestyle?.drinking || "",
    smoking:  profile?.lifestyle?.smoking || "",
    bio:      profile?.aboutMe || "",
    ethnicity:  profile?.ethnicity || "",
    familyStatus: profile?.familyStatus || "",
    livingWithFamily: profile?.livingWithFamily || "",
    profileImage: profile?.profileImage
      ? (profile.profileImage.startsWith("http") ? profile.profileImage : `/uploads/profiles/${profile.profileImage}`)
      : "",
    galleryImages: (profile?.galleryImages || []).map(img =>
      img.startsWith("http") ? img : `/uploads/profiles/${img}`
    ),

    // Verification & trust
    role: user.role,
    trustScore: user.trustScore,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    isProfileVerified: user.isProfileVerified,
    isProfileComplete: user.isProfileComplete,
    onboardingStep: user.onboardingStep,
    profileCompletion: profile ? new Profile(profile).calculateCompletion() : 0,
    profileViews: user.profileViews || 0,

    // Partner preferences
    partnerPreferences: preference ? {
      maritalStatus: preference.maritalStatus || [],
      religions: preference.religion || [],
      education: preference.education || [],
      countries: preference.country || [],
      minAge: preference.ageRange?.min || 18,
      maxAge: preference.ageRange?.max || 60,
      drinkingPreference: preference.habits?.drinking || "",
      smokingPreference:  preference.habits?.smoking || ""
    } : {},

    ...extras
  };
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  const { name, email, phone, dob, gender, maritalStatus, password } = req.body;

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }]
  });
  if (existing) {
    return next(new AppError(
      existing.email === email.toLowerCase()
        ? "Email already registered."
        : "Phone number already registered.",
      409
    ));
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    dob,
    gender,
    maritalStatus: maritalStatus || "Single",
    password
  });

  // Create empty profile & preference documents
  await Profile.create({ userId: user._id });
  await Preference.create({ userId: user._id });

  // Generate and send OTP
  const otpCode = generateOTP();
  await OTP.findOneAndDelete({ userId: user._id, purpose: "email_verification" });
  await OTP.create({ userId: user._id, otp: otpCode, purpose: "email_verification" });

  try {
    await sendEmail({
      email: user.email,
      subject: "Verify your Knot of Love account",
      message: `Your verification code is ${otpCode}. It expires in 5 minutes.`,
      html: `<h1>Welcome to Knot of Love</h1><p>Your verification code is: <strong>${otpCode}</strong></p><p>Valid for 5 minutes.</p>`
    });
  } catch (err) {
    logger.error(`[AUTH] Failed to send registration OTP to ${user.email}: ${err.message}`);
  }

  res.status(201).json({
    success: true,
    message: "Registration successful. Please check your email for the verification code.",
    memberId: user.memberId
  });
};

// ─── POST /api/auth/send-otp ─────────────────────────────────────────────────
exports.sendOTP = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Email is required.", 400));

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return next(new AppError("User not found.", 404));

  // Rate limit: 1 OTP per minute
  const recentOTP = await OTP.findOne({
    userId: user._id,
    purpose: "email_verification",
    createdAt: { $gte: new Date(Date.now() - 60000) }
  });
  if (recentOTP) {
    return next(new AppError("Please wait 60 seconds before requesting another OTP.", 429));
  }

  const otpCode = generateOTP();
  await OTP.findOneAndDelete({ userId: user._id, purpose: "email_verification" });
  await OTP.create({ userId: user._id, otp: otpCode, purpose: "email_verification" });

  try {
    await sendEmail({
      email: user.email,
      subject: "Your OTP Code",
      message: `Your OTP code is ${otpCode}. It expires in 5 minutes.`,
      html: `<p>Your OTP code is: <strong>${otpCode}</strong></p>`
    });
  } catch (err) {
    return next(new AppError("Failed to send email. Please try again later.", 500));
  }

  res.json({ success: true, message: "OTP sent successfully." });
};

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) return next(new AppError("Email and OTP are required.", 400));

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return next(new AppError("User not found.", 404));

  const otpDoc = await OTP.findOne({ userId: user._id, purpose: "email_verification" });
  if (!otpDoc) return next(new AppError("No OTP found. Please request a new one.", 400));

  if (otpDoc.attempts >= 5) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return next(new AppError("Max attempts reached. Please request a new OTP.", 403));
  }

  if (new Date() > otpDoc.expiry) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return next(new AppError("OTP has expired.", 400));
  }

  const isMatch = await otpDoc.compareOTP(otp);
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return next(new AppError(`Invalid OTP. Attempts left: ${5 - otpDoc.attempts}`, 401));
  }

  // Verify email and clean up OTP
  user.isEmailVerified = true;
  const profile = await Profile.findOne({ userId: user._id });
  user.trustScore = user.calculateTrustScore(profile);
  await user.save();
  await OTP.deleteOne({ _id: otpDoc._id });

  // Auto-login after verification
  const token = signToken(user._id);
  const payload = await buildUserPayload(user);

  res.json({ success: true, message: "Email verified successfully.", token, user: payload });
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  if (!user.isEmailVerified) {
    return next(new AppError("Please verify your email before logging in.", 403));
  }

  const token = signToken(user._id);

  // Fetch match stats
  const [matchesReceived, matchesAccepted] = await Promise.all([
    Match.countDocuments({ receiverId: user._id, status: "Pending" }),
    Match.countDocuments({
      $or: [
        { senderId: user._id, status: "Accepted" },
        { receiverId: user._id, status: "Accepted" }
      ]
    })
  ]);

  const payload = await buildUserPayload(user, { matchesReceived, matchesAccepted });
  res.json({ success: true, token, user: payload });
};

// ─── PATCH /api/auth/onboarding ──────────────────────────────────────────────
// Progressive save: each step sends its fields + step number.
// Steps 1-8 → Profile, Steps 10-11 → Preference, Step 12 → Profile.aboutMe
exports.saveOnboardingStep = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError("User not found.", 404));

  const { step, ...fields } = req.body;
  const stepNum = Number(step);
  if (!stepNum || stepNum < 1 || stepNum > 12) {
    return next(new AppError("Invalid onboarding step.", 400));
  }

  const profile = await Profile.findOne({ userId: user._id }) || await Profile.create({ userId: user._id });

  // ─── Step → field mapping (all profile-level except steps 10-11) ─────────
  const profileFieldMap = {
    1: ["createdFor", "gender", "maritalStatus"],  // User-level
    2: ["religion", "subCaste", "education"],
    3: [], // email/password already set at registration
    4: ["location.country", "livingInSince", "placeOfBirth", "nationality", "visaStatus"],
    5: ["ethnicity", "profession", "incomeRange"],  // frontend sends incomeRange
    6: ["location.state", "location.city", "livingWithFamily"],
    7: ["height", "weight", "bodyType", "familyStatus"],
    8: ["complexion", "lifestyle.diet", "lifestyle.drinking", "lifestyle.smoking"],
    9: ["twoFactorConsent"],
    12: ["bio"]   // frontend sends "bio"; KEY_ALIAS maps it → profile.aboutMe
  };

  // Steps 1: also update User-level fields
  // Note: frontend sends "creatingFor" (not "createdFor")
  if (stepNum === 1) {
    if (fields.creatingFor) user.createdFor = fields.creatingFor;
    if (fields.gender)        user.gender = fields.gender;
    if (fields.maritalStatus) user.maritalStatus = fields.maritalStatus;
    await user.save();
  }

  // Steps 2-8, 12: update Profile
  const profileFields = profileFieldMap[stepNum] || [];
  for (const fieldPath of profileFields) {
    // Skip User-level fields handled above
    if (["createdFor", "gender", "maritalStatus", "twoFactorConsent"].includes(fieldPath)) continue;

    const parts = fieldPath.split(".");
    if (parts.length === 2) {
      // Nested field (e.g. "location.country", "lifestyle.diet")
      const [parent, child] = parts;
      const sourceKey = child; // frontend sends flat keys like "country", "diet"
      if (fields[sourceKey] !== undefined) {
        if (!profile[parent]) profile[parent] = {};
        profile[parent][child] = fields[sourceKey];
        profile.markModified(parent);
      }
    } else {
      // Top-level field
      // Map frontend key aliases to Profile schema field names
      const KEY_ALIAS = { incomeRange: "income", bio: "aboutMe" };
      const key   = parts[0];
      const dbKey = KEY_ALIAS[key] || key;
      if (fields[key] !== undefined) {
        profile[dbKey] = fields[key];
      }
    }
  }

  // Steps 10-11: Partner Preferences
  if (stepNum === 10 || stepNum === 11) {
    let preference = await Preference.findOne({ userId: user._id }) ||
                     await Preference.create({ userId: user._id });

    const prefData = fields.partnerPreferences || fields;

    if (prefData.maritalStatus) preference.maritalStatus = prefData.maritalStatus;
    if (prefData.religions)     preference.religion = prefData.religions;
    if (prefData.education)     preference.education = prefData.education;
    if (prefData.countries)     preference.country = prefData.countries;
    if (prefData.minAge)        preference.ageRange.min = Number(prefData.minAge);
    if (prefData.maxAge)        preference.ageRange.max = Number(prefData.maxAge);
    if (prefData.drinkingPreference) preference.habits.drinking = prefData.drinkingPreference;
    if (prefData.smokingPreference)  preference.habits.smoking = prefData.smokingPreference;

    await preference.save();
  }

  // Advance step tracker
  if (stepNum >= user.onboardingStep) {
    user.onboardingStep = Math.min(12, stepNum + 1);
  }

  // Mark complete on last step
  if (stepNum === 12 && profile.aboutMe && profile.aboutMe.length >= 50) {
    user.isProfileComplete = true;
  }

  await profile.save();
  user.trustScore = user.calculateTrustScore(profile);
  await user.save();

  const payload = await buildUserPayload(user);
  res.json({ success: true, message: `Step ${stepNum} saved successfully.`, user: payload });
};

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError("User not found.", 404));

  const [matchesReceived, matchesAccepted] = await Promise.all([
    Match.countDocuments({ receiverId: user._id, status: "Pending" }),
    Match.countDocuments({
      $or: [
        { senderId: user._id, status: "Accepted" },
        { receiverId: user._id, status: "Accepted" }
      ]
    })
  ]);

  const payload = await buildUserPayload(user, { matchesReceived, matchesAccepted });
  res.json({ success: true, user: payload });
};

// ─── POST /api/auth/upload-photo ─────────────────────────────────────────────
exports.uploadProfilePhoto = async (req, res, next) => {
  if (!req.file) return next(new AppError("Profile image is required.", 400));

  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError("User not found.", 404));

  const profile = await Profile.findOne({ userId: user._id }) || await Profile.create({ userId: user._id });

  // Upload buffer to ImageKit — returns { url, fileId }
  const ext      = path.extname(req.file.originalname).toLowerCase() || ".jpg";
  const fileName = `profile-${user._id}${ext}`;
  const { url: imageUrl } = await uploadToImageKit(req.file.buffer, fileName, "/knot/profiles");

  profile.profileImage = imageUrl;   // store the full https://ik.imagekit.io/... URL
  await profile.save();

  user.trustScore = user.calculateTrustScore(profile);
  await user.save();

  const payload = await buildUserPayload(user);
  res.json({ success: true, message: "Profile photo uploaded successfully.", user: payload });
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return next(new AppError("User not found.", 404));

  const otpCode = generateOTP();
  await OTP.findOneAndDelete({ userId: user._id, purpose: "password_reset" });
  await OTP.create({ userId: user._id, otp: otpCode, purpose: "password_reset" });

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP",
      message: `Your password reset code is ${otpCode}. It expires in 5 minutes.`,
      html: `<p>Your password reset code is: <strong>${otpCode}</strong></p>`
    });
  } catch (err) {
    return next(new AppError("Error sending email.", 500));
  }

  res.json({ success: true, message: "Reset OTP sent to email." });
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return next(new AppError("All fields are required.", 400));
  if (newPassword.length < 8) return next(new AppError("Password must be at least 8 characters.", 400));

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return next(new AppError("User not found.", 404));

  const otpDoc = await OTP.findOne({ userId: user._id, purpose: "password_reset" });
  if (!otpDoc) return next(new AppError("No reset OTP found. Please request a new one.", 400));

  if (new Date() > otpDoc.expiry) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return next(new AppError("OTP expired.", 400));
  }

  const isMatch = await otpDoc.compareOTP(otp);
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return next(new AppError("Invalid OTP.", 401));
  }

  user.password = newPassword;
  await user.save();
  await OTP.deleteOne({ _id: otpDoc._id });

  res.json({ success: true, message: "Password reset successful. You can now log in." });
};

// ─── GET /api/auth/constants ─────────────────────────────────────────────────
exports.getConstants = (_req, res) => {
  const C = require("../utils/constants");
  res.json({
    genders: C.GENDERS,
    creatingFor: C.CREATING_FOR,
    maritalStatuses: C.MARITAL_STATUSES,
    religions: C.RELIGIONS,
    educationLevels: C.EDUCATION_LEVELS,
    countries: C.COUNTRIES,
    visaStatuses: C.VISA_STATUSES,
    nationalities: C.NATIONALITIES,
    ethnicities: C.ETHNICITIES,
    professions: C.PROFESSIONS,
    incomeRanges: C.INCOME_RANGES,
    indianStates: C.INDIAN_STATES,
    bodyTypes: C.BODY_TYPES,
    familyStatuses: C.FAMILY_STATUSES,
    complexions: C.COMPLEXIONS,
    diets: C.DIETS,
    drinkingHabits: C.DRINKING_HABITS,
    smokingHabits: C.SMOKING_HABITS,
    heights: C.HEIGHTS
  });
};

// ─── DELETE /api/auth/account ─────────────────────────────────────────────────
// Permanently deletes all data for the authenticated user.
// Requires password confirmation as a safety gate.
exports.deleteAccount = async (req, res, next) => {
  const { password } = req.body;
  if (!password) return next(new AppError("Password confirmation is required to delete your account.", 400));

  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(new AppError("User not found.", 404));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new AppError("Incorrect password. Account deletion cancelled.", 401));

  const userId = user._id;

  // Cascade-delete all user data
  await Promise.all([
    Profile.deleteOne({ userId }),
    Preference.deleteOne({ userId }),
    OTP.deleteMany({ userId }),
    require("../models/Document").deleteOne({ userId }),
    Match.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
    require("../models/AdminLog").deleteMany({ targetUser: userId })
  ]);

  await User.deleteOne({ _id: userId });

  logger.info(`[AUTH] Account permanently deleted: ${userId}`);
  res.json({ success: true, message: "Your account and all associated data have been permanently deleted." });
};
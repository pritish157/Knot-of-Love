"use strict";
const User    = require("../models/User");
const Profile = require("../models/Profile");
const Match   = require("../models/Match");
const Preference = require("../models/Preference");
const AppError = require("../utils/AppError");

/**
 * GET /api/profiles
 * Browse profiles with full filter support matching all frontend filter params.
 */
exports.getProfiles = async (req, res, next) => {
  // ── KYC gate: only admin-verified users can browse profiles ───────────────
  if (!req.user.isProfileVerified && req.user.role !== "Admin") {
    return next(new AppError(
      "Your profile must be verified by admin before you can browse matches. Please complete KYC.",
      403
    ));
  }

  const {
    minAge, maxAge, religion, state, city, location,
    maritalStatus, gender, caste, motherTongue, income,
    page = 1, limit = 20
  } = req.query;

  // Fetch all matches to exclude people we've already interacted with
  const Match = require("../models/Match");
  const existingMatches = await Match.find({
    $or: [{ senderId: req.user.id }, { receiverId: req.user.id }]
  }).select("senderId receiverId").lean();

  const excludeIds = existingMatches.map(m => 
    m.senderId.toString() === req.user.id ? m.receiverId : m.senderId
  );
  excludeIds.push(req.user.id);

  // ── User-level filters ────────────────────────────────────────────────────
  const userFilter = {
    _id: { $nin: excludeIds },
    isEmailVerified: true,
    isProfileComplete: true
  };

  // Age filter by DOB
  if (minAge || maxAge) {
    const now = new Date();
    if (maxAge) {
      const minDob = new Date(now.getFullYear() - Number(maxAge), now.getMonth(), now.getDate());
      userFilter.dob = { ...userFilter.dob, $gte: minDob };
    }
    if (minAge) {
      const maxDob = new Date(now.getFullYear() - Number(minAge), now.getMonth(), now.getDate());
      userFilter.dob = { ...userFilter.dob, $lte: maxDob };
    }
  }

  // ── Opposite-gender filter (enforced server-side, not client-controlled) ──
  // Male users see only Female profiles, Female users see only Male profiles.
  const oppositeGender = req.user.gender === "Male" ? "Female"
                       : req.user.gender === "Female" ? "Male"
                       : null; // Admins / unknown gender → no restriction
  if (oppositeGender) userFilter.gender = oppositeGender;

  if (maritalStatus) userFilter.maritalStatus = maritalStatus;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(userFilter)
      .select("name gender dob maritalStatus isProfileVerified trustScore profileViews")
      .sort("-trustScore -createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(userFilter)
  ]);

  const userIds = users.map(u => u._id);

  // ── Profile-level filters ─────────────────────────────────────────────────
  // "location" from the frontend sidebar is treated as a city name
  const profileFilter = { userId: { $in: userIds } };
  if (religion)     profileFilter.religion = religion;
  if (state)        profileFilter["location.state"] = state;
  if (city)         profileFilter["location.city"] = new RegExp(city, "i");
  if (location)     profileFilter["location.city"] = new RegExp(location, "i");
  if (caste)        profileFilter.subCaste = caste;
  if (motherTongue) profileFilter.motherTongue = motherTongue;
  if (income)       profileFilter.income = income;

  const profiles = await Profile.find(profileFilter).lean();
  const profileMap = {};
  for (const p of profiles) profileMap[p.userId.toString()] = p;

  const viewerVerified = req.user.isProfileVerified;

  const result = users
    .filter(u => profileMap[u._id.toString()])
    .map(u => {
      const p = profileMap[u._id.toString()];
      const age = u.dob
        ? Math.floor((Date.now() - new Date(u.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;
      return {
        _id: u._id,
        name: u.name,
        age,
        gender: u.gender,
        maritalStatus: u.maritalStatus,
        religion: p.religion,
        education: p.education,
        profession: p.profession,
        incomeRange: p.income,
        location: p.location?.city && p.location?.state
          ? `${p.location.city}, ${p.location.state}`
          : p.location?.state || "",
        height: p.height,
        bodyType: p.bodyType,
        complexion: p.complexion,
        bio: p.aboutMe,
        motherTongue: p.motherTongue,
        isVerified: u.isProfileVerified,
        trustScore: u.trustScore,
        image: p.profileImage
          ? (p.profileImage.startsWith("http") ? p.profileImage : `/uploads/profiles/${p.profileImage}`)
          : "",
        isBlurred: !viewerVerified,
        profileViews: u.profileViews
      };
    });

  res.json({
    success: true,
    profiles: result,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
};

/**
 * GET /api/profiles/:userId
 * View a single profile — increments view count
 */
exports.getProfileById = async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    .select("-password -resetPasswordToken -resetPasswordExpires");

  if (!user) return next(new AppError("Profile not found.", 404));

  const profile = await Profile.findOne({ userId: user._id }).lean();

  // Increment views (don't count self-views)
  if (req.user.id !== req.params.userId) {
    await User.updateOne({ _id: req.params.userId }, { $inc: { profileViews: 1 } });
  }

  const age = user.dob
    ? Math.floor((Date.now() - new Date(user.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  res.json({
    success: true,
    profile: {
      _id: user._id,
      memberId: user.memberId,
      name: user.name,
      age,
      gender: user.gender,
      maritalStatus: user.maritalStatus,
      religion: profile?.religion || "",
      subCaste: profile?.subCaste || "",
      education: profile?.education || "",
      profession: profile?.profession || "",
      incomeRange: profile?.income || "",
      state:   profile?.location?.state || "",
      city:    profile?.location?.city || "",
      country: profile?.location?.country || "",
      height:  profile?.height || "",
      weight:  profile?.weight || null,
      bodyType:   profile?.bodyType || "",
      complexion: profile?.complexion || "",
      diet:     profile?.lifestyle?.diet || "",
      drinking: profile?.lifestyle?.drinking || "",
      smoking:  profile?.lifestyle?.smoking || "",
      bio: profile?.aboutMe || "",
      ethnicity: profile?.ethnicity || "",
      familyStatus: profile?.familyStatus || "",
      livingWithFamily: profile?.livingWithFamily || "",
      isVerified: user.isProfileVerified,
      trustScore: user.trustScore,
      image: profile?.profileImage
        ? (profile.profileImage.startsWith("http") ? profile.profileImage : `/uploads/profiles/${profile.profileImage}`)
        : "",
      isBlurred: !req.user.isProfileVerified
    }
  });
};

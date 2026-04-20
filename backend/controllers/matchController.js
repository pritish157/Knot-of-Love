"use strict";
const Match      = require("../models/Match");
const User       = require("../models/User");
const Profile    = require("../models/Profile");
const Preference = require("../models/Preference");
const AppError   = require("../utils/AppError");
const sendEmail  = require("../utils/sendEmail");
const logger     = require("../utils/logger");

// ─── Helper: format image URL ─────────────────────────────────────────────────
function fmtImage(img) {
  if (!img) return "";
  return img.startsWith("http") ? img : `/uploads/profiles/${img}`;
}

/**
 * POST /api/matches/request
 * Express interest in another user. Sends email notification to receiver.
 */
exports.requestMatch = async (req, res, next) => {
  const { targetUserId } = req.body;
  const senderId = req.user.id;

  if (!targetUserId) return next(new AppError("targetUserId is required", 400));
  if (targetUserId === senderId) return next(new AppError("You cannot send interest to yourself", 400));

  const receiver = await User.findById(targetUserId);
  if (!receiver) return next(new AppError("User not found", 404));

  const existing = await Match.findOne({
    $or: [
      { senderId, receiverId: targetUserId },
      { senderId: targetUserId, receiverId: senderId }
    ]
  });
  if (existing) return next(new AppError(`Interest already exists with status: ${existing.status}`, 409));

  const match = await Match.create({ senderId, receiverId: targetUserId, status: "Pending" });

  // ── Email notification to receiver ────────────────────────────────────────
  const sender = await User.findById(senderId).select("name memberId");
  try {
    await sendEmail({
      email: receiver.email,
      subject: `💌 ${sender.name} is interested in you on Knot of Love`,
      message: `${sender.name} (${sender.memberId}) has expressed interest in your profile on Knot of Love. Log in to view their profile and respond.`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px">
          <h2 style="color:#c22d45">💌 New Interest on Knot of Love</h2>
          <p>Hi <strong>${receiver.name}</strong>,</p>
          <p><strong>${sender.name}</strong> (Member ID: ${sender.memberId}) has expressed interest in your profile.</p>
          <p>Log in to your dashboard to view their full profile and respond.</p>
          <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard"
             style="display:inline-block;margin-top:16px;padding:12px 24px;background:#c22d45;color:white;border-radius:8px;text-decoration:none;font-weight:700">
            View Interest →
          </a>
          <p style="margin-top:24px;color:#888;font-size:0.82rem">— Knot of Love Team</p>
        </div>`
    });
  } catch (e) {
    logger.warn(`[MATCH] Email notification failed for ${receiver.email}: ${e.message}`);
  }

  res.status(201).json({ success: true, message: "Interest request sent successfully", match });
};

/**
 * POST /api/matches/respond
 * Accept or Reject a pending interest. Notifies sender on acceptance.
 */
exports.respondMatch = async (req, res, next) => {
  const { matchId, status } = req.body;
  if (!matchId) return next(new AppError("matchId is required", 400));
  if (!["Accepted", "Rejected", "Blocked"].includes(status)) {
    return next(new AppError("Invalid response status", 400));
  }

  const match = await Match.findById(matchId);
  if (!match) return next(new AppError("Request not found", 404));

  if (match.receiverId.toString() !== req.user.id) {
    return next(new AppError("You are not authorized to respond to this request", 403));
  }

  match.status = status;
  match.actionDate = new Date();
  await match.save();

  if (status === "Accepted") {
    await User.updateMany(
      { _id: { $in: [match.senderId, match.receiverId] } },
      { $inc: { trustScore: 2 } }
    );

    // ── Email notification to original sender ─────────────────────────────
    const [sender, receiver] = await Promise.all([
      User.findById(match.senderId).select("name email"),
      User.findById(match.receiverId).select("name memberId")
    ]);
    try {
      await sendEmail({
        email: sender.email,
        subject: `🎉 ${receiver.name} accepted your interest on Knot of Love`,
        message: `Great news! ${receiver.name} has accepted your interest. You can now exchange messages on your dashboard.`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px">
            <h2 style="color:#065f46">🎉 Interest Accepted!</h2>
            <p>Hi <strong>${sender.name}</strong>,</p>
            <p><strong>${receiver.name}</strong> has accepted your interest on Knot of Love!</p>
            <p>You can now exchange messages and share details.</p>
            <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard"
               style="display:inline-block;margin-top:16px;padding:12px 24px;background:#065f46;color:white;border-radius:8px;text-decoration:none;font-weight:700">
              Start Conversation →
            </a>
            <p style="margin-top:24px;color:#888;font-size:0.82rem">— Knot of Love Team</p>
          </div>`
      });
    } catch (e) {
      logger.warn(`[MATCH] Acceptance email failed: ${e.message}`);
    }
  }

  res.json({ success: true, message: `Interest ${status.toLowerCase()} successfully`, status });
};

/**
 * GET /api/matches/active
 * Accepted matches for the logged-in user.
 */
exports.getMatches = async (req, res, next) => {
  const matches = await Match.find({
    $or: [
      { senderId: req.user.id, status: "Accepted" },
      { receiverId: req.user.id, status: "Accepted" }
    ]
  }).lean();

  const otherIds = matches.map(m =>
    m.senderId.toString() === req.user.id ? m.receiverId : m.senderId
  );

  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: otherIds } }).select("name gender maritalStatus isProfileVerified").lean(),
    Profile.find({ userId: { $in: otherIds } }).select("userId profileImage").lean()
  ]);

  const userMap    = {};  for (const u of users)    userMap[u._id.toString()]    = u;
  const profileMap = {};  for (const p of profiles) profileMap[p.userId.toString()] = p;

  const formatted = matches.map(m => {
    const otherId = m.senderId.toString() === req.user.id
      ? m.receiverId.toString() : m.senderId.toString();
    const other        = userMap[otherId]    || {};
    const otherProfile = profileMap[otherId] || {};
    return {
      matchId: m._id,
      user: {
        _id: other._id, name: other.name, gender: other.gender,
        maritalStatus: other.maritalStatus, isVerified: other.isProfileVerified,
        image: fmtImage(otherProfile.profileImage)
      },
      since: m.actionDate
    };
  });

  res.json({ success: true, matches: formatted });
};

/**
 * GET /api/matches/incoming
 * Pending interests received by the logged-in user (with sender profile).
 */
exports.getIncoming = async (req, res, next) => {
  const pending = await Match.find({
    receiverId: req.user.id,
    status: "Pending"
  }).sort("-createdAt").lean();

  const senderIds = pending.map(m => m.senderId);

  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: senderIds } })
      .select("name gender dob maritalStatus memberId isProfileVerified trustScore")
      .lean(),
    Profile.find({ userId: { $in: senderIds } })
      .select("userId profileImage religion education profession income location aboutMe height")
      .lean()
  ]);

  const userMap    = {};  for (const u of users)    userMap[u._id.toString()]    = u;
  const profileMap = {};  for (const p of profiles) profileMap[p.userId.toString()] = p;

  const result = pending.map(m => {
    const u = userMap[m.senderId.toString()]    || {};
    const p = profileMap[m.senderId.toString()] || {};
    const age = u.dob
      ? Math.floor((Date.now() - new Date(u.dob)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    return {
      matchId:   m._id,
      senderId:  m.senderId,
      sentAt:    m.createdAt,
      name:      u.name,
      memberId:  u.memberId,
      age,
      gender:    u.gender,
      maritalStatus: u.maritalStatus,
      isVerified:    u.isProfileVerified,
      trustScore:    u.trustScore,
      image:         fmtImage(p.profileImage),
      religion:      p.religion  || "",
      education:     p.education || "",
      profession:    p.profession || "",
      income:        p.income    || "",
      height:        p.height    || "",
      location:      p.location?.city && p.location?.state
        ? `${p.location.city}, ${p.location.state}` : "",
      bio:           p.aboutMe   || ""
    };
  });

  res.json({ success: true, incoming: result });
};

/**
 * DELETE /api/matches/withdraw/:matchId
 * Cancel / withdraw a Pending interest. Only the original sender can do this.
 */
exports.withdrawMatch = async (req, res, next) => {
  const match = await Match.findById(req.params.matchId);
  if (!match) return next(new AppError("Interest not found", 404));

  if (match.senderId.toString() !== req.user.id) {
    return next(new AppError("Only the sender can withdraw an interest", 403));
  }

  if (match.status !== "Pending") {
    return next(new AppError(`Cannot withdraw a ${match.status} interest`, 400));
  }

  await Match.deleteOne({ _id: match._id });
  res.json({ success: true, message: "Interest withdrawn successfully" });
};

/**
 * GET /api/matches/sent
 * Interests the logged-in user has sent, with their current status.
 */
exports.getSent = async (req, res, next) => {
  const sent = await Match.find({ senderId: req.user.id }).sort("-createdAt").lean();

  const receiverIds = sent.map(m => m.receiverId);
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: receiverIds } }).select("name gender isProfileVerified memberId").lean(),
    Profile.find({ userId: { $in: receiverIds } }).select("userId profileImage").lean()
  ]);

  const userMap    = {};  for (const u of users)    userMap[u._id.toString()]    = u;
  const profileMap = {};  for (const p of profiles) profileMap[p.userId.toString()] = p;

  const result = sent.map(m => {
    const u = userMap[m.receiverId.toString()]    || {};
    const p = profileMap[m.receiverId.toString()] || {};
    return {
      matchId:   m._id,
      receiverId: m.receiverId,
      status:    m.status,
      sentAt:    m.createdAt,
      name:      u.name,
      memberId:  u.memberId,
      gender:    u.gender,
      isVerified: u.isProfileVerified,
      image:     fmtImage(p.profileImage)
    };
  });

  res.json({ success: true, sent: result });
};

/**
 * GET /api/matches/recommend
 */
exports.getRecommended = async (req, res, next) => {
  const viewer = await User.findById(req.user.id);
  if (!viewer) return next(new AppError("User not found.", 404));

  const [viewerProfile, viewerPrefs] = await Promise.all([
    Profile.findOne({ userId: viewer._id }).lean(),
    Preference.findOne({ userId: viewer._id }).lean()
  ]);

  const userFilter = {
    _id: { $ne: viewer._id },
    gender: viewer.gender === "Male" ? "Female" : "Male",
    isEmailVerified: true,
    isProfileComplete: true
  };

  const users = await User.find(userFilter)
    .select("name gender dob maritalStatus isProfileVerified trustScore").lean();
  const userIds = users.map(u => u._id);
  const profiles = await Profile.find({ userId: { $in: userIds } }).lean();
  const profileMap = {};
  for (const p of profiles) profileMap[p.userId.toString()] = p;

  const now = new Date();
  const viewerPrefAgeMin   = viewerPrefs?.ageRange?.min  || 18;
  const viewerPrefAgeMax   = viewerPrefs?.ageRange?.max  || 50;
  const viewerPrefReligions = viewerPrefs?.religion || [];

  const recommendations = [];
  for (const u of users) {
    const p = profileMap[u._id.toString()];
    if (!p) continue;

    let score = 0;
    const age = u.dob
      ? Math.floor((now - new Date(u.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

    if (age && age >= viewerPrefAgeMin && age <= viewerPrefAgeMax) score += 25;
    else if (age) {
      const diff = Math.min(Math.abs(age - viewerPrefAgeMin), Math.abs(age - viewerPrefAgeMax));
      if (diff <= 3) score += 10;
    }

    if (p.religion && viewerPrefReligions.includes(p.religion)) score += 25;
    else if (!viewerPrefReligions.length) score += 25;

    if (p.location?.state === viewerProfile?.location?.state) {
      score += 25;
      if (p.location?.city === viewerProfile?.location?.city) score += 5;
    } else if (p.location?.country === viewerProfile?.location?.country) score += 15;

    if (p.lifestyle?.diet     === viewerProfile?.lifestyle?.diet)     score += 10;
    if (p.lifestyle?.smoking  === viewerProfile?.lifestyle?.smoking)  score += 7.5;
    if (p.lifestyle?.drinking === viewerProfile?.lifestyle?.drinking) score += 7.5;

    recommendations.push({
      _id: u._id, name: u.name, age, gender: u.gender,
      maritalStatus: u.maritalStatus, religion: p.religion,
      education: p.education, profession: p.profession,
      location: p.location?.city && p.location?.state
        ? `${p.location.city}, ${p.location.state}` : "",
      matchScore: Math.min(99, Math.round(score)),
      isVerified: u.isProfileVerified, trustScore: u.trustScore,
      image: fmtImage(p.profileImage),
      isBlurred: !req.user.isProfileVerified
    });
  }

  recommendations.sort((a, b) => b.matchScore - a.matchScore || b.trustScore - a.trustScore);
  res.json({ success: true, count: recommendations.length, profiles: recommendations.slice(0, 30) });
};

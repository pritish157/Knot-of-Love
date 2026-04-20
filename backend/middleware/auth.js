"use strict";
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");
const AppError = require("../utils/AppError");

/**
 * Protect middleware — verifies Bearer JWT and populates req.user with full user fields
 * needed for RBAC, trust checks, and privacy logic.
 */
module.exports = async function protect(req, _res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authentication required. Please sign in.", 401));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new AppError("Authentication required. Please sign in.", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    if (!decoded?.user?.id) {
      return next(new AppError("Malformed token. Please sign in again.", 401));
    }

    // Load user from DB to get fresh role, verification status, and gender
    const user = await User.findById(decoded.user.id).select(
      "role isEmailVerified isPhoneVerified isProfileVerified trustScore gender tokenVersion"
    );

    if (!user) {
      return next(new AppError("User no longer exists.", 401));
    }

    if (user.tokenVersion !== decoded.user.tv) {
      return next(new AppError("Session invalidated. Please sign in again.", 401));
    }

    req.user = {
      id: decoded.user.id,
      role: user.role,
      gender: user.gender,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isProfileVerified: user.isProfileVerified,
      trustScore: user.trustScore
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please sign in again.", 401));
    }
    return next(new AppError("Invalid token. Please sign in again.", 401));
  }
};
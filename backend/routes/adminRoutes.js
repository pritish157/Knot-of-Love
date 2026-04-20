"use strict";
const express   = require("express");
const router    = express.Router();
const protect   = require("../middleware/auth");
const authorize = require("../middleware/rbac");
const {
  getContactEmail,
  getStats,
  getPendingUsers,
  approveUser,
  rejectUser,
  getMembers,
  getActivity,
  getReports,
  flagUser
} = require("../controllers/adminController");

// ── Public route (no auth) ────────────────────────────────────────────────────
// Must be declared BEFORE router.use(protect) so guests can fetch it.
router.get("/contact-email", getContactEmail);

// 🔒 All routes below are Admin Only
router.use(protect);
router.use(authorize("Admin"));

router.get("/stats",          getStats);
router.get("/pending-users",  getPendingUsers);
router.get("/members",        getMembers);
router.get("/activity",       getActivity);
router.get("/reports",        getReports);
router.post("/approve",       approveUser);
router.post("/reject",        rejectUser);
router.post("/flag/:userId",  flagUser);

module.exports = router;

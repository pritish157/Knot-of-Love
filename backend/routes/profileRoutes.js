"use strict";
const express = require("express");
const router = express.Router();
const { query } = require("express-validator");
const protect = require("../middleware/auth");
const { getProfiles, getProfileById } = require("../controllers/profileController");

router.use(protect);

// ✅ Specific routes BEFORE parameterized routes to prevent wildcard capture
router.get(
  "/",
  [
    query("minAge").optional().isInt({ min: 18 }).withMessage("minAge must be 18+."),
    query("maxAge").optional().isInt({ max: 80 }).withMessage("maxAge must be under 80."),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 })
  ],
  getProfiles
);

router.get("/:userId", getProfileById);

module.exports = router;

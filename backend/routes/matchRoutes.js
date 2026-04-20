"use strict";
const express = require("express");
const router  = express.Router();
const protect = require("../middleware/auth");
const {
  getRecommended,
  requestMatch,
  respondMatch,
  getMatches,
  getIncoming,
  getSent,
  withdrawMatch,
  unmatchUser,
  blockUser,
  unblockUser,
  archiveMatch,
  unarchiveMatch,
  reportUser,
  getHidden
} = require("../controllers/matchController");

router.use(protect);

router.get("/recommend", getRecommended);
router.get("/active",    getMatches);
router.get("/incoming",  getIncoming);
router.get("/sent",      getSent);
router.get("/hidden",    getHidden);
router.post("/request",  requestMatch);
router.post("/respond",  respondMatch);
router.delete("/withdraw/:matchId", withdrawMatch);

// Match Management Routes
router.post("/unmatch/:matchId", unmatchUser);
router.post("/block/:matchId", blockUser);
router.post("/unblock/:matchId", unblockUser);
router.post("/archive/:matchId", archiveMatch);
router.post("/unarchive/:matchId", unarchiveMatch);
router.post("/report/:matchId", reportUser);

module.exports = router;

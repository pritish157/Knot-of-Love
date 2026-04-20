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
  withdrawMatch
} = require("../controllers/matchController");

router.use(protect);

router.get("/recommend", getRecommended);
router.get("/active",    getMatches);
router.get("/incoming",  getIncoming);
router.get("/sent",      getSent);
router.post("/request",  requestMatch);
router.post("/respond",  respondMatch);
router.delete("/withdraw/:matchId", withdrawMatch);

module.exports = router;

"use strict";
const express = require("express");
const router  = express.Router();
const protect = require("../middleware/auth");
const { sendMessage, getMessages, getUnreadCount } = require("../controllers/messageController");

router.use(protect);

router.get("/unread-count",   getUnreadCount);
router.post("/send",          sendMessage);
router.get("/:matchId",       getMessages);

module.exports = router;

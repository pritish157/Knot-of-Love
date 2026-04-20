"use strict";
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");

router.use(protect);

router.get("/", getNotifications);
router.post("/read-all", markAllAsRead);
router.post("/read/:id", markAsRead);

module.exports = router;

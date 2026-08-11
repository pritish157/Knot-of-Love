"use strict";
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getNotifications, markAsRead, markAllAsRead, saveFcmToken } = require("../controllers/notificationController");

router.use(protect);

router.get("/", getNotifications);
router.post("/read-all", markAllAsRead);
router.post("/read/:id", markAsRead);
router.put("/fcm-token", saveFcmToken);

module.exports = router;

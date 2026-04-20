"use strict";
const express = require("express");
const router  = express.Router();
const protect = require("../middleware/auth");
const { uploadKYC, getKYCStatus } = require("../controllers/kycController");
const { documentUpload } = require("../middleware/upload");

router.use(protect);

router.get("/status",  getKYCStatus);
router.post("/upload", documentUpload.single("document"), uploadKYC);

module.exports = router;

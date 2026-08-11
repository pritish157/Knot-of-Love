"use strict";
const admin  = require("firebase-admin");
const logger = require("../utils/logger");

function initFirebase() {
  try {
    // Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
      logger.warn("[Firebase] Missing credentials in environment variables. Push notifications disabled.");
      return null;
    }

    // Handle escaped newlines in environment variables for the private key
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });

    logger.info("[Firebase] Admin SDK initialized successfully.");
    return admin.messaging();
  } catch (error) {
    logger.error(`[Firebase] Initialization error: ${error.message}`);
    return null;
  }
}

const messaging = initFirebase();

module.exports = { messaging, admin };

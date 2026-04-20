"use strict";
const mongoose = require("mongoose");
const logger   = require("../utils/logger");

const connectDB = async (retries = 5) => {
  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45_000
      });
      logger.info(`[DB] Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      retries -= 1;
      logger.error(`[DB] Connection failed. Retries left: ${retries}. Error: ${err.message}`);
      if (retries === 0) {
        logger.error("[DB] Could not connect to MongoDB. Exiting.");
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

// ─── Reconnection logging ─────────────────────────────────────────────────────
mongoose.connection.on("disconnected", () =>
  logger.warn("[DB] MongoDB disconnected. Mongoose will attempt to reconnect.")
);
mongoose.connection.on("reconnected", () =>
  logger.info("[DB] MongoDB reconnected.")
);
mongoose.connection.on("error", (err) =>
  logger.error(`[DB] Runtime error: ${err.message}`)
);

module.exports = connectDB;
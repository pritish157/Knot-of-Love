"use strict";

const https  = require("https");
const http   = require("http");
const logger = require("./logger");

/**
 * Periodically pings the server URL to prevent Render from sleeping due to inactivity,
 * and pings MongoDB to keep the database connection warm.
 * 
 * @param {string} url - External URL to ping (e.g. https://knot-of-love.onrender.com/ping)
 * @param {number} intervalMinutes - Frequency in minutes (default: 5 minutes)
 */
function startKeepAlive(url, intervalMinutes = 5) {
  const pingUrl = url || process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;

  if (!pingUrl) {
    logger.info("[KEEP-ALIVE] No ping URL defined (RENDER_EXTERNAL_URL / BACKEND_URL). Skipping self-ping.");
    return;
  }

  const target = pingUrl.endsWith("/ping") ? pingUrl : `${pingUrl.replace(/\/$/, "")}/ping`;
  const intervalMs = intervalMinutes * 60 * 1000;

  logger.info(`[KEEP-ALIVE] Self-ping active for ${target} every ${intervalMinutes} minute(s).`);

  // Initial ping after 30 seconds
  setTimeout(() => sendPing(target), 30_000);

  // Recurring ping interval
  setInterval(() => sendPing(target), intervalMs);
}

function sendPing(targetUrl) {
  const client = targetUrl.startsWith("https") ? https : http;
  
  client.get(targetUrl, (res) => {
    logger.info(`[KEEP-ALIVE] Ping sent to ${targetUrl} | Status: ${res.statusCode}`);
  }).on("error", (err) => {
    logger.error(`[KEEP-ALIVE] Ping error: ${err.message}`);
  });
}

module.exports = startKeepAlive;

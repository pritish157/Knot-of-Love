"use strict";

// ─── bootstrap: loads .env before anything else ───────────────────────────────
require("dotenv").config();
require("express-async-errors"); // patches async route handlers — unhandled rejections → error middleware

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const compression  = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit    = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const morgan       = require("morgan");
const path         = require("path");
const hpp          = require("hpp");
const xss          = require("xss-clean");

const connectDB     = require("./config/db");
const logger        = require("./utils/logger");
const AppError      = require("./utils/AppError");
const errorHandler  = require("./middleware/errorHandler");

// ─── Validate mandatory env vars at boot ─────────────────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  logger.error(`[BOOT] Missing required env vars: ${missing.join(", ")}. Aborting.`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  logger.error("[BOOT] JWT_SECRET is too short. Use at least 32 random characters. Aborting.");
  process.exit(1);
}

const app = express();

// ─── Trust proxy (needed for rate-limit + IP detection behind nginx/heroku) ──
app.set("trust proxy", 1);

// ─── Resolve Client URL ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.imagekit.io", "https://randomuser.me", "https://ui-avatars.com"],
        connectSrc: ["'self'", ...allowedOrigins, "https://upload.imagekit.io"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false // allow images from /uploads
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / health checks (no origin header)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new AppError("Not allowed by CORS policy.", 403));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400 // cache preflight 24 h
  })
);

// ─── Compression (gzip) ───────────────────────────────────────────────────────
app.use(compression());

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// 10 kb hard cap — prevents large-payload DoS attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser());

// ─── HPP — HTTP Parameter Pollution Prevention ────────────────────────────────
// Strips duplicate query params to prevent array injection tricks
app.use(hpp());

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────
// Strips $ and . from req.body, req.params, req.query
app.use(mongoSanitize());

// ─── XSS Sanitization ─────────────────────────────────────────────────────────
// Sanitizes user input to prevent HTML/JS injection
app.use(xss());

// ─── Request Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
  app.use(
    morgan(morganFormat, {
      stream: { write: (msg) => logger.http(msg.trim()) }
    })
  );
}

// ─── Global Rate Limiter (300 req / 15 min per IP) ───────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
  skip: (req) => req.path === "/health" // health checks bypass
});
app.use(globalLimiter);

// NOTE: /uploads static route removed — images are now served via ImageKit CDN.

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/profiles", require("./routes/profileRoutes"));
app.use("/api/kyc",      require("./routes/kycRoutes"));
app.use("/api/matches",  require("./routes/matchRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin",    require("./routes/adminRoutes"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date().toISOString() })
);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
  next(new AppError("Route not found.", 404));
});

// ─── Global Error Handler (extracted to middleware/errorHandler.js) ───────────
app.use(errorHandler);

const { initSocket } = require("./sockets/chatSocket");

// ─── Boot ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  const PORT = parseInt(process.env.PORT, 10) || 5000;
  const server = app.listen(PORT, () =>
    logger.info(`[SERVER] Port ${PORT} | env: ${process.env.NODE_ENV || "development"}`)
  );

  // Initialize WebSockets
  initSocket(server, allowedOrigins);

  // Graceful shutdown — drain existing connections before exit
  function shutdown(signal) {
    logger.warn(`[SERVER] ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.warn("[SERVER] HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      logger.error("[SERVER] Forced shutdown after 10 s.");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
});

// ─── Unhandled rejections / uncaught exceptions ───────────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.error("[PROCESS] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  logger.error("[PROCESS] Uncaught exception:", err);
  process.exit(1); // always crash on uncaught exceptions
});
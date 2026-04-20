"use strict";
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const logger = require("../utils/logger");

let io;
// Keep track of connected users: { userId: socketId }
const connectedUsers = new Map();

exports.initSocket = (server, allowedOrigins) => {
  io = socketIo(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.user.id).select("tokenVersion");
      if (!user || user.tokenVersion !== decoded.user.tv) {
        return next(new Error("Authentication error: Invalid session"));
      }
      
      socket.user = decoded.user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    connectedUsers.set(userId, socket.id);
    
    // Join a personal room for the user to easily route events to them
    socket.join(`user_${userId}`);
    
    logger.info(`[SOCKET] User connected: ${userId} (${socket.id})`);

    // Notify friends/matches they are online (optional later)

    socket.on("join_match", (matchId) => {
      socket.join(`match_${matchId}`);
    });

    socket.on("leave_match", (matchId) => {
      socket.leave(`match_${matchId}`);
    });

    socket.on("typing", ({ matchId, receiverId }) => {
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        socket.to(receiverSocket).emit("typing", { matchId, senderId: userId });
      }
    });

    socket.on("stop_typing", ({ matchId, receiverId }) => {
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        socket.to(receiverSocket).emit("stop_typing", { matchId, senderId: userId });
      }
    });

    socket.on("mark_seen", async ({ matchId, senderId }) => {
      try {
        await Message.updateMany(
          { matchId, senderId, isRead: false },
          { isRead: true }
        );
        const receiverSocket = connectedUsers.get(senderId);
        if (receiverSocket) {
          socket.to(receiverSocket).emit("messages_seen", { matchId, seenBy: userId });
        }
      } catch (err) {
        logger.error(`[SOCKET] mark_seen error: ${err.message}`);
      }
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      logger.info(`[SOCKET] User disconnected: ${userId}`);
    });
  });

  return io;
};

exports.getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

exports.getConnectedUserSocket = (userId) => {
  return connectedUsers.get(userId.toString());
};

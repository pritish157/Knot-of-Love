"use strict";
const Notification = require("../models/Notification");
const { getIo, getConnectedUserSocket } = require("../sockets/chatSocket");
const logger = require("./logger");

/**
 * Creates a notification in the DB and emits it via socket.io if the user is online.
 */
exports.createAndEmitNotification = async ({ receiverId, senderId, type, matchId, title, body, actionUrl }) => {
  try {
    const notification = await Notification.create({
      receiverId,
      senderId,
      type,
      matchId,
      title,
      body,
      actionUrl
    });

    const io = getIo();
    const receiverSocketId = getConnectedUserSocket(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("new_notification", notification);
    }
    
    return notification;
  } catch (err) {
    logger.error(`[NOTIFICATION] Failed to create/emit notification: ${err.message}`);
  }
};

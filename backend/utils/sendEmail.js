"use strict";
const nodemailer = require("nodemailer");
const logger = require("./logger");

// ─── Singleton transporter ─────────────────────────────────────────────────
// Creating a new transporter per call wastes SMTP connections.
// This is created once when the module is first required.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // true for port 465, false otherwise
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (options) => {
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  const info = await transporter.sendMail(message);
  logger.info(`[EMAIL] Message sent: ${info.messageId}`);
};

module.exports = sendEmail;

"use strict";
const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

/**
 * Express middleware that checks for express-validator errors
 * and returns a 400 with the first error message if any exist.
 *
 * Usage: router.post("/route", [...validators], validate, handler)
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(messages[0], 400));
  }
  next();
};

module.exports = validate;

"use strict";
const AppError = require("../utils/AppError");

/**
 * Restrict access to specific roles. 
 * Must be used AFTER the 'protect' middleware.
 * 
 * @param {...string} roles - List of allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(`User role '${req.user.role}' is not authorized to access this resource`, 403)
      );
    }
    next();
  };
};

module.exports = authorize;

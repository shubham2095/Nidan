const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const { COOKIE_NAME } = require('../utils/sessionCookie');

/** Requires a valid session cookie and loads the user (without credentials) into req.user. */
const authenticate = async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized();

  // A password change or reset invalidates every older session.
  const changedAt = user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0;
  if (payload.iat < changedAt) {
    throw ApiError.unauthorized('Your password was changed. Please sign in again.');
  }

  req.user = user;
  next();
};

/**
 * Allows only the listed roles. super_admin is always allowed.
 * Must run after `authenticate`.
 */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (req.user.role === ROLES.SUPER_ADMIN || roles.includes(req.user.role)) return next();
    throw ApiError.forbidden();
  };

module.exports = { authenticate, requireRole };

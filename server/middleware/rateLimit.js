const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const createLimiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => next(new ApiError(429, message)),
  });

const MINUTE = 60 * 1000;

/** Generous ceiling for every API call from one IP. */
const apiLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 1000,
  message: 'Too many requests. Please slow down and try again shortly.',
});

/** Only failed sign-ins count, so legitimate staff are never locked out by their own successes. */
const loginLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
});

const passwordResetLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  message: 'Too many password reset requests. Please try again in an hour.',
});

/** Public forms (contact, testimonials, booking) are open to anyone, so keep them tight. */
const publicFormLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 8,
  message: 'You have sent several requests in a short time. Please wait a few minutes or call us directly.',
});

module.exports = { apiLimiter, loginLimiter, passwordResetLimiter, publicFormLimiter };

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COOKIE_NAME = 'nidan_session';

// httpOnly keeps the token away from page scripts; sameSite=lax stops cross-site POSTs (CSRF).
const baseOptions = { httpOnly: true, secure: env.cookieSecure, sameSite: 'lax', path: '/' };

const setSessionCookie = (res, token) => {
  const { exp } = jwt.decode(token);
  res.cookie(COOKIE_NAME, token, { ...baseOptions, maxAge: exp * 1000 - Date.now() });
};

const clearSessionCookie = (res) => res.clearCookie(COOKIE_NAME, baseOptions);

module.exports = { COOKIE_NAME, setSessionCookie, clearSessionCookie };

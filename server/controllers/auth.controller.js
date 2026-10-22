const authService = require('../services/auth.service');
const activityLog = require('../services/activityLog.service');
const { setSessionCookie, clearSessionCookie } = require('../utils/sessionCookie');

const login = async (req, res) => {
  const { user, token } = await authService.login(req.valid.body);
  setSessionCookie(res, token);
  await activityLog.record({ user, entityType: 'user', entityId: user.id, action: 'login', summary: 'Signed in', req });
  res.json({ user: authService.toPublicUser(user) });
};

const logout = (req, res) => {
  clearSessionCookie(res);
  res.json({ message: 'Signed out' });
};

const me = (req, res) => {
  res.json({ user: authService.toPublicUser(req.user) });
};

const forgotPassword = (req, res) => {
  // Deliberately not awaited: the reply must look the same (and arrive as fast) for every email.
  authService.requestPasswordReset(req.valid.body.email).catch((error) => {
    console.error(`[auth] password reset request failed: ${error.message}`);
  });
  res.json({ message: 'If that email belongs to a staff account, a reset link is on its way.' });
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.valid.body);
  res.json({ message: 'Your password has been reset. You can now sign in.' });
};

const changePassword = async (req, res) => {
  const token = await authService.changePassword(req.user, req.valid.body);
  setSessionCookie(res, token);
  res.json({ message: 'Your password has been changed.' });
};

module.exports = { login, logout, me, forgotPassword, resetPassword, changePassword };

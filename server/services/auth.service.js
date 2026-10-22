const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const mailService = require('./mail.service');
const activityLog = require('./activityLog.service');

const BCRYPT_COST = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('unknown-user-placeholder', BCRYPT_COST);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  doctorId: user.doctorId,
});

const login = async ({ email, password }) => {
  const user = await User.scope('withSecrets').findOne({ where: { email } });
  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !user.isActive || !passwordMatches) {
    throw ApiError.unauthorized('Incorrect email or password');
  }
  await user.update({ lastLoginAt: new Date() });
  return { user, token: signToken(user) };
};

/** Replies are identical whether or not the email exists; the work happens after the response. */
const requestPasswordReset = async (email) => {
  const user = await User.findOne({ where: { email, isActive: true } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  await user.update({
    resetTokenHash: sha256(token),
    resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });
  await mailService.sendPasswordResetEmail({
    user,
    resetUrl: `${env.clientUrl}/admin/reset-password?token=${token}`,
  });
};

const resetPassword = async ({ token, password }) => {
  const user = await User.scope('withSecrets').findOne({
    where: { resetTokenHash: sha256(token), resetTokenExpiresAt: { [Op.gt]: new Date() }, isActive: true },
  });
  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired. Please request a new one.');

  await user.update({
    passwordHash: await bcrypt.hash(password, BCRYPT_COST),
    passwordChangedAt: new Date(),
    resetTokenHash: null,
    resetTokenExpiresAt: null,
  });
  await activityLog.record({ user, entityType: 'user', entityId: user.id, action: 'password_reset', summary: 'Password reset via email link' });
};

const changePassword = async (currentUser, { currentPassword, newPassword }) => {
  const user = await User.scope('withSecrets').findByPk(currentUser.id);
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest('Your current password is incorrect');
  }
  await user.update({ passwordHash: await bcrypt.hash(newPassword, BCRYPT_COST), passwordChangedAt: new Date() });
  await activityLog.record({ user, entityType: 'user', entityId: user.id, action: 'password_change', summary: 'Changed own password' });
  // Older sessions are now invalid, so hand back a fresh one for the current browser.
  return signToken(user);
};

const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_COST);

module.exports = { login, requestPasswordReset, resetPassword, changePassword, toPublicUser, hashPassword };

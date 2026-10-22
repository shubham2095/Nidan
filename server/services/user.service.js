const { Op } = require('sequelize');
const { User, Doctor } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const authService = require('./auth.service');
const activityLog = require('./activityLog.service');

const INCLUDE = [{ model: Doctor, as: 'doctor', attributes: ['id', 'name'] }];

const serialize = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  doctor: user.doctor || null,
});

const list = async () => {
  const users = await User.findAll({ include: INCLUDE, order: [['isActive', 'DESC'], ['name', 'ASC']] });
  return { items: users.map(serialize) };
};

const find = async (id) => {
  const user = await User.findByPk(id, { include: INCLUDE });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

/** A doctor login must point at a doctor profile that has no login yet; other roles must not carry one. */
const resolveDoctorLink = async ({ role, doctorId }, exceptUserId) => {
  if (role !== ROLES.DOCTOR) return null;
  if (!doctorId) throw new ApiError(422, 'Choose which doctor this login belongs to.', [{ field: 'doctorId', message: 'Choose a doctor' }]);
  if (!(await Doctor.count({ where: { id: doctorId } }))) throw new ApiError(422, 'Unknown doctor', [{ field: 'doctorId', message: 'Choose a doctor' }]);
  const taken = await User.count({ where: { doctorId, ...(exceptUserId && { id: { [Op.ne]: exceptUserId } }) } });
  if (taken) throw ApiError.conflict('That doctor already has a login.', [{ field: 'doctorId', message: 'This doctor already has a login' }]);
  return doctorId;
};

const create = async (actor, input, req) => {
  if (await User.count({ where: { email: input.email } })) {
    throw ApiError.conflict('Someone already uses that email address.', [{ field: 'email', message: 'This email is already in use' }]);
  }
  const doctorId = await resolveDoctorLink(input);
  const user = await User.create({
    name: input.name,
    email: input.email,
    role: input.role,
    doctorId,
    passwordHash: await authService.hashPassword(input.password),
    passwordChangedAt: new Date(),
  });
  await activityLog.record({ user: actor, entityType: 'user', entityId: user.id, action: 'create', summary: `Created ${user.role} login for ${user.name}`, req });
  return serialize(await find(user.id));
};

/** The last active super admin can never be demoted or switched off, and nobody can lock themselves out. */
const assertNotLastAdmin = async (user, next) => {
  const losesAdmin = user.role === ROLES.SUPER_ADMIN && user.isActive && ((next.role && next.role !== ROLES.SUPER_ADMIN) || next.isActive === false);
  if (!losesAdmin) return;
  const others = await User.count({ where: { role: ROLES.SUPER_ADMIN, isActive: true, id: { [Op.ne]: user.id } } });
  if (!others) throw ApiError.conflict('This is the only active super admin, so it cannot be demoted or switched off.');
};

const update = async (actor, id, input, req) => {
  const user = await find(id);
  if (user.id === actor.id && (input.isActive === false || (input.role && input.role !== actor.role))) {
    throw ApiError.conflict('You cannot switch off or change the role of your own account.');
  }
  await assertNotLastAdmin(user, input);

  const next = { ...input };
  const role = next.role || user.role;
  if (next.role || next.doctorId !== undefined) next.doctorId = await resolveDoctorLink({ role, doctorId: next.doctorId ?? user.doctorId }, user.id);
  if (next.email && next.email !== user.email && (await User.count({ where: { email: next.email } }))) {
    throw ApiError.conflict('Someone already uses that email address.', [{ field: 'email', message: 'This email is already in use' }]);
  }

  const changes = {};
  for (const [key, value] of Object.entries(next)) if (user[key] !== value) changes[key] = { from: user[key], to: value };
  await user.update(next);
  const deactivated = changes.isActive?.to === false;
  await activityLog.record({
    user: actor,
    entityType: 'user',
    entityId: user.id,
    action: deactivated ? 'deactivate' : 'update',
    summary: `${deactivated ? 'Switched off' : 'Edited'} login for ${user.name}`,
    changes,
    req,
  });
  return serialize(await find(id));
};

/** Sets a new password directly; the person's existing sessions stop working. */
const setPassword = async (actor, id, password, req) => {
  const user = await find(id);
  await user.update({ passwordHash: await authService.hashPassword(password), passwordChangedAt: new Date(), resetTokenHash: null, resetTokenExpiresAt: null });
  await activityLog.record({ user: actor, entityType: 'user', entityId: user.id, action: 'password_set', summary: `Set a new password for ${user.name}`, req });
};

/** Emails the person a link to choose their own password. */
const sendResetLink = async (actor, id, req) => {
  const user = await find(id);
  if (!user.isActive) throw ApiError.conflict('Switch the login on before sending a reset link.');
  await authService.requestPasswordReset(user.email);
  await activityLog.record({ user: actor, entityType: 'user', entityId: user.id, action: 'password_reset_sent', summary: `Sent a password reset link to ${user.name}`, req });
};

module.exports = { list, create, update, setPassword, sendResetLink };

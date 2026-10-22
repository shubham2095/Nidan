const { Op } = require('sequelize');
const { Doctor, DoctorSchedule, DoctorLeave, Location, User, Appointment, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { nowInIndia, toMinutes } = require('../utils/datetime');
const { slugify, uniqueSlug } = require('../utils/slug');
const { sanitizeRichText } = require('../utils/sanitize');
const { ROLES } = require('../utils/constants');
const activityLog = require('./activityLog.service');
const mediaService = require('./media.service');

/** Super admins manage every doctor; a doctor manages only their own profile. */
const assertCanManage = (actor, doctorId) => {
  if (actor.role === ROLES.SUPER_ADMIN) return;
  if (actor.role === ROLES.DOCTOR && actor.doctorId === doctorId) return;
  throw ApiError.forbidden('You can only change your own profile and timetable.');
};

const serializeLeave = (leave) => ({
  id: leave.id,
  locationId: leave.locationId,
  startDate: leave.startDate,
  endDate: leave.endDate,
  startTime: leave.startTime,
  endTime: leave.endTime,
  reason: leave.reason,
});

const serializeDoctor = (doctor, { schedules = [], leaves = [], login = null } = {}) => ({
  id: doctor.id,
  name: doctor.name,
  slug: doctor.slug,
  designation: doctor.designation,
  qualifications: doctor.qualifications,
  highlights: doctor.highlights,
  specialities: doctor.specialities,
  bio: doctor.bio,
  quote: doctor.quote,
  photoUrl: doctor.photoUrl,
  slotMinutes: doctor.slotMinutes,
  bookingWindowDays: doctor.bookingWindowDays,
  minNoticeMinutes: doctor.minNoticeMinutes,
  metaTitle: doctor.metaTitle,
  metaDescription: doctor.metaDescription,
  isActive: doctor.isActive,
  sortOrder: doctor.sortOrder,
  schedules: schedules.map((row) => ({ id: row.id, locationId: row.locationId, weekday: row.weekday, startTime: row.startTime, endTime: row.endTime, isActive: row.isActive })),
  leaves: leaves.map(serializeLeave),
  login,
});

const load = async (doctor) => {
  const { date: today } = nowInIndia();
  const [schedules, leaves, user] = await Promise.all([
    DoctorSchedule.findAll({ where: { doctorId: doctor.id }, order: [['locationId', 'ASC'], ['weekday', 'ASC'], ['startTime', 'ASC']] }),
    DoctorLeave.findAll({ where: { doctorId: doctor.id, endDate: { [Op.gte]: today } }, order: [['startDate', 'ASC']] }),
    User.findOne({ where: { doctorId: doctor.id }, attributes: ['id', 'email', 'isActive'] }),
  ]);
  return serializeDoctor(doctor, { schedules, leaves, login: user ? { id: user.id, email: user.email, isActive: user.isActive } : null });
};

const find = async (id) => {
  const doctor = await Doctor.findByPk(id);
  if (!doctor) throw ApiError.notFound('Doctor not found');
  return doctor;
};

const list = async () => {
  const doctors = await Doctor.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] });
  return { items: await Promise.all(doctors.map(load)) };
};

const get = async (id) => load(await find(id));

const create = async (actor, input, req) => {
  const slug = await uniqueSlug(Doctor, slugify(input.slug || input.name));
  const last = await Doctor.max('sortOrder');
  const doctor = await Doctor.create({ ...input, slug, bio: sanitizeRichText(input.bio), sortOrder: (last || 0) + 1 });
  await activityLog.record({ user: actor, entityType: 'doctor', entityId: doctor.id, action: 'create', summary: `Added doctor ${doctor.name}`, req });
  return load(doctor);
};

// Only super admins may change these; a doctor editing their own profile cannot.
const ADMIN_ONLY_FIELDS = ['slug', 'isActive', 'sortOrder', 'bookingWindowDays', 'minNoticeMinutes'];

const update = async (actor, id, input, req) => {
  assertCanManage(actor, id);
  const doctor = await find(id);
  const next = { ...input };
  if (actor.role !== ROLES.SUPER_ADMIN) ADMIN_ONLY_FIELDS.forEach((field) => delete next[field]);
  if (next.slug) next.slug = await uniqueSlug(Doctor, slugify(next.slug), { exceptId: id });
  if (next.bio !== undefined) next.bio = sanitizeRichText(next.bio);

  const changes = {};
  for (const [key, value] of Object.entries(next)) {
    if (JSON.stringify(doctor[key]) !== JSON.stringify(value)) changes[key] = { from: doctor[key], to: value };
  }
  delete changes.bio; // long text; the summary is enough
  await doctor.update(next);
  await activityLog.record({ user: actor, entityType: 'doctor', entityId: doctor.id, action: 'update', summary: `Edited doctor ${doctor.name}`, changes, req });
  return load(doctor);
};

const uploadPhoto = async (actor, id, file, req) => {
  assertCanManage(actor, id);
  const doctor = await find(id);
  const { url } = await mediaService.saveImage(file, 'doctors');
  const previous = doctor.photoUrl;
  await doctor.update({ photoUrl: url });
  await mediaService.removeByUrl(previous);
  await activityLog.record({ user: actor, entityType: 'doctor', entityId: doctor.id, action: 'photo', summary: `Changed the photo of ${doctor.name}`, req });
  return load(doctor);
};

const removePhoto = async (actor, id, req) => {
  assertCanManage(actor, id);
  const doctor = await find(id);
  const previous = doctor.photoUrl;
  await doctor.update({ photoUrl: null });
  await mediaService.removeByUrl(previous);
  await activityLog.record({ user: actor, entityType: 'doctor', entityId: doctor.id, action: 'photo', summary: `Removed the photo of ${doctor.name}`, req });
  return load(doctor);
};

/**
 * Replaces the whole weekly timetable. Two time ranges at the SAME location on the same weekday may not overlap
 * (that would double the slots); ranges at different locations may, because bookings are blocked per doctor.
 */
const replaceSchedules = async (actor, id, rows, req) => {
  assertCanManage(actor, id);
  const doctor = await find(id);

  const locations = await Location.findAll({ attributes: ['id'] });
  const known = new Set(locations.map((location) => location.id));
  const issues = [];
  rows.forEach((row, index) => {
    if (!known.has(row.locationId)) issues.push({ field: `schedules.${index}.locationId`, message: 'Unknown location' });
    if (toMinutes(row.startTime) >= toMinutes(row.endTime)) issues.push({ field: `schedules.${index}.endTime`, message: 'End time must be after the start time' });
  });

  const groups = new Map();
  rows.forEach((row, index) => {
    const key = `${row.locationId}-${row.weekday}`;
    groups.set(key, [...(groups.get(key) || []), { ...row, index }]);
  });
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    for (let i = 1; i < sorted.length; i += 1) {
      if (toMinutes(sorted[i].startTime) < toMinutes(sorted[i - 1].endTime)) {
        issues.push({ field: `schedules.${sorted[i].index}.startTime`, message: 'This overlaps another time range at the same location on the same day' });
      }
    }
  }
  if (issues.length) throw new ApiError(422, 'Please check the timetable', issues);

  await sequelize.transaction(async (transaction) => {
    await DoctorSchedule.destroy({ where: { doctorId: id }, transaction });
    await DoctorSchedule.bulkCreate(rows.map((row) => ({ ...row, doctorId: id, isActive: true })), { transaction });
  });
  await activityLog.record({ user: actor, entityType: 'doctor', entityId: id, action: 'schedule', summary: `Updated the timetable of ${doctor.name} (${rows.length} time ranges)`, req });
  return load(doctor);
};

/** Leaves can be added by super admins, reception, and the doctor themselves. */
const assertCanManageLeaves = (actor, doctorId) => {
  if (actor.role === ROLES.SUPER_ADMIN || actor.role === ROLES.RECEPTIONIST) return;
  if (actor.role === ROLES.DOCTOR && actor.doctorId === doctorId) return;
  throw ApiError.forbidden('You can only manage your own leave.');
};

const addLeave = async (actor, id, input, req) => {
  assertCanManageLeaves(actor, id);
  const doctor = await find(id);
  if (input.locationId && !(await Location.count({ where: { id: input.locationId } }))) throw ApiError.badRequest('Unknown location');

  const leave = await DoctorLeave.create({ ...input, doctorId: id, locationId: input.locationId || null });

  // Tell staff how many existing bookings fall inside the blocked time so they can be moved or cancelled.
  const clashing = await Appointment.findAll({
    where: {
      doctorId: id,
      slotLock: 1,
      appointmentDate: { [Op.between]: [input.startDate, input.endDate] },
      ...(input.locationId && { locationId: input.locationId }),
    },
    attributes: ['startTime', 'endTime'],
  });
  const affected = input.startTime
    ? clashing.filter((a) => toMinutes(a.startTime) < toMinutes(input.endTime) && toMinutes(input.startTime) < toMinutes(a.endTime)).length
    : clashing.length;

  await activityLog.record({ user: actor, entityType: 'doctor', entityId: id, action: 'leave', summary: `Blocked ${doctor.name} from ${input.startDate} to ${input.endDate}`, req });
  return { leave: serializeLeave(leave), affectedAppointments: affected };
};

const removeLeave = async (actor, id, leaveId, req) => {
  assertCanManageLeaves(actor, id);
  const leave = await DoctorLeave.findOne({ where: { id: leaveId, doctorId: id } });
  if (!leave) throw ApiError.notFound('Leave not found');
  await leave.destroy();
  await activityLog.record({ user: actor, entityType: 'doctor', entityId: id, action: 'leave', summary: 'Removed a leave', req });
};

module.exports = { list, get, create, update, uploadPhoto, removePhoto, replaceSchedules, addLeave, removeLeave };

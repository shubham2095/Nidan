const { Op, UniqueConstraintError } = require('sequelize');
const { Appointment, Patient, Doctor, Location } = require('../models');
const ApiError = require('../utils/ApiError');
const { nowInIndia, dateFromAge, formatDateLong, formatTime12 } = require('../utils/datetime');
const { pageWindow, pageResult, escapeLike } = require('../utils/pagination');
const { toCsv } = require('../utils/csv');
const { doctorIdFor } = require('./access.service');
const { slotsForDate } = require('./slots.service');
const bookingService = require('./booking.service');
const patientService = require('./patient.service');
const mailService = require('./mail.service');
const activityLog = require('./activityLog.service');

/** Allowed status changes. Cancelled is final: a cancelled slot may already be re-booked by someone else. */
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show', 'pending'],
  completed: ['confirmed'],
  no_show: ['confirmed'],
  cancelled: [],
};

const INCLUDE = [
  {
    model: Patient,
    as: 'patient',
    paranoid: false, // keep showing the name of a patient who was later deleted
    attributes: ['id', 'patientCode', 'name', 'type', 'phone', 'email', 'dob', 'guardianName'],
  },
  { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'slug'] },
  { model: Location, as: 'location', attributes: ['id', 'name', 'address', 'mapUrl'] },
];

const serialize = (appointment) => ({
  id: appointment.id,
  bookingRef: appointment.bookingRef,
  status: appointment.status,
  source: appointment.source,
  appointmentDate: appointment.appointmentDate,
  startTime: appointment.startTime,
  endTime: appointment.endTime,
  reason: appointment.reason,
  staffNote: appointment.staffNote,
  cancelReason: appointment.cancelReason,
  createdAt: appointment.createdAt,
  patient: appointment.patient,
  doctor: appointment.doctor,
  location: appointment.location,
});

const buildWhere = (actor, filters) => {
  const doctorId = doctorIdFor(actor);
  const where = {};

  if (doctorId) where.doctorId = doctorId;
  else if (filters.doctorId) where.doctorId = filters.doctorId;
  if (filters.locationId) where.locationId = filters.locationId;
  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.status) where.status = filters.status;
  if (filters.from && filters.to) where.appointmentDate = { [Op.between]: [filters.from, filters.to] };
  else if (filters.from) where.appointmentDate = { [Op.gte]: filters.from };
  else if (filters.to) where.appointmentDate = { [Op.lte]: filters.to };

  if (filters.q) {
    const like = `%${escapeLike(filters.q)}%`;
    const digits = filters.q.replace(/[^\d+]/g, '');
    where[Op.or] = [
      { bookingRef: { [Op.like]: like } },
      { '$patient.name$': { [Op.like]: like } },
      ...(digits ? [{ '$patient.phone$': { [Op.like]: `%${escapeLike(digits)}%` } }] : []),
    ];
  }
  return where;
};

const order = (sort) => {
  const direction = sort === 'desc' ? 'DESC' : 'ASC';
  return [['appointmentDate', direction], ['startTime', direction], ['id', direction]];
};

const list = async (actor, filters) => {
  const { rows, count } = await Appointment.findAndCountAll({
    where: buildWhere(actor, filters),
    include: INCLUDE,
    order: order(filters.sort),
    ...pageWindow(filters),
  });
  return pageResult(rows.map(serialize), count, filters);
};

/** Everything in a date range with no paging, for the calendar views (capped for safety). */
const calendar = async (actor, filters) => {
  const rows = await Appointment.findAll({
    where: buildWhere(actor, { ...filters, status: undefined }),
    include: INCLUDE,
    order: order('asc'),
    limit: 1000,
  });
  return { items: rows.map(serialize) };
};

const findAccessible = async (actor, id, { transaction } = {}) => {
  const doctorId = doctorIdFor(actor);
  const appointment = await Appointment.findOne({
    where: { id, ...(doctorId && { doctorId }) },
    include: INCLUDE,
    transaction,
  });
  if (!appointment) throw ApiError.notFound('Appointment not found');
  return appointment;
};

const get = async (actor, id) => serialize(await findAccessible(actor, id));

const notifyPatient = async (type, appointment) => {
  mailService.sendAppointmentEmail({
    type,
    appointment,
    patient: appointment.patient,
    doctor: appointment.doctor,
    location: appointment.location,
    clinic: await bookingService.clinicSettings(),
  });
};

/** Phone or walk-in booking made by reception. Staff-made bookings are confirmed straight away unless told otherwise. */
const createByStaff = async (actor, input, req) => {
  const { patientId, newPatient, doctorId, locationId, date, startTime, source, status, reason, staffNote } = input;

  const { appointment } = await bookingService.bookSlot({
    doctorId,
    locationId,
    date,
    startTime,
    staff: true,
    resolvePatient: async (transaction, now) => {
      if (patientId) {
        const patient = await Patient.findByPk(patientId, { transaction });
        if (!patient) throw ApiError.notFound('Patient not found');
        return patient;
      }
      const dob = newPatient.dob || (newPatient.ageYears !== undefined ? dateFromAge(now.date, newPatient.ageYears, newPatient.ageMonths || 0) : undefined);
      return patientService.findOrCreateFromBooking({ ...newPatient, dob }, transaction);
    },
    fields: { status, source, reason, staffNote, createdBy: actor.id, consentAt: newPatient ? new Date() : null },
  });

  await activityLog.record({
    user: actor,
    entityType: 'appointment',
    entityId: appointment.id,
    action: 'create',
    summary: `${source === 'walk_in' ? 'Walk-in' : 'Phone'} booking ${appointment.bookingRef}`,
    req,
  });

  const full = await findAccessible(actor, appointment.id);
  if (full.status === 'confirmed') await notifyPatient('confirmed', full);
  return serialize(full);
};

const changeStatus = async (actor, id, { status, cancelReason }, req) => {
  const appointment = await findAccessible(actor, id);
  const from = appointment.status;

  if (!TRANSITIONS[from].includes(status)) {
    throw ApiError.conflict(`An appointment that is ${from.replace('_', ' ')} cannot be changed to ${status.replace('_', ' ')}.`);
  }

  try {
    await appointment.update({ status, cancelReason: status === 'cancelled' ? cancelReason || null : null });
  } catch (error) {
    // Re-opening a completed / no-show visit needs its slot back; someone else may have taken it.
    if (error instanceof UniqueConstraintError) {
      throw ApiError.conflict('That time slot has since been booked by someone else, so this appointment cannot be re-opened.');
    }
    throw error;
  }

  await activityLog.record({
    user: actor,
    entityType: 'appointment',
    entityId: appointment.id,
    action: 'status_change',
    summary: `${appointment.bookingRef}: ${from} -> ${status}`,
    changes: { status: { from, to: status } },
    req,
  });

  if (status === 'confirmed' && from === 'pending') await notifyPatient('confirmed', appointment);
  if (status === 'cancelled') await notifyPatient('cancelled', appointment);
  return serialize(appointment);
};

const reschedule = async (actor, id, { date, startTime }, req) => {
  const appointment = await findAccessible(actor, id);
  if (!['pending', 'confirmed'].includes(appointment.status)) {
    throw ApiError.conflict('Only pending or confirmed appointments can be rescheduled.');
  }

  const ctx = await bookingService.loadContext(
    { doctorId: appointment.doctorId, locationId: appointment.locationId },
    date,
    date,
    { staff: true, excludeAppointmentId: appointment.id },
  );
  const slot = slotsForDate(ctx, date, nowInIndia(), { staff: true }).find((candidate) => candidate.startTime === startTime);
  if (!slot) throw bookingService.slotUnavailable();

  const sameDay = await Appointment.findOne({
    where: { patientId: appointment.patientId, doctorId: appointment.doctorId, appointmentDate: date, slotLock: 1, id: { [Op.ne]: appointment.id } },
  });
  if (sameDay) throw bookingService.duplicateBooking();

  const before = { date: appointment.appointmentDate, time: appointment.startTime };
  try {
    await appointment.update({ appointmentDate: date, startTime: slot.startTime, endTime: slot.endTime });
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw bookingService.slotUnavailable();
    throw error;
  }

  await activityLog.record({
    user: actor,
    entityType: 'appointment',
    entityId: appointment.id,
    action: 'reschedule',
    summary: `${appointment.bookingRef} moved to ${formatDateLong(date)} ${formatTime12(slot.startTime)}`,
    changes: { appointmentDate: { from: before.date, to: date }, startTime: { from: before.time, to: slot.startTime } },
    req,
  });

  await notifyPatient('rescheduled', appointment);
  return serialize(appointment);
};

const updateDetails = async (actor, id, { reason, staffNote }, req) => {
  const appointment = await findAccessible(actor, id);
  await appointment.update({ ...(reason !== undefined && { reason }), ...(staffNote !== undefined && { staffNote }) });
  await activityLog.record({ user: actor, entityType: 'appointment', entityId: appointment.id, action: 'update', summary: `Edited details of ${appointment.bookingRef}`, req });
  return serialize(appointment);
};

const exportCsv = async (actor, filters) => {
  const rows = await Appointment.findAll({
    where: buildWhere(actor, filters),
    include: INCLUDE,
    order: order(filters.sort),
    limit: 5000,
  });
  const csv = toCsv(
    [
      { header: 'Booking ID', value: (a) => a.bookingRef },
      { header: 'Date', value: (a) => a.appointmentDate },
      { header: 'Start', value: (a) => formatTime12(a.startTime) },
      { header: 'End', value: (a) => formatTime12(a.endTime) },
      { header: 'Status', value: (a) => a.status },
      { header: 'Source', value: (a) => a.source },
      { header: 'Patient', value: (a) => a.patient?.name },
      { header: 'Patient type', value: (a) => a.patient?.type },
      { header: 'Phone', value: (a) => a.patient?.phone },
      { header: 'Email', value: (a) => a.patient?.email },
      { header: 'Doctor', value: (a) => a.doctor?.name },
      { header: 'Location', value: (a) => a.location?.name },
      { header: 'Reason', value: (a) => a.reason },
      { header: 'Staff note', value: (a) => a.staffNote },
    ],
    rows,
  );
  return csv;
};

module.exports = { list, calendar, get, createByStaff, changeStatus, reschedule, updateDetails, exportCsv, TRANSITIONS };

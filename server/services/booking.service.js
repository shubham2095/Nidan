const crypto = require('crypto');
const { Op, UniqueConstraintError } = require('sequelize');
const {
  sequelize, Doctor, Location, DoctorSchedule, DoctorLeave, Appointment, Setting,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { nowInIndia, addDays, dateFromAge } = require('../utils/datetime');
const { slotsForDate, availableDates, STAFF_WINDOW_DAYS } = require('./slots.service');
const patientService = require('./patient.service');
const mailService = require('./mail.service');
const activityLog = require('./activityLog.service');

// No 0/O/1/I so a booking ID read out over the phone is never ambiguous.
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const slotUnavailable = () =>
  new ApiError(409, 'Sorry, that time is no longer available. Please choose another slot.', { code: 'slot_unavailable' });

/**
 * Loads everything slot generation needs for one doctor at one location from `from` to `to`
 * (defaults to the end of the booking window). `excludeAppointmentId` leaves one appointment out of
 * the busy list, which is how a reschedule avoids blocking itself.
 */
const loadContext = async ({ doctorId, locationId }, from, to, { staff = false, excludeAppointmentId } = {}) => {
  const [doctor, location] = await Promise.all([
    Doctor.findOne({ where: { id: doctorId, isActive: true } }),
    Location.findOne({ where: { id: locationId, isActive: true } }),
  ]);
  if (!doctor || !location) throw ApiError.notFound('Doctor or location not found');

  const rangeEnd = to ?? addDays(from, staff ? STAFF_WINDOW_DAYS : doctor.bookingWindowDays);

  const [schedules, leaves, booked] = await Promise.all([
    DoctorSchedule.findAll({ where: { doctorId, locationId, isActive: true } }),
    DoctorLeave.findAll({
      where: {
        doctorId,
        startDate: { [Op.lte]: rangeEnd },
        endDate: { [Op.gte]: from },
        [Op.or]: [{ locationId: null }, { locationId }],
      },
    }),
    // Any location: the same doctor cannot be booked twice at the same time.
    Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: { [Op.between]: [from, rangeEnd] },
        slotLock: 1,
        ...(excludeAppointmentId && { id: { [Op.ne]: excludeAppointmentId } }),
      },
      attributes: ['appointmentDate', 'startTime', 'endTime'],
    }),
  ]);
  if (!schedules.length) throw ApiError.notFound('This doctor does not see patients at that location');

  return { doctor, location, schedules, leaves, booked };
};

const listDates = async ({ doctorId, locationId }, { staff = false } = {}) => {
  const now = nowInIndia();
  const ctx = await loadContext({ doctorId, locationId }, now.date, undefined, { staff });
  return { dates: availableDates(ctx, now, { staff }) };
};

const listSlots = async ({ doctorId, locationId, date }, { staff = false } = {}) => {
  const ctx = await loadContext({ doctorId, locationId }, date, date, { staff });
  return { date, slots: slotsForDate(ctx, date, nowInIndia(), { staff }) };
};

const generateRef = async (transaction) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = Array.from({ length: 6 }, () => REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)]).join('');
    const bookingRef = `APT-${code}`;
    // paranoid: false so the code of a deleted appointment is never reused either
    if (!(await Appointment.count({ where: { bookingRef }, paranoid: false, transaction }))) return bookingRef;
  }
  throw new Error('Could not generate a unique booking reference');
};

const duplicateBooking = () =>
  ApiError.conflict('This patient already has a booking with this doctor on that day.', { code: 'duplicate_booking' });

/**
 * Reserves a slot and creates the appointment. Shared by the public website and reception staff.
 * Order of defence against double booking: (1) the slot must be free right now, (2) the database
 * unique index on (doctor, date, start time, slot_lock) rejects any concurrent second booking.
 *
 * `resolvePatient(transaction, now)` returns the patient record; `fields` are the appointment columns
 * that differ between callers (status, source, reason, createdBy ...).
 */
const bookSlot = async ({ doctorId, locationId, date, startTime, staff = false, resolvePatient, fields }) => {
  const ctx = await loadContext({ doctorId, locationId }, date, date, { staff });
  const now = nowInIndia();

  const slot = slotsForDate(ctx, date, now, { staff }).find((candidate) => candidate.startTime === startTime);
  if (!slot) throw slotUnavailable();

  let appointment;
  let patient;
  try {
    await sequelize.transaction(async (transaction) => {
      patient = await resolvePatient(transaction, now);

      const duplicate = await Appointment.findOne({
        where: { patientId: patient.id, doctorId, appointmentDate: date, slotLock: 1 },
        transaction,
      });
      if (duplicate) throw duplicateBooking();

      appointment = await Appointment.create(
        {
          ...fields,
          bookingRef: await generateRef(transaction),
          patientId: patient.id,
          doctorId,
          locationId,
          appointmentDate: date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        { transaction },
      );
      await patientService.linkFamily(patient.phone, transaction);
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw slotUnavailable();
    throw error;
  }

  return { appointment, patient, doctor: ctx.doctor, location: ctx.location };
};

const clinicSettings = async () => (await Setting.findOne({ where: { settingKey: 'clinic' } }))?.settingValue || {};

/** Books a slot from the public website. New bookings wait for staff to confirm them. */
const createBooking = async ({ doctorId, locationId, date, startTime, reason, patient: patientInput }, req) => {
  const { appointment, patient, doctor, location } = await bookSlot({
    doctorId,
    locationId,
    date,
    startTime,
    resolvePatient: (transaction, now) => {
      const dob =
        patientInput.dob ||
        (patientInput.ageYears !== undefined ? dateFromAge(now.date, patientInput.ageYears, patientInput.ageMonths || 0) : undefined);
      return patientService.findOrCreateFromBooking({ ...patientInput, dob }, transaction);
    },
    fields: { status: 'pending', source: 'website', reason, consentAt: new Date() },
  }).catch((error) => {
    if (error.details?.code === 'duplicate_booking') {
      throw ApiError.conflict(`${error.message} Please call us if you need to change it.`, error.details);
    }
    throw error;
  });

  await activityLog.record({
    entityType: 'appointment',
    entityId: appointment.id,
    action: 'create',
    summary: `Online booking ${appointment.bookingRef}`,
    req,
  });

  // Not awaited: the patient should not wait on the mail server (sendMail never throws).
  mailService.sendBookingEmails({ appointment, patient, doctor, location, clinic: await clinicSettings() });

  return {
    ref: appointment.bookingRef,
    status: appointment.status,
    date: appointment.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    patientName: patient.name,
    doctor: { name: doctor.name, slug: doctor.slug },
    location: { name: location.name, address: location.address, mapUrl: location.mapUrl },
  };
};

module.exports = { listDates, listSlots, createBooking, loadContext, bookSlot, slotUnavailable, duplicateBooking, clinicSettings };

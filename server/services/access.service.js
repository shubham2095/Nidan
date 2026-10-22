const { fn, col } = require('sequelize');
const { Appointment } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

/**
 * Doctors only see their own work. Returns the doctor's id for a doctor account (null for other roles)
 * and refuses doctor accounts that are not linked to a doctor profile.
 */
const doctorIdFor = (actor) => {
  if (actor.role !== ROLES.DOCTOR) return null;
  if (!actor.doctorId) throw ApiError.forbidden('Your account is not linked to a doctor profile. Please ask an administrator.');
  return actor.doctorId;
};

/** A doctor's own patients are the patients who have (or had) an appointment with them. */
const doctorPatientIds = async (doctorId) => {
  const rows = await Appointment.findAll({
    where: { doctorId },
    attributes: [[fn('DISTINCT', col('patient_id')), 'patientId']],
    raw: true,
  });
  return rows.map((row) => row.patientId);
};

/** Throws 404 (not 403, so existence is not revealed) when a doctor asks for someone else's patient. */
const assertPatientAccess = async (actor, patientId) => {
  const doctorId = doctorIdFor(actor);
  if (!doctorId) return;
  if (!(await Appointment.count({ where: { doctorId, patientId } }))) throw ApiError.notFound('Patient not found');
};

module.exports = { doctorIdFor, doctorPatientIds, assertPatientAccess };

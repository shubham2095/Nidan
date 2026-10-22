const { VisitNote, Doctor, Appointment } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const { doctorIdFor, assertPatientAccess } = require('./access.service');
const activityLog = require('./activityLog.service');

const serialize = (note) => ({
  id: note.id,
  patientId: note.patientId,
  appointmentId: note.appointmentId,
  note: note.note,
  doctor: note.doctor ? { id: note.doctor.id, name: note.doctor.name } : null,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

/** Visit notes are medical records: a doctor reads and writes only their own; super admins can read all; reception sees none. */
const list = async (actor, patientId) => {
  await assertPatientAccess(actor, patientId);
  const doctorId = doctorIdFor(actor);
  const rows = await VisitNote.findAll({
    where: { patientId, ...(doctorId && { doctorId }) },
    include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  return { items: rows.map(serialize), canWrite: actor.role === ROLES.DOCTOR };
};

const create = async (actor, patientId, { note, appointmentId }, req) => {
  if (actor.role !== ROLES.DOCTOR) throw ApiError.forbidden('Only doctors can write visit notes.');
  const doctorId = doctorIdFor(actor);
  await assertPatientAccess(actor, patientId);

  if (appointmentId) {
    const appointment = await Appointment.findOne({ where: { id: appointmentId, patientId, doctorId } });
    if (!appointment) throw ApiError.badRequest('That appointment does not belong to this patient and doctor.');
  }

  const created = await VisitNote.create({ patientId, doctorId, appointmentId: appointmentId || null, note });
  // Never log the note text: it is medical information.
  await activityLog.record({ user: actor, entityType: 'patient', entityId: patientId, action: 'visit_note', summary: 'Added a visit note', req });
  return serialize(await VisitNote.findByPk(created.id, { include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'name'] }] }));
};

const update = async (actor, id, { note }, req) => {
  const doctorId = doctorIdFor(actor);
  if (actor.role !== ROLES.DOCTOR) throw ApiError.forbidden('Only doctors can edit visit notes.');
  const existing = await VisitNote.findOne({ where: { id, doctorId }, include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'name'] }] });
  if (!existing) throw ApiError.notFound('Note not found');
  await existing.update({ note });
  await activityLog.record({ user: actor, entityType: 'patient', entityId: existing.patientId, action: 'visit_note', summary: 'Edited a visit note', req });
  return serialize(existing);
};

module.exports = { list, create, update };

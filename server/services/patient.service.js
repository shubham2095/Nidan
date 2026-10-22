const { Op } = require('sequelize');
const { Patient, PatientRelation, Appointment, Doctor, Location } = require('../models');
const ApiError = require('../utils/ApiError');
const { pageWindow, pageResult, escapeLike } = require('../utils/pagination');
const { doctorIdFor, doctorPatientIds, assertPatientAccess } = require('./access.service');
const activityLog = require('./activityLog.service');
const vaccinationService = require('./vaccination.service');

const normalizeName = (name) => name.trim().replace(/\s+/g, ' ').toLowerCase();
const cleanName = (name) => name.trim().replace(/\s+/g, ' ');

/* ---------- matching (used by online and staff bookings) ---------- */

/**
 * Matches a booking to an existing patient by phone number + name (same type), so the same
 * person is never duplicated. A different name on the same phone is a different patient
 * (a mother often books her child with her own number). Missing details on an existing record
 * are filled in, but existing values are never overwritten by booking input.
 */
const findOrCreateFromBooking = async ({ type, name, phone, email, dob, guardianName }, transaction) => {
  const candidates = await Patient.findAll({ where: { phone, type }, transaction });
  const existing = candidates.find((patient) => normalizeName(patient.name) === normalizeName(name));

  if (!existing) {
    const created = await Patient.create({ type, name: cleanName(name), phone, email, dob, guardianName, consentAt: new Date() }, { transaction });
    await vaccinationService.syncForPatient(created, { transaction });
    return created;
  }

  const blanks = {};
  if (!existing.email && email) blanks.email = email;
  if (!existing.dob && dob) blanks.dob = dob;
  if (!existing.guardianName && guardianName) blanks.guardianName = guardianName;
  if (!existing.consentAt) blanks.consentAt = new Date();
  if (Object.keys(blanks).length) await existing.update(blanks, { transaction });
  if (blanks.dob) await vaccinationService.syncForPatient(existing, { transaction });
  return existing;
};

/**
 * Links the children booked under a phone number to the mother booked under the same number.
 * Only done when exactly one mother uses that number, so a shared phone never guesses a parent.
 */
const linkFamily = async (phone, transaction) => {
  const mothers = await Patient.findAll({ where: { phone, type: 'mother' }, transaction });
  if (mothers.length !== 1) return;

  const children = await Patient.findAll({ where: { phone, type: 'child' }, transaction });
  for (const child of children) {
    await PatientRelation.findOrCreate({
      where: { patientId: mothers[0].id, relatedPatientId: child.id },
      defaults: { relation: 'mother_child' },
      transaction,
    });
  }
};

/* ---------- CRM ---------- */

const serialize = (patient) => ({
  id: patient.id,
  patientCode: patient.patientCode,
  type: patient.type,
  name: patient.name,
  phone: patient.phone,
  email: patient.email,
  dob: patient.dob,
  gender: patient.gender,
  guardianName: patient.guardianName,
  tags: patient.tags,
  consentAt: patient.consentAt,
  createdAt: patient.createdAt,
});

const brief = (patient) => ({ id: patient.id, patientCode: patient.patientCode, name: patient.name, type: patient.type, phone: patient.phone });

const list = async (actor, { q, type, page, pageSize }) => {
  const where = {};
  const doctorId = doctorIdFor(actor);
  if (doctorId) where.id = { [Op.in]: await doctorPatientIds(doctorId) };
  if (type) where.type = type;

  if (q) {
    const like = `%${escapeLike(q)}%`;
    const digits = q.replace(/[^\d+]/g, '');
    where[Op.or] = [
      { name: { [Op.like]: like } },
      { patientCode: { [Op.like]: like } },
      { tags: { [Op.like]: like } },
      ...(digits ? [{ phone: { [Op.like]: `%${escapeLike(digits)}%` } }] : []),
    ];
  }

  const { rows, count } = await Patient.findAndCountAll({
    where,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    ...pageWindow({ page, pageSize }),
  });
  return pageResult(rows.map(serialize), count, { page, pageSize });
};

const RELATION_LABELS = {
  mother_child: { primary: 'Child', related: 'Mother' },
  sibling: { primary: 'Sibling', related: 'Sibling' },
  guardian: { primary: 'Ward', related: 'Guardian' },
  other: { primary: 'Linked patient', related: 'Linked patient' },
};

const loadRelations = async (patientId) => {
  const rows = await PatientRelation.findAll({
    where: { [Op.or]: [{ patientId }, { relatedPatientId: patientId }] },
    include: [
      { model: Patient, as: 'patient', attributes: ['id', 'patientCode', 'name', 'type', 'phone'] },
      { model: Patient, as: 'relatedPatient', attributes: ['id', 'patientCode', 'name', 'type', 'phone'] },
    ],
  });
  return rows
    .map((row) => {
      const thisIsPrimary = row.patientId === patientId;
      const other = thisIsPrimary ? row.relatedPatient : row.patient;
      if (!other) return null; // the other patient was deleted
      return { id: row.id, relation: row.relation, label: RELATION_LABELS[row.relation][thisIsPrimary ? 'primary' : 'related'], patient: brief(other) };
    })
    .filter(Boolean);
};

const findAccessible = async (actor, id) => {
  await assertPatientAccess(actor, id);
  const patient = await Patient.findByPk(id);
  if (!patient) throw ApiError.notFound('Patient not found');
  return patient;
};

const get = async (actor, id) => {
  const patient = await findAccessible(actor, id);
  const doctorId = doctorIdFor(actor);

  const [relations, appointments] = await Promise.all([
    loadRelations(patient.id),
    Appointment.findAll({
      where: { patientId: patient.id, ...(doctorId && { doctorId }) },
      include: [
        { model: Doctor, as: 'doctor', attributes: ['id', 'name'] },
        { model: Location, as: 'location', attributes: ['id', 'name'] },
      ],
      order: [['appointmentDate', 'DESC'], ['startTime', 'DESC']],
      limit: 100,
    }),
  ]);

  return {
    ...serialize(patient),
    relations,
    appointments: appointments.map((a) => ({
      id: a.id,
      bookingRef: a.bookingRef,
      status: a.status,
      source: a.source,
      appointmentDate: a.appointmentDate,
      startTime: a.startTime,
      endTime: a.endTime,
      reason: a.reason,
      doctor: a.doctor,
      location: a.location,
    })),
  };
};

const duplicateOf = async (type, name, phone, exceptId) => {
  const matches = await Patient.findAll({ where: { phone, type, ...(exceptId && { id: { [Op.ne]: exceptId } }) } });
  return matches.find((patient) => normalizeName(patient.name) === normalizeName(name));
};

const create = async (actor, input, req) => {
  const duplicate = await duplicateOf(input.type, input.name, input.phone);
  if (duplicate) {
    throw ApiError.conflict('A patient with this name and phone number already exists.', { code: 'duplicate_patient', patientId: duplicate.id });
  }
  const { consent, ...fields } = input;
  const patient = await Patient.create({ ...fields, name: cleanName(fields.name), consentAt: consent ? new Date() : null, createdBy: actor.id });
  await linkFamily(patient.phone);
  await vaccinationService.syncForPatient(patient);
  await activityLog.record({ user: actor, entityType: 'patient', entityId: patient.id, action: 'create', summary: `Added patient ${patient.patientCode || patient.id}`, req });
  return serialize(await Patient.findByPk(patient.id));
};

const update = async (actor, id, input, req) => {
  const patient = await findAccessible(actor, id);
  const next = { ...input, ...(input.name && { name: cleanName(input.name) }) };

  const identityChanged = ['type', 'name', 'phone'].some((key) => next[key] !== undefined && next[key] !== patient[key]);
  if (identityChanged) {
    const duplicate = await duplicateOf(next.type ?? patient.type, next.name ?? patient.name, next.phone ?? patient.phone, patient.id);
    if (duplicate) throw ApiError.conflict('Another patient with this name and phone number already exists.', { code: 'duplicate_patient', patientId: duplicate.id });
  }

  const changes = {};
  for (const [key, value] of Object.entries(next)) {
    if (JSON.stringify(patient[key]) !== JSON.stringify(value)) changes[key] = { from: patient[key], to: value };
  }
  await patient.update(next);
  await vaccinationService.syncForPatient(patient);
  await activityLog.record({ user: actor, entityType: 'patient', entityId: patient.id, action: 'update', summary: `Edited patient ${patient.patientCode}`, changes, req });
  return serialize(patient);
};

const remove = async (actor, id, req) => {
  const patient = await findAccessible(actor, id);
  await patient.destroy();
  await activityLog.record({ user: actor, entityType: 'patient', entityId: patient.id, action: 'delete', summary: `Deleted patient ${patient.patientCode}`, req });
};

/**
 * "thisIs" says what the patient being viewed is to the other one, e.g. "mother_of" = this patient is the
 * other patient's mother. It is stored once as (primary, related, relation).
 */
const RELATION_KINDS = {
  mother_of: (thisId, otherId) => ({ patientId: thisId, relatedPatientId: otherId, relation: 'mother_child' }),
  child_of: (thisId, otherId) => ({ patientId: otherId, relatedPatientId: thisId, relation: 'mother_child' }),
  sibling_of: (thisId, otherId) => ({ patientId: thisId, relatedPatientId: otherId, relation: 'sibling' }),
  guardian_of: (thisId, otherId) => ({ patientId: thisId, relatedPatientId: otherId, relation: 'guardian' }),
  ward_of: (thisId, otherId) => ({ patientId: otherId, relatedPatientId: thisId, relation: 'guardian' }),
  other: (thisId, otherId) => ({ patientId: thisId, relatedPatientId: otherId, relation: 'other' }),
};

const addRelation = async (actor, id, { otherPatientId, thisIs }, req) => {
  const patient = await findAccessible(actor, id);
  if (otherPatientId === patient.id) throw ApiError.badRequest('A patient cannot be linked to themselves.');
  const other = await Patient.findByPk(otherPatientId);
  if (!other) throw ApiError.notFound('The other patient was not found');

  const link = RELATION_KINDS[thisIs](patient.id, other.id);
  const exists = await PatientRelation.findOne({
    where: {
      [Op.or]: [
        { patientId: link.patientId, relatedPatientId: link.relatedPatientId },
        { patientId: link.relatedPatientId, relatedPatientId: link.patientId },
      ],
    },
  });
  if (exists) throw ApiError.conflict('These two patients are already linked.');

  await PatientRelation.create(link);
  await activityLog.record({ user: actor, entityType: 'patient', entityId: patient.id, action: 'link', summary: `Linked ${patient.patientCode} with ${other.patientCode} (${link.relation})`, req });
  return loadRelations(patient.id);
};

const removeRelation = async (actor, id, relationId, req) => {
  const patient = await findAccessible(actor, id);
  const relation = await PatientRelation.findOne({
    where: { id: relationId, [Op.or]: [{ patientId: patient.id }, { relatedPatientId: patient.id }] },
  });
  if (!relation) throw ApiError.notFound('Link not found');
  await relation.destroy();
  await activityLog.record({ user: actor, entityType: 'patient', entityId: patient.id, action: 'unlink', summary: `Removed a family link from ${patient.patientCode}`, req });
  return loadRelations(patient.id);
};

module.exports = {
  findOrCreateFromBooking, linkFamily, list, get, create, update, remove, addRelation, removeRelation, findAccessible,
};

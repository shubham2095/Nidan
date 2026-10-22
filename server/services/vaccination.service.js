const { Op } = require('sequelize');
const { Vaccine, PatientVaccination, Patient, Doctor, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { nowInIndia, addDays } = require('../utils/datetime');
const { pageWindow, pageResult } = require('../utils/pagination');
const { ROLES } = require('../utils/constants');
const { doctorIdFor, doctorPatientIds, assertPatientAccess } = require('./access.service');
const activityLog = require('./activityLog.service');

/** "Due soon" means within the next 7 days. */
const SOON_DAYS = 7;

const statusOf = (record, today) => {
  if (record.givenDate) return 'given';
  if (record.dueDate < today) return 'overdue';
  return record.dueDate <= addDays(today, SOON_DAYS) ? 'due_soon' : 'upcoming';
};

/* ---------- per-child schedule ---------- */

/**
 * Makes sure a child has one dose record per active vaccine, with due dates worked out from their date of birth.
 * Doses already given are never changed; pending doses move if the date of birth (or the schedule) changed.
 */
const syncForPatient = async (patient, { transaction } = {}) => {
  if (patient.type !== 'child' || !patient.dob) return;

  const [vaccines, existing] = await Promise.all([
    Vaccine.findAll({ where: { isActive: true }, transaction }),
    PatientVaccination.findAll({ where: { patientId: patient.id }, transaction }),
  ]);
  const byVaccine = new Map(existing.map((record) => [record.vaccineId, record]));

  const missing = [];
  for (const vaccine of vaccines) {
    const dueDate = addDays(patient.dob, vaccine.ageDays);
    const record = byVaccine.get(vaccine.id);
    if (!record) missing.push({ patientId: patient.id, vaccineId: vaccine.id, dueDate });
    else if (!record.givenDate && record.dueDate !== dueDate) await record.update({ dueDate }, { transaction });
  }
  if (missing.length) await PatientVaccination.bulkCreate(missing, { transaction, ignoreDuplicates: true });
};

const serializeRecord = (record, today) => ({
  id: record.id,
  vaccine: record.vaccine ? { id: record.vaccine.id, name: record.vaccine.name, ageLabel: record.vaccine.ageLabel } : null,
  dueDate: record.dueDate,
  givenDate: record.givenDate,
  status: statusOf(record, today),
  notes: record.notes,
  givenBy: record.givenBy ? { id: record.givenBy.id, name: record.givenBy.name } : null,
});

const forPatient = async (actor, patientId) => {
  await assertPatientAccess(actor, patientId);
  const patient = await Patient.findByPk(patientId);
  if (!patient) throw ApiError.notFound('Patient not found');
  if (patient.type !== 'child') return { eligible: false, reason: 'The vaccination tracker is for children.', items: [] };
  if (!patient.dob) return { eligible: false, reason: 'Add the child\'s date of birth to see the vaccination schedule.', items: [] };

  await syncForPatient(patient);
  const rows = await PatientVaccination.findAll({
    where: { patientId },
    include: [
      { model: Vaccine, as: 'vaccine' },
      { model: Doctor, as: 'givenBy', attributes: ['id', 'name'] },
    ],
    order: [['dueDate', 'ASC'], [{ model: Vaccine, as: 'vaccine' }, 'sortOrder', 'ASC']],
  });

  const { date: today } = nowInIndia();
  // Doses of a vaccine that was later switched off are hidden unless they were already given.
  const visible = rows.filter((row) => row.givenDate || row.vaccine?.isActive);
  return { eligible: true, dob: patient.dob, items: visible.map((row) => serializeRecord(row, today)) };
};

/** Records (or clears) the date a dose was given. */
const markGiven = async (actor, patientId, recordId, { givenDate, notes, givenByDoctorId }, req) => {
  await assertPatientAccess(actor, patientId);
  const record = await PatientVaccination.findOne({ where: { id: recordId, patientId }, include: [{ model: Vaccine, as: 'vaccine' }] });
  if (!record) throw ApiError.notFound('Vaccination record not found');

  const patient = await Patient.findByPk(patientId);
  const { date: today } = nowInIndia();
  if (givenDate) {
    if (givenDate > today) throw ApiError.badRequest('The date given cannot be in the future.', [{ field: 'givenDate', message: 'Choose today or an earlier date' }]);
    if (patient.dob && givenDate < patient.dob) throw ApiError.badRequest('The date given is before the child was born.', [{ field: 'givenDate', message: 'Check the date' }]);
  }

  const doctorId = actor.role === ROLES.DOCTOR ? actor.doctorId : givenByDoctorId;
  await record.update({
    givenDate: givenDate || null,
    notes: notes ?? record.notes,
    givenByDoctorId: givenDate ? doctorId || null : null,
  });

  // Not logged in detail: vaccination history is health information.
  await activityLog.record({ user: actor, entityType: 'patient', entityId: patientId, action: 'vaccination', summary: givenDate ? 'Recorded a vaccination' : 'Cleared a vaccination record', req });
  const full = await PatientVaccination.findByPk(record.id, {
    include: [{ model: Vaccine, as: 'vaccine' }, { model: Doctor, as: 'givenBy', attributes: ['id', 'name'] }],
  });
  return serializeRecord(full, today);
};

/* ---------- due list (reminders) ---------- */

const WINDOWS = {
  overdue: (today) => ({ [Op.lt]: today }),
  week: (today) => ({ [Op.between]: [today, addDays(today, SOON_DAYS)] }),
  month: (today) => ({ [Op.between]: [today, addDays(today, 30)] }),
  all: () => ({ [Op.ne]: null }),
};

const dueList = async (actor, { window, page, pageSize }) => {
  const { date: today } = nowInIndia();
  const doctorId = doctorIdFor(actor);
  const patientFilter = doctorId ? { id: { [Op.in]: await doctorPatientIds(doctorId) } } : {};

  const { rows, count } = await PatientVaccination.findAndCountAll({
    where: { givenDate: null, dueDate: WINDOWS[window](today) },
    include: [
      { model: Patient, as: 'patient', required: true, where: { type: 'child', ...patientFilter }, attributes: ['id', 'patientCode', 'name', 'phone', 'guardianName', 'dob'] },
      { model: Vaccine, as: 'vaccine', required: true, where: { isActive: true } },
    ],
    order: [['dueDate', 'ASC'], ['id', 'ASC']],
    ...pageWindow({ page, pageSize }),
  });

  return pageResult(
    rows.map((row) => ({
      id: row.id,
      dueDate: row.dueDate,
      status: statusOf(row, today),
      vaccine: { id: row.vaccine.id, name: row.vaccine.name, ageLabel: row.vaccine.ageLabel },
      patient: row.patient,
    })),
    count,
    { page, pageSize },
  );
};

/** Counts for badges and the dashboard. */
const counts = async (actor) => {
  const { date: today } = nowInIndia();
  const doctorId = doctorIdFor(actor);
  const patientFilter = doctorId ? { id: { [Op.in]: await doctorPatientIds(doctorId) } } : {};
  const count = (dueDate) =>
    PatientVaccination.count({
      where: { givenDate: null, dueDate },
      include: [
        { model: Patient, as: 'patient', required: true, where: { type: 'child', ...patientFilter }, attributes: [] },
        { model: Vaccine, as: 'vaccine', required: true, where: { isActive: true }, attributes: [] },
      ],
    });
  const [overdue, week] = await Promise.all([count(WINDOWS.overdue(today)), count(WINDOWS.week(today))]);
  return { overdue, week };
};

/* ---------- master schedule ---------- */

const serializeVaccine = (vaccine) => ({
  id: vaccine.id,
  name: vaccine.name,
  ageLabel: vaccine.ageLabel,
  ageDays: vaccine.ageDays,
  notes: vaccine.notes,
  isActive: vaccine.isActive,
  sortOrder: vaccine.sortOrder,
});

const listVaccines = async ({ all = false } = {}) => {
  const rows = await Vaccine.findAll({ where: all ? {} : { isActive: true }, order: [['ageDays', 'ASC'], ['sortOrder', 'ASC'], ['id', 'ASC']] });
  return { items: rows.map(serializeVaccine) };
};

/** Creates dose records for every child with a date of birth who does not have this vaccine yet. */
const backfill = async (vaccine) => {
  const children = await Patient.findAll({ where: { type: 'child', dob: { [Op.ne]: null } }, attributes: ['id', 'dob'] });
  const rows = children.map((child) => ({ patientId: child.id, vaccineId: vaccine.id, dueDate: addDays(child.dob, vaccine.ageDays) }));
  if (rows.length) await PatientVaccination.bulkCreate(rows, { ignoreDuplicates: true });
};

/** Moves the due date of every pending dose of this vaccine (portable UPDATE ... JOIN for MySQL and MariaDB). */
const recomputePending = (vaccine) =>
  sequelize.query(
    `UPDATE patient_vaccinations pv
       JOIN patients p ON p.id = pv.patient_id
        SET pv.due_date = DATE_ADD(p.dob, INTERVAL :days DAY)
      WHERE pv.vaccine_id = :vaccineId AND pv.given_date IS NULL AND p.dob IS NOT NULL`,
    { replacements: { days: vaccine.ageDays, vaccineId: vaccine.id } },
  );

const createVaccine = async (actor, input, req) => {
  const last = await Vaccine.max('sortOrder');
  const vaccine = await Vaccine.create({ ...input, sortOrder: (last || 0) + 1 });
  if (vaccine.isActive) await backfill(vaccine);
  await activityLog.record({ user: actor, entityType: 'vaccine', entityId: vaccine.id, action: 'create', summary: `Added vaccine ${vaccine.name}`, req });
  return serializeVaccine(vaccine);
};

const updateVaccine = async (actor, id, input, req) => {
  const vaccine = await Vaccine.findByPk(id);
  if (!vaccine) throw ApiError.notFound('Vaccine not found');
  const wasActive = vaccine.isActive;
  const ageChanged = input.ageDays !== undefined && input.ageDays !== vaccine.ageDays;

  const changes = {};
  for (const [key, value] of Object.entries(input)) if (vaccine[key] !== value) changes[key] = { from: vaccine[key], to: value };
  await vaccine.update(input);

  if (ageChanged) await recomputePending(vaccine);
  if (vaccine.isActive && !wasActive) await backfill(vaccine);
  await activityLog.record({ user: actor, entityType: 'vaccine', entityId: vaccine.id, action: 'update', summary: `Edited vaccine ${vaccine.name}`, changes, req });
  return serializeVaccine(vaccine);
};

const removeVaccine = async (actor, id, req) => {
  const vaccine = await Vaccine.findByPk(id);
  if (!vaccine) throw ApiError.notFound('Vaccine not found');
  const given = await PatientVaccination.count({ where: { vaccineId: id, givenDate: { [Op.ne]: null } } });
  if (given) throw ApiError.conflict(`${given} dose${given === 1 ? ' has' : 's have'} already been recorded for this vaccine, so it cannot be deleted. Switch it off instead.`);
  await vaccine.destroy();
  await activityLog.record({ user: actor, entityType: 'vaccine', entityId: id, action: 'delete', summary: `Deleted vaccine ${vaccine.name}`, req });
};

module.exports = {
  syncForPatient, forPatient, markGiven, dueList, counts, listVaccines, createVaccine, updateVaccine, removeVaccine,
};

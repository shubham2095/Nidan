const { Op } = require('sequelize');
const { FollowUp, Lead, Patient, Appointment, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { nowInIndia } = require('../utils/datetime');
const { pageWindow, pageResult } = require('../utils/pagination');
const { ROLES } = require('../utils/constants');
const { assertPatientAccess } = require('./access.service');
const activityLog = require('./activityLog.service');

const INCLUDE = [
  { model: User, as: 'assignee', attributes: ['id', 'name'] },
  { model: Lead, as: 'lead', attributes: ['id', 'name', 'phone'], paranoid: false },
  { model: Patient, as: 'patient', attributes: ['id', 'patientCode', 'name', 'phone'], paranoid: false },
  { model: Appointment, as: 'appointment', attributes: ['id', 'bookingRef', 'appointmentDate'], paranoid: false },
];

const serialize = (followUp, today) => ({
  id: followUp.id,
  title: followUp.title,
  description: followUp.description,
  dueDate: followUp.dueDate,
  status: followUp.status,
  completedAt: followUp.completedAt,
  overdue: followUp.status === 'open' && followUp.dueDate < today,
  assignee: followUp.assignee || null,
  lead: followUp.lead || null,
  patient: followUp.patient || null,
  appointment: followUp.appointment || null,
});

/** Doctors only work with tasks assigned to themselves. */
const scope = (actor) => (actor.role === ROLES.DOCTOR ? { assignedTo: actor.id } : {});

const bucketWhere = (bucket, today) => {
  switch (bucket) {
    case 'overdue': return { status: 'open', dueDate: { [Op.lt]: today } };
    case 'today': return { status: 'open', dueDate: today };
    case 'upcoming': return { status: 'open', dueDate: { [Op.gt]: today } };
    case 'done': return { status: 'done' };
    default: return {};
  }
};

const list = async (actor, { bucket, assignedTo, patientId, leadId, page, pageSize }) => {
  const { date: today } = nowInIndia();
  const where = { ...bucketWhere(bucket, today), ...scope(actor) };
  if (patientId) where.patientId = patientId;
  if (leadId) where.leadId = leadId;
  if (assignedTo === 'me') where.assignedTo = actor.id;
  else if (assignedTo === 'none') where.assignedTo = null;
  else if (assignedTo && actor.role !== ROLES.DOCTOR) where.assignedTo = assignedTo;

  const { rows, count } = await FollowUp.findAndCountAll({
    where,
    include: INCLUDE,
    order: bucket === 'done' ? [['completedAt', 'DESC']] : [['dueDate', 'ASC'], ['id', 'ASC']],
    ...pageWindow({ page, pageSize }),
  });
  return pageResult(rows.map((row) => serialize(row, today)), count, { page, pageSize });
};

const findAccessible = async (actor, id) => {
  const followUp = await FollowUp.findOne({ where: { id, ...scope(actor) }, include: INCLUDE });
  if (!followUp) throw ApiError.notFound('Follow-up not found');
  return followUp;
};

const create = async (actor, input, req) => {
  if (actor.role === ROLES.DOCTOR) {
    if (input.leadId) throw ApiError.forbidden('Doctors cannot add follow-ups to leads.');
    if (input.patientId) await assertPatientAccess(actor, input.patientId);
  }
  const created = await FollowUp.create({
    ...input,
    // Doctors always assign tasks to themselves; staff default to themselves too.
    assignedTo: actor.role === ROLES.DOCTOR ? actor.id : input.assignedTo ?? actor.id,
    createdBy: actor.id,
  });
  await activityLog.record({ user: actor, entityType: 'follow_up', entityId: created.id, action: 'create', summary: 'Added a follow-up', req });
  return serialize(await findAccessible(actor, created.id), nowInIndia().date);
};

const update = async (actor, id, input, req) => {
  const followUp = await findAccessible(actor, id);
  const { status, ...fields } = input;
  const next = { ...fields };
  if (actor.role === ROLES.DOCTOR) delete next.assignedTo;

  if (status) {
    next.status = status;
    next.completedAt = status === 'done' ? new Date() : null;
  }

  await followUp.update(next);
  await activityLog.record({
    user: actor,
    entityType: 'follow_up',
    entityId: followUp.id,
    action: status ? 'status_change' : 'update',
    summary: status ? `Follow-up marked ${status}` : 'Edited a follow-up',
    req,
  });
  return serialize(await findAccessible(actor, id), nowInIndia().date);
};

const remove = async (actor, id, req) => {
  const followUp = await findAccessible(actor, id);
  await followUp.destroy();
  await activityLog.record({ user: actor, entityType: 'follow_up', entityId: followUp.id, action: 'delete', summary: 'Deleted a follow-up', req });
};

module.exports = { list, create, update, remove };

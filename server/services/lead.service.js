const { Op } = require('sequelize');
const { Lead, LeadNote, FollowUp, Doctor, User, Patient, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { nowInIndia, dateFromAge } = require('../utils/datetime');
const { pageWindow, pageResult, escapeLike } = require('../utils/pagination');
const patientService = require('./patient.service');
const mailService = require('./mail.service');
const activityLog = require('./activityLog.service');

/* ---------- website contact form ---------- */

/** Website contact form -> a new Lead in the CRM, plus a heads-up email to the clinic. */
const createFromContactForm = async ({ name, phone, email, message, preferredDoctorId, source = 'website' }, req) => {
  // An unknown or inactive doctor id is simply ignored; it must never block an enquiry.
  const doctor = preferredDoctorId ? await Doctor.findOne({ where: { id: preferredDoctorId, isActive: true } }) : null;

  const lead = await Lead.create({
    name,
    phone,
    email,
    message,
    preferredDoctorId: doctor?.id ?? null,
    source,
    status: 'new',
    consentAt: new Date(),
  });

  await activityLog.record({
    entityType: 'lead',
    entityId: lead.id,
    action: 'create',
    summary: source === 'booking_dropoff' ? 'Call-back request from the booking page' : 'New enquiry from the website contact form',
    req,
  });

  // Not awaited: the visitor should not wait on the mail server (sendMail never throws).
  mailService.sendContactNotification({ lead, doctorName: doctor?.name });

  return lead;
};

/* ---------- CRM ---------- */

const INCLUDE = [
  { model: User, as: 'assignee', attributes: ['id', 'name'] },
  { model: Doctor, as: 'preferredDoctor', attributes: ['id', 'name'] },
  { model: Patient, as: 'patient', attributes: ['id', 'patientCode', 'name'], paranoid: false },
];

const serialize = (lead) => ({
  id: lead.id,
  name: lead.name,
  phone: lead.phone,
  email: lead.email,
  message: lead.message,
  source: lead.source,
  status: lead.status,
  lostReason: lead.lostReason,
  nextFollowUpDate: lead.nextFollowUpDate,
  consentAt: lead.consentAt,
  createdAt: lead.createdAt,
  updatedAt: lead.updatedAt,
  assignee: lead.assignee || null,
  preferredDoctor: lead.preferredDoctor || null,
  patient: lead.patient || null,
});

const list = async (actor, { q, status, source, assignedTo, page, pageSize }) => {
  const where = {};
  if (status) where.status = status;
  if (source) where.source = source;
  if (assignedTo === 'me') where.assignedTo = actor.id;
  else if (assignedTo === 'none') where.assignedTo = null;
  else if (assignedTo) where.assignedTo = assignedTo;

  if (q) {
    const like = `%${escapeLike(q)}%`;
    const digits = q.replace(/[^\d+]/g, '');
    where[Op.or] = [
      { name: { [Op.like]: like } },
      { email: { [Op.like]: like } },
      ...(digits ? [{ phone: { [Op.like]: `%${escapeLike(digits)}%` } }] : []),
    ];
  }

  const { rows, count } = await Lead.findAndCountAll({
    where,
    include: INCLUDE,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    ...pageWindow({ page, pageSize }),
  });
  return pageResult(rows.map(serialize), count, { page, pageSize });
};

const findLead = async (id) => {
  const lead = await Lead.findOne({ where: { id }, include: INCLUDE });
  if (!lead) throw ApiError.notFound('Lead not found');
  return lead;
};

const get = async (id) => {
  const lead = await findLead(id);
  const [notes, followUps] = await Promise.all([
    LeadNote.findAll({ where: { leadId: id }, include: [{ model: User, as: 'author', attributes: ['id', 'name'] }], order: [['createdAt', 'DESC']] }),
    FollowUp.findAll({ where: { leadId: id }, order: [['status', 'ASC'], ['dueDate', 'ASC']] }),
  ]);
  return {
    ...serialize(lead),
    notes: notes.map((n) => ({ id: n.id, note: n.note, createdAt: n.createdAt, author: n.author || null })),
    followUps: followUps.map((f) => ({ id: f.id, title: f.title, dueDate: f.dueDate, status: f.status })),
  };
};

const create = async (actor, input, req) => {
  const lead = await Lead.create({ ...input, status: 'new', consentAt: input.consent ? new Date() : null, createdBy: actor.id });
  await activityLog.record({ user: actor, entityType: 'lead', entityId: lead.id, action: 'create', summary: `Added lead (${lead.source})`, req });
  return serialize(await findLead(lead.id));
};

const update = async (actor, id, input, req) => {
  const lead = await findLead(id);
  if (lead.status === 'converted') throw ApiError.conflict('This lead has already been converted to a patient.');
  if (input.status === 'lost' && !(input.lostReason || lead.lostReason)) {
    throw ApiError.badRequest('Please say why this lead was lost.', [{ field: 'lostReason', message: 'Add a short reason' }]);
  }

  const changes = {};
  for (const [key, value] of Object.entries(input)) {
    if (lead[key] !== value) changes[key] = { from: lead[key], to: value };
  }
  await lead.update({ ...input, ...(input.status && input.status !== 'lost' && { lostReason: null }) });
  await activityLog.record({ user: actor, entityType: 'lead', entityId: lead.id, action: changes.status ? 'status_change' : 'update', summary: `Updated lead ${lead.name}`, changes, req });
  return serialize(await findLead(id));
};

const addNote = async (actor, id, { note }, req) => {
  const lead = await findLead(id);
  const created = await LeadNote.create({ leadId: lead.id, userId: actor.id, note });
  // A first note usually means someone has reached out, so move a brand-new lead along.
  if (lead.status === 'new') await lead.update({ status: 'contacted' });
  await activityLog.record({ user: actor, entityType: 'lead', entityId: lead.id, action: 'note', summary: 'Added a note to a lead', req });
  return { id: created.id, note: created.note, createdAt: created.createdAt, author: { id: actor.id, name: actor.name } };
};

/** Turns a lead into a patient (matching an existing patient with the same phone and name) and marks it converted. */
const convert = async (actor, id, input, req) => {
  const lead = await findLead(id);
  if (lead.status === 'converted') throw ApiError.conflict('This lead has already been converted.');

  const today = nowInIndia().date;
  const dob = input.dob || (input.ageYears !== undefined ? dateFromAge(today, input.ageYears, input.ageMonths || 0) : undefined);

  const patient = await sequelize.transaction(async (transaction) => {
    const record = await patientService.findOrCreateFromBooking(
      { type: input.type, name: input.name || lead.name, phone: lead.phone, email: lead.email || undefined, dob, guardianName: input.guardianName },
      transaction,
    );
    await patientService.linkFamily(record.phone, transaction);
    await lead.update({ status: 'converted', patientId: record.id, lostReason: null }, { transaction });
    return record;
  });

  await activityLog.record({ user: actor, entityType: 'lead', entityId: lead.id, action: 'convert', summary: `Converted lead to patient ${patient.patientCode || patient.id}`, req });
  return { lead: serialize(await findLead(id)), patientId: patient.id };
};

const remove = async (actor, id, req) => {
  const lead = await findLead(id);
  await lead.destroy();
  await activityLog.record({ user: actor, entityType: 'lead', entityId: lead.id, action: 'delete', summary: `Deleted lead ${lead.name}`, req });
};

module.exports = { createFromContactForm, list, get, create, update, addNote, convert, remove };

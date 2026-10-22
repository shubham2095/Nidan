const { z } = require('zod');
const {
  APPOINTMENT_STATUSES, PATIENT_TYPES, LEAD_SOURCES, FOLLOW_UP_STATUSES,
} = require('../utils/constants');
const booking = require('./booking.validators');
const publicSchemas = require('./public.validators');

const { id, date, startTime } = booking;

const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value);
const emptyToNull = (value) => (value === '' ? null : value);

const optionalId = z.preprocess(emptyToUndefined, id.optional());
const optionalDate = z.preprocess(emptyToUndefined, date.optional());
const optionalText = (max) => z.preprocess(emptyToUndefined, z.string().trim().max(max, `Please use ${max} characters or fewer`).optional());
/** For PATCH bodies: "" or null clears the value. */
const clearable = (schema) => z.preprocess(emptyToNull, schema.nullable().optional());

const paging = {
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
const search = z.preprocess(emptyToUndefined, z.string().trim().max(100).optional());
const idParam = z.object({ id });

/* ---------- appointments ---------- */

const appointmentFilters = z.object({
  doctorId: optionalId,
  locationId: optionalId,
  patientId: optionalId,
  status: z.preprocess(emptyToUndefined, z.enum(APPOINTMENT_STATUSES).optional()),
  from: optionalDate,
  to: optionalDate,
  q: search,
  sort: z.enum(['asc', 'desc']).default('asc'),
  ...paging,
});

const calendarQuery = z.object({ doctorId: optionalId, locationId: optionalId, from: date, to: date });

const availabilityDates = z.object({ doctorId: id, locationId: id });
const availabilitySlots = availabilityDates.extend({ date });

const newPatient = booking.patient.extend({
  consent: z.literal(true, { error: 'Confirm that the patient agrees to their details being stored' }),
});

const createAppointment = z
  .object({
    patientId: optionalId,
    newPatient: newPatient.optional(),
    doctorId: id,
    locationId: id,
    date,
    startTime,
    source: z.enum(['phone', 'walk_in']),
    status: z.enum(['pending', 'confirmed']).default('confirmed'),
    reason: optionalText(500),
    staffNote: optionalText(1000),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.patientId) === Boolean(value.newPatient)) {
      ctx.addIssue({ code: 'custom', path: ['patientId'], message: 'Choose an existing patient or enter a new one' });
    }
    if (value.newPatient) {
      booking.checkChild(value.newPatient, (field, message) => ctx.addIssue({ code: 'custom', path: ['newPatient', field], message }));
    }
  });

const changeStatus = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  cancelReason: optionalText(500),
});

const reschedule = z.object({ date, startTime });

const updateAppointment = z.object({ reason: clearable(z.string().trim().max(500)), staffNote: clearable(z.string().trim().max(1000)) });

/* ---------- patients ---------- */

const tags = z.array(z.string().trim().min(1).max(30)).max(10).transform((list) => [...new Set(list)]);

const patientBody = z.object({
  type: z.enum(PATIENT_TYPES),
  name: z.string().trim().min(2, 'Enter the name').max(100),
  phone: publicSchemas.contact.shape.phone,
  email: publicSchemas.contact.shape.email,
  dob: optionalDate,
  gender: z.preprocess(emptyToUndefined, z.enum(['female', 'male', 'other']).optional()),
  guardianName: optionalText(100),
  tags: tags.optional(),
});

const createPatient = patientBody.extend({ consent: z.boolean().default(false) });

const updatePatient = z.object({
  type: z.enum(PATIENT_TYPES).optional(),
  name: z.string().trim().min(2, 'Enter the name').max(100).optional(),
  phone: publicSchemas.contact.shape.phone.optional(),
  email: clearable(z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'))),
  dob: clearable(date),
  gender: clearable(z.enum(['female', 'male', 'other'])),
  guardianName: clearable(z.string().trim().max(100)),
  tags: tags.optional(),
});

const patientList = z.object({ q: search, type: z.preprocess(emptyToUndefined, z.enum(PATIENT_TYPES).optional()), ...paging });

const RELATION_KINDS = ['mother_of', 'child_of', 'sibling_of', 'guardian_of', 'ward_of', 'other'];
const addRelation = z.object({ otherPatientId: id, thisIs: z.enum(RELATION_KINDS) });
const patientRelationParams = z.object({ id, relationId: id });
const noteParams = z.object({ id, noteId: id });

const visitNote = z.object({ note: z.string().trim().min(1, 'Write a note').max(10000), appointmentId: optionalId });
const updateVisitNote = z.object({ note: z.string().trim().min(1, 'Write a note').max(10000) });

const attachmentBody = z.object({ title: z.string().trim().min(1, 'Give the file a title').max(200) });

/* ---------- leads ---------- */

const leadList = z.object({
  q: search,
  status: z.preprocess(emptyToUndefined, z.enum(['new', 'contacted', 'converted', 'lost']).optional()),
  source: z.preprocess(emptyToUndefined, z.enum(LEAD_SOURCES).optional()),
  assignedTo: z.preprocess(emptyToUndefined, z.union([z.enum(['me', 'none']), z.coerce.number().int().positive()]).optional()),
  ...paging,
});

const createLead = z.object({
  name: z.string().trim().min(2, 'Enter the name').max(100),
  phone: publicSchemas.contact.shape.phone,
  email: publicSchemas.contact.shape.email,
  message: optionalText(2000),
  source: z.enum(LEAD_SOURCES),
  preferredDoctorId: optionalId,
  assignedTo: optionalId,
  nextFollowUpDate: optionalDate,
  consent: z.boolean().default(false),
});

const updateLead = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: publicSchemas.contact.shape.phone.optional(),
  email: clearable(z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'))),
  message: clearable(z.string().trim().max(2000)),
  source: z.enum(LEAD_SOURCES).optional(),
  status: z.enum(['new', 'contacted', 'lost']).optional(),
  lostReason: clearable(z.string().trim().max(500)),
  assignedTo: clearable(id),
  nextFollowUpDate: clearable(date),
  preferredDoctorId: clearable(id),
});

const leadNote = z.object({ note: z.string().trim().min(1, 'Write a note').max(5000) });

const convertLead = z
  .object({
    type: z.enum(PATIENT_TYPES),
    name: optionalText(100),
    dob: optionalDate,
    ageYears: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(18).optional()),
    ageMonths: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(11).optional()),
    guardianName: optionalText(100),
  })
  .superRefine((value, ctx) => {
    booking.checkChild(value, (field, message) => ctx.addIssue({ code: 'custom', path: [field], message }));
  });

/* ---------- follow-ups ---------- */

const followUpList = z.object({
  bucket: z.enum(['overdue', 'today', 'upcoming', 'done', 'all']).default('all'),
  assignedTo: z.preprocess(emptyToUndefined, z.union([z.enum(['me', 'none']), z.coerce.number().int().positive()]).optional()),
  patientId: optionalId,
  leadId: optionalId,
  ...paging,
});

const createFollowUp = z.object({
  title: z.string().trim().min(2, 'Give the task a title').max(200),
  description: optionalText(2000),
  dueDate: date,
  assignedTo: optionalId,
  leadId: optionalId,
  patientId: optionalId,
  appointmentId: optionalId,
});

const updateFollowUp = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: clearable(z.string().trim().max(2000)),
  dueDate: date.optional(),
  assignedTo: clearable(id),
  status: z.enum(FOLLOW_UP_STATUSES).optional(),
});

/** Small building blocks other validator files reuse. */
const helpers = { emptyToUndefined, emptyToNull, optionalId, optionalDate, optionalText, clearable, paging, search };

module.exports = {
  helpers, idParam, patientRelationParams, noteParams, appointmentFilters, calendarQuery, availabilityDates, availabilitySlots, createAppointment,
  changeStatus, reschedule, updateAppointment, createPatient, updatePatient, patientList, addRelation, visitNote,
  updateVisitNote, attachmentBody, leadList, createLead, updateLead, leadNote, convertLead, followUpList, createFollowUp,
  updateFollowUp,
};

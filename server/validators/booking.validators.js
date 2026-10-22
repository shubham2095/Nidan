const { z } = require('zod');
const { isValidDate, nowInIndia, dateFromAge } = require('../utils/datetime');
const { PATIENT_TYPES } = require('../utils/constants');
const publicSchemas = require('./public.validators');

const id = z.coerce.number().int().positive();
const date = z.string().refine(isValidDate, 'Choose a valid date');

const startTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Choose a valid time')
  .transform((value) => `${value.slice(0, 5)}:00`);

const dateQuery = z.object({ doctorId: id, locationId: id });
const slotsQuery = dateQuery.extend({ date });

const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value);

const patient = z.object({
  type: z.enum(PATIENT_TYPES),
  name: z.string().trim().min(2, 'Enter the patient\'s name').max(100, 'Please use 100 characters or fewer'),
  phone: publicSchemas.contact.shape.phone,
  email: publicSchemas.contact.shape.email,
  dob: z.preprocess(emptyToUndefined, date.optional()),
  ageYears: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(18).optional()),
  ageMonths: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(11).optional()),
  guardianName: z.preprocess(emptyToUndefined, z.string().trim().min(2, 'Enter the parent or guardian\'s name').max(100).optional()),
});

/** Extra rules for a child: guardian name, and either a plausible date of birth or an age. `issue(field, message)` reports problems. */
const checkChild = ({ type, dob, ageYears, guardianName }, issue) => {
  if (type !== 'child') return;
  const today = nowInIndia().date;

  if (!guardianName) issue('guardianName', 'Enter the parent or guardian\'s name');
  if (!dob && ageYears === undefined) {
    issue('dob', 'Enter the child\'s date of birth or age');
  } else if (dob && (dob > today || dob < dateFromAge(today, 19))) {
    issue('dob', 'Check the date of birth');
  }
};

const createBooking = z
  .object({
    doctorId: id,
    locationId: id,
    date,
    startTime,
    patient,
    reason: z.string().trim().max(500, 'Please use 500 characters or fewer').optional().transform((value) => value || undefined),
    consent: publicSchemas.contact.shape.consent,
    website: publicSchemas.contact.shape.website,
  })
  .superRefine((value, ctx) => {
    checkChild(value.patient, (field, message) => ctx.addIssue({ code: 'custom', path: ['patient', field], message }));
  });

module.exports = { dateQuery, slotsQuery, createBooking, patient, checkChild, date, startTime, id };

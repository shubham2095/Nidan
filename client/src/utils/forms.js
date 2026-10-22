import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .min(1, 'Enter your phone number')
  .refine((value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 13;
  }, 'Enter a valid phone number');

const name = z.string().trim().min(2, 'Enter your name').max(100, 'Please use 100 characters or fewer');
const consent = z.literal(true, { error: 'Please tick the box to continue' });

export const contactSchema = z.object({
  name,
  phone,
  email: z.union([z.literal(''), z.email('Enter a valid email address')]),
  preferredDoctorId: z.string(),
  message: z.string().trim().min(5, 'Tell us a little about how we can help').max(2000, 'Please use 2000 characters or fewer'),
  consent,
  website: z.string().optional(),
});

export const testimonialSchema = z.object({
  name,
  label: z.string().trim().max(100, 'Please use 100 characters or fewer'),
  rating: z.string(),
  content: z.string().trim().min(10, 'Please write at least a sentence').max(1000, 'Please use 1000 characters or fewer'),
  consent,
  website: z.string().optional(),
});

export const callbackSchema = z.object({ name, phone, consent });

const optionalEmail = z.union([z.literal(''), z.email('Enter a valid email address')]);
const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export const bookingPatientSchema = z
  .object({
    patientType: z.enum(['mother', 'child']),
    name: z.string().trim().min(2, "Enter the patient's name").max(100, 'Please use 100 characters or fewer'),
    guardianName: z.string().trim().max(100, 'Please use 100 characters or fewer'),
    ageMode: z.enum(['dob', 'age']),
    dob: z.string(),
    ageYears: z.string(),
    ageMonths: z.string(),
    phone,
    email: optionalEmail,
    reason: z.string().trim().max(500, 'Please use 500 characters or fewer'),
    consent,
    website: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.patientType !== 'child') return;
    const issue = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message });

    if (value.guardianName.trim().length < 2) issue('guardianName', "Enter the parent or guardian's name");

    if (value.ageMode === 'dob') {
      if (!value.dob) issue('dob', "Enter the child's date of birth");
      else if (value.dob > todayIso()) issue('dob', 'Date of birth cannot be in the future');
    } else {
      const years = Number(value.ageYears);
      if (value.ageYears === '' || !Number.isInteger(years) || years < 0 || years > 18) issue('ageYears', 'Enter an age from 0 to 18');
      const months = Number(value.ageMonths || 0);
      if (!Number.isInteger(months) || months < 0 || months > 11) issue('ageMonths', 'Months must be 0 to 11');
    }
  });

/** Maps the server's nested field names (patient.name ...) onto the flat form fields. */
const FIELD_MAP = { 'patient.type': 'patientType' };
export const mapBookingField = (field) => FIELD_MAP[field] || field.replace(/^patient\./, '');

/** Shows the server's field-level validation messages next to the matching inputs. */
export function applyServerErrors(error, setError) {
  const details = error.response?.data?.details;
  if (!Array.isArray(details)) return false;
  details.forEach(({ field, message }) => setError(field, { type: 'server', message }));
  return details.length > 0;
}

import { formatDateOnly, formatTime, whatsappHref } from './format.js';

export const TIME_ZONE = 'Asia/Kolkata';

/** Today's date in India as YYYY-MM-DD (not the browser's timezone). */
export const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE });

export const addDaysIso = (date, days) => {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

/** Monday of the week containing `date`. */
export const weekStartIso = (date) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDaysIso(date, -((day + 6) % 7));
};

/** "2 yrs 3 mths", "5 mths", "34 yrs" from a date of birth. */
export function ageText(dob) {
  if (!dob) return '';
  const today = todayIso();
  const [by, bm, bd] = dob.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let months = (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0);
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years >= 10) return `${years} yrs`;
  if (years >= 1) return rest ? `${years} yr${years > 1 ? 's' : ''} ${rest} mth${rest > 1 ? 's' : ''}` : `${years} yr${years > 1 ? 's' : ''}`;
  return `${months} mth${months === 1 ? '' : 's'}`;
}

export const phoneDigits = (phone = '') => phone.replace(/\D/g, '');

/** A wa.me link with the appointment confirmation already typed in. */
export function appointmentWhatsappLink(appointment, clinicName = 'Nidan Mother & Child Care') {
  const { patient, doctor, location } = appointment;
  const text =
    `Hello ${patient.name}, this is ${clinicName}. ` +
    `Your appointment with ${doctor.name} is ${appointment.status === 'pending' ? 'booked' : appointment.status === 'cancelled' ? 'cancelled' : 'confirmed'} ` +
    `for ${formatDateOnly(appointment.appointmentDate)} at ${formatTime(appointment.startTime)}, ${location.name}. ` +
    `Booking ID: ${appointment.bookingRef}.`;
  return whatsappHref(phoneDigits(patient.phone), text);
}

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
export const LEAD_STATUSES = ['new', 'contacted', 'converted', 'lost'];
export const LEAD_SOURCES = [
  ['website', 'Website'],
  ['phone', 'Phone'],
  ['walk_in', 'Walk-in'],
  ['instagram', 'Instagram'],
  ['referral', 'Referral'],
  ['booking_dropoff', 'Booking call-back'],
  ['other', 'Other'],
];
export const sourceLabel = (value) => LEAD_SOURCES.find(([key]) => key === value)?.[1] || value;

/* ---------- patient form state (shared by appointment, patient and lead-conversion forms) ---------- */

export const emptyPatient = () => ({
  type: 'mother',
  name: '',
  phone: '',
  email: '',
  gender: '',
  guardianName: '',
  ageMode: 'dob',
  dob: '',
  ageYears: '',
  ageMonths: '',
  tags: '',
});

/** Returns { field: message } for anything wrong; an empty object means valid. `needs` picks which fields are required. */
export function validatePatient(value, { identity = true } = {}) {
  const errors = {};
  if (identity) {
    if (value.name.trim().length < 2) errors.name = 'Enter the name';
    const digits = phoneDigits(value.phone);
    if (digits.length < 10 || digits.length > 13) errors.phone = 'Enter a valid phone number';
  }
  if (value.email && !/^\S+@\S+\.\S+$/.test(value.email.trim())) errors.email = 'Enter a valid email address';

  if (value.type === 'child') {
    if (value.guardianName.trim().length < 2) errors.guardianName = "Enter the parent or guardian's name";
    if (value.ageMode === 'dob') {
      if (!value.dob) errors.dob = "Enter the child's date of birth";
      else if (value.dob > todayIso()) errors.dob = 'Date of birth cannot be in the future';
    } else {
      const years = Number(value.ageYears);
      if (value.ageYears === '' || !Number.isInteger(years) || years < 0 || years > 18) errors.ageYears = 'Enter an age from 0 to 18';
      const months = Number(value.ageMonths || 0);
      if (!Number.isInteger(months) || months < 0 || months > 11) errors.ageMonths = 'Months must be 0 to 11';
    }
  }
  return errors;
}

/** Turns the form state into the API payload (only the fields that apply). */
export function toPatientPayload(value) {
  const child = value.type === 'child';
  return {
    type: value.type,
    name: value.name,
    phone: value.phone,
    email: value.email || undefined,
    ...(value.gender && { gender: value.gender }),
    ...(child && {
      guardianName: value.guardianName,
      ...(value.ageMode === 'dob' ? { dob: value.dob } : { ageYears: value.ageYears, ageMonths: value.ageMonths }),
    }),
    ...(!child && value.dob && { dob: value.dob }),
  };
}

/** Approximate date of birth for a person of the given age (used when only an age is known). */
export function dobFromAge(years, months = 0) {
  const today = new Date(`${todayIso()}T00:00:00Z`);
  today.setUTCFullYear(today.getUTCFullYear() - Number(years));
  today.setUTCMonth(today.getUTCMonth() - Number(months || 0));
  return today.toISOString().slice(0, 10);
}

const parseTags = (text) => [...new Set(text.split(',').map((tag) => tag.trim()).filter(Boolean))];

/** Body for POST/PATCH /patients: age is converted to a date of birth, empty optional fields clear the value on edit. */
export function toPatientBody(value, { editing = false } = {}) {
  const child = value.type === 'child';
  const dob = child && value.ageMode === 'age' ? dobFromAge(value.ageYears, value.ageMonths) : value.dob;
  const optional = (text) => (editing ? text.trim() : text.trim() || undefined);
  return {
    type: value.type,
    name: value.name,
    phone: value.phone,
    email: optional(value.email),
    gender: optional(value.gender),
    guardianName: child ? optional(value.guardianName) : editing ? '' : undefined,
    dob: dob || (editing ? '' : undefined),
    tags: parseTags(value.tags),
  };
}

export { parseTags };

/** Maps a failed request to { fieldName: message } (stripping prefixes like "newPatient.") plus a general message. */
export function serverFieldErrors(error, prefixes = ['newPatient.', 'patient.']) {
  const fields = {};
  const details = error.response?.data?.details;
  if (Array.isArray(details)) {
    for (const { field, message } of details) {
      const key = prefixes.reduce((name, prefix) => (name.startsWith(prefix) ? name.slice(prefix.length) : name), field);
      fields[key] = message;
    }
  }
  return { fields, message: Object.keys(fields).length ? 'Please check the highlighted fields.' : error.message };
}

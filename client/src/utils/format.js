const TIME_ZONE = 'Asia/Kolkata';

/** "18:00:00" -> "6 pm", "13:30:00" -> "1:30 pm" */
export function formatTime(value) {
  const [hours, minutes] = String(value).split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes ? `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}` : `${hour12} ${suffix}`;
}

/** ISO timestamp -> "22 October 2026" in Indian time */
export function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE }).format(
    new Date(value),
  );
}

/** ISO timestamp -> "22 Oct 2026, 6:30 pm" in Indian time */
export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIME_ZONE }).format(
    new Date(value),
  );
}

/** ISO timestamp -> "2026-10-22T18:30" for a datetime-local input, in Indian time. */
export function toIstInput(value) {
  if (!value) return '';
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: TIME_ZONE })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** "2026-10-22T18:30" (Indian time) -> ISO timestamp */
export const fromIstInput = (value) => (value ? new Date(`${value}:00+05:30`).toISOString() : '');

/** "2027-01-15" -> "Friday, 15 January 2027". Date-only strings are clinic dates, so no timezone shift is applied. */
export function formatDateOnly(value, { short = false } = {}) {
  const options = short
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat('en-IN', { ...options, timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

const DAY_NAMES = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

/** "Monday – Friday" -> "Mon–Fri", "7:00 am – 10:00 pm" -> "7 am – 10 pm" (for tight spaces such as the top bar). */
export const compactHours = (text = '') =>
  text
    .replace(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/g, (day) => DAY_NAMES[day])
    .replace(/(\d{1,2}):00/g, '$1')
    .replace(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*[–-]\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/g, '$1–$2');

/** Cities of some locations, in order and without repeats: "Noida" or "Noida & Greater Noida". */
export function cityList(locations = []) {
  const cities = [...new Set(locations.map((location) => location.city).filter(Boolean))];
  if (cities.length < 2) return cities[0] || '';
  return `${cities.slice(0, -1).join(', ')} & ${cities[cities.length - 1]}`;
}

/** "Our clinic in Noida" or "3 clinics in Noida & Greater Noida" */
export const clinicsLabel = (locations = []) =>
  locations.length === 1 ? `Our clinic in ${cityList(locations)}` : `${locations.length} clinics in ${cityList(locations)}`;

/** "Dr. Manisha Ranjan" -> "MR" */
export function initials(name = '') {
  return name
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export const telHref = (phone = '') => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const whatsappHref = (number = '', text = '') =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Trims text for meta descriptions without cutting a word in half. */
export function truncate(text = '', max = 158) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

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

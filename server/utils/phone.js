/**
 * Normalises a phone number to "+<countrycode><number>" so the same person is matched
 * regardless of how it was typed. Indian numbers may be entered as 9773507333,
 * 09773507333, 91 97735 07333 or +91-97735-07333. Returns null when the number is not valid.
 */
const normalizePhone = (input) => {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) {
    if (digits.startsWith('91')) return digits.length === 12 ? `+${digits}` : null;
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0\d{10}$/.test(digits)) return `+91${digits.slice(1)}`;
  return null;
};

module.exports = { normalizePhone };

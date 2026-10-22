const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes user-supplied text before it goes into an HTML email. */
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ENTITIES[char]);

module.exports = escapeHtml;

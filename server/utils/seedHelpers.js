/**
 * Creates a row only if none matches `where`. Existing rows are never touched,
 * so re-running seeders cannot overwrite edits made in the admin panel.
 */
const createOnce = (Model, where, values = {}, options = {}) =>
  Model.findOrCreate({ where, defaults: { ...where, ...values }, ...options });

const mapsSearchUrl = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const mapsEmbedUrl = (query) => `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

module.exports = { createOnce, mapsSearchUrl, mapsEmbedUrl };

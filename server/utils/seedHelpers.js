const { mapsSearchUrl, mapsEmbedUrl } = require('./maps');

/**
 * Creates a row only if none matches `where`. Existing rows are never touched,
 * so re-running seeders cannot overwrite edits made in the admin panel.
 */
const createOnce = (Model, where, values = {}, options = {}) =>
  Model.findOrCreate({ where, defaults: { ...where, ...values }, ...options });

module.exports = { createOnce, mapsSearchUrl, mapsEmbedUrl };

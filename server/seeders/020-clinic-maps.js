// Puts the exact Google Maps listing of each clinic on the website (the map and the "Get directions" link), replacing the
// maps that were made from the written address. New databases get them from 001-locations.js and 011-more-clinics.js.
const clinicMaps = require('../utils/clinicMaps');

module.exports = {
  async up({ models: { Location } }) {
    for (const [slug, { embedUrl, mapUrl }] of Object.entries(clinicMaps)) {
      const location = await Location.findOne({ where: { slug } });
      if (location) await location.update({ mapEmbedUrl: embedUrl, mapUrl });
    }
  },
};

const { createOnce, mapsSearchUrl, mapsEmbedUrl } = require('../utils/seedHelpers');

const PHONE = '+91 97735 07333, 0120-4545700';

// The first clinic. The Gaur City clinic and Cloudnine Hospital are added by 011-more-clinics.js.
const locations = [
  {
    slug: 'nidan-sector-51',
    name: 'Nidan – Sector 51',
    address: 'Basement B, 170, Block B, Sector 51',
    postalCode: '201303',
    phone: PHONE,
    isOwnClinic: true,
    sortOrder: 1,
  },
];

module.exports = {
  async up({ models: { Location } }) {
    for (const { slug, ...values } of locations) {
      const mapQuery = [values.name, values.address, 'Noida', 'Uttar Pradesh', values.postalCode].filter(Boolean).join(', ');
      await createOnce(Location, { slug }, {
        city: 'Noida',
        state: 'Uttar Pradesh',
        mapUrl: mapsSearchUrl(mapQuery),
        mapEmbedUrl: mapsEmbedUrl(mapQuery),
        ...values,
      });
    }
  },
};

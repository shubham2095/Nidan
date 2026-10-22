const { createOnce, mapsSearchUrl, mapsEmbedUrl } = require('../utils/seedHelpers');

const PHONE = '+91 97735 07333, 0120-4545700';

const locations = [
  {
    slug: 'nidan-sector-51',
    name: 'Nidan Mother & Child Care, Sector 51',
    address: 'B-170, Sector 51',
    postalCode: '201301',
    phone: PHONE,
    isOwnClinic: true,
    sortOrder: 1,
  },
  {
    slug: 'nidan-noida-extension',
    name: 'Nidan Noida Extension',
    address: 'Aarza Square 2, Shop No. 219, Gaur City 1, Noida Extension',
    phone: PHONE,
    isOwnClinic: true,
    sortOrder: 2,
  },
  {
    slug: 'cloudnine-hospital-gaur-city',
    name: 'Cloudnine Hospital, Gaur City',
    address: '5th Avenue, Gaur City 1, Sector 4, Noida Extension',
    postalCode: '201009',
    isOwnClinic: false,
    sortOrder: 3,
  },
  {
    slug: 'motherhood-hospital-sector-48',
    name: 'Motherhood Hospital, Sector 48',
    address: 'Sector 48',
    postalCode: '201301',
    isOwnClinic: false,
    sortOrder: 4,
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

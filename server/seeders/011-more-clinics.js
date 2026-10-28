const { createOnce, mapsSearchUrl, mapsEmbedUrl } = require('../utils/seedHelpers');
const clinicMaps = require('../utils/clinicMaps');

const PHONE = '+91 97735 07333, 0120-4545700';

// The second clinic (Gaur City). It is listed with Sector 51 on the Contact page, home page and footer.
const locations = [
  {
    slug: 'nidan-gaur-city',
    name: 'NIDAN Mother & Child Clinic – Gaur City',
    address: 'Aarza Square 2, Second floor, Shop No. 219, Gaur City 1',
    city: 'Greater Noida',
    postalCode: '201318',
    mapQuery:
      'Nidan Mother and Child Care, Aarza Square 2, Second floor, Shop No. 219, Gaur City 1, Greater Noida, Uttar Pradesh 201318',
    mapUrl: clinicMaps['nidan-gaur-city'].mapUrl,
    mapEmbedUrl: clinicMaps['nidan-gaur-city'].embedUrl,
    sortOrder: 2,
  },
];

// The starter About text and FAQ answer were written when there was one clinic. They are only rewritten while they
// still read exactly as seeded, so anything edited in Site settings is left alone.
const TEXT_UPDATES = {
  about: {
    from: '<p>You can see them both at our clinic in Sector 51, Noida.</p>',
    to: '<p>You can see them both at our clinics in Sector 51, Noida and in Gaur City, Greater Noida.</p>',
    apply: (value, from, to) => ({ ...value, body: value.body.replace(from, to) }),
  },
  faq: {
    from: 'Both see patients at our clinic in Sector 51, Noida. Our opening hours and address are on this page and on the Contact page, and you can pick a day and time in the booking steps.',
    to: 'Both see patients at our two clinics, in Sector 51, Noida and in Gaur City, Greater Noida. Our addresses and timings are on the Contact page, and you can pick a clinic, a day and a time in the booking steps.',
    apply: (value, from, to) => value.map((item) => ({ ...item, answer: item.answer.replace(from, to) })),
  },
};

module.exports = {
  async up({ models: { Location, Setting } }) {
    for (const { slug, mapQuery, ...values } of locations) {
      await createOnce(Location, { slug }, {
        state: 'Uttar Pradesh',
        phone: PHONE,
        isOwnClinic: true,
        mapUrl: mapsSearchUrl(mapQuery),
        mapEmbedUrl: mapsEmbedUrl(mapQuery),
        ...values,
      });
    }

    for (const [settingKey, { from, to, apply }] of Object.entries(TEXT_UPDATES)) {
      const row = await Setting.findOne({ where: { settingKey } });
      if (!row) continue;
      const next = apply(row.settingValue, from, to);
      if (JSON.stringify(next) !== JSON.stringify(row.settingValue)) await row.update({ settingValue: next });
    }
  },
};

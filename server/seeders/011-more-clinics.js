const { createOnce, mapsSearchUrl, mapsEmbedUrl } = require('../utils/seedHelpers');

const PHONE = '+91 97735 07333, 0120-4545700';

// Two more clinics, shown with the Sector 51 clinic on the Contact page, home page and footer.
// Doctor timings for them are set in Admin > Doctors. Until then the website says "timings will be updated soon"
// and online booking is not offered for these two.
const locations = [
  {
    slug: 'nidan-gaur-city',
    name: 'Nidan – Gaur City',
    address: 'S-219, Aarza Square 2, Gaur City 1, B, Greater Noida W Rd, Sector 16',
    city: 'Greater Noida',
    postalCode: '201318',
    mapQuery:
      'Nidan Mother and Child Care, S-219 Aarza Square 2, Gaur City 1, B, Greater Noida W Rd, Sector 16, Greater Noida, Uttar Pradesh 201318',
    sortOrder: 2,
  },
  {
    slug: 'cloudnine-gaur-city',
    name: 'Cloudnine Hospital – Gaur City',
    address: '5th Avenue Gaur City, Noida Extension, Gaur City 1, Sector 4',
    city: 'Noida',
    postalCode: '201016',
    mapQuery: 'Cloudnine Hospital, 5th Avenue Gaur City, Noida Extension, Gaur City 1, Sector 4, Noida, Uttar Pradesh 201016',
    sortOrder: 3,
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
    to: 'Both see patients at our clinics in Sector 51, Noida and in Gaur City, Greater Noida (including Cloudnine Hospital). Our addresses and timings are on the Contact page, and you can pick a clinic, a day and a time in the booking steps.',
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

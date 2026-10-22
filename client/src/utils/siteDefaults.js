// Used only until /api/public/site responds (or if it fails), so Call and WhatsApp always work.
// The real values live in the admin panel under Settings.
export const siteDefaults = {
  settings: {
    clinic: {
      name: 'Nidan Mother & Child Care',
      tagline: 'Trusted Healthcare for Mothers and Child in Noida',
      phonePrimary: '+91 97735 07333',
      phoneSecondary: '0120-4545700',
      whatsappNumber: '919773507333',
      email: 'info@nidanmotherandchildcare.com',
    },
    social: {},
    hero: {},
    announcement: { enabled: false },
    whyChooseUs: [],
    about: {},
    seo: {},
  },
  locations: [],
};

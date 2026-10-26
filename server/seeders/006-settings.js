const { createOnce } = require('../utils/seedHelpers');

const settings = {
  clinic: {
    name: 'NIDAN Mother & Child Clinic',
    tagline: 'Trusted Healthcare for Mothers and Child in Noida',
    phonePrimary: '+91 97735 07333',
    phoneSecondary: '0120-4545700',
    whatsappNumber: '919773507333',
    email: 'info@nidanmotherandchildcare.com',
  },
  social: {
    instagram: 'https://www.instagram.com/manisharanjan_',
    facebook: 'https://m.facebook.com/DrManishaRanjan/',
    youtube: 'https://www.youtube.com/@dr.rajeevranjan-nidanmothe1260',
  },
  hero: {
    heading: 'Trusted Healthcare for Mothers and Child in Noida',
    subheading:
      'Compassionate obstetric, gynaecology and paediatric care for your whole family, under one roof.',
    primaryCta: 'Book Appointment',
    secondaryCta: 'Meet Our Doctors',
  },
  announcement: {
    enabled: false,
    text: '',
    link: '',
  },
  whyChooseUs: [
    {
      title: 'Experienced & Compassionate Doctors',
      description: 'Qualified specialists who listen first and explain every step in simple language.',
      icon: 'heart-handshake',
    },
    {
      title: 'Comprehensive Services Under One Roof',
      description: 'Pregnancy, delivery, newborn and child healthcare together, so your family does not have to go far.',
      icon: 'building-2',
    },
    {
      title: 'State-of-the-Art Facilities',
      description: 'Modern facilities that support safe, accurate and comfortable care.',
      icon: 'sparkles',
    },
    {
      title: 'Patient-Centric Approach',
      description: 'Your comfort, privacy and questions come first at every visit.',
      icon: 'users',
    },
  ],
  about: {
    heading: 'About NIDAN Mother & Child Clinic',
    imageUrl: '/images/gallery/clinic-building-front.webp',
    imageAlt: 'The front of the NIDAN Mother & Child Clinic building in Sector 51, Noida',
    body:
      '<p>NIDAN Mother & Child Clinic is a mother and child clinic in Noida, run by two doctors who care for families from pregnancy through childhood.</p>' +
      '<p>Dr. Manisha Ranjan, Consultant Obstetrician & Gynaecologist, cares for women through pregnancy, childbirth and every stage of life. Dr. Rajeev Ranjan, Consultant Paediatrician & Neonatologist, looks after babies and children from their very first day.</p>' +
      '<p>You can see them both at our clinic in Sector 51, Noida.</p>',
  },
  seo: {
    siteTitle: 'NIDAN Mother & Child Clinic | Gynaecologist & Paediatrician in Noida',
    siteDescription:
      'Trusted healthcare for mothers and children in Noida. Book appointments with Dr. Manisha Ranjan (Obstetrician & Gynaecologist) and Dr. Rajeev Ranjan (Paediatrician & Neonatologist).',
  },
};

module.exports = {
  async up({ models: { Setting } }) {
    for (const [settingKey, settingValue] of Object.entries(settings)) {
      await createOnce(Setting, { settingKey }, { settingValue });
    }
  },
};

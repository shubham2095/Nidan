const { replaceTimetable } = require('../utils/seedHelpers');

// Brings a database that was seeded earlier in line with the content that new databases now get from 004, 006, 010 and 012:
//  - "Internal Medicine" becomes "PCOD & Lifestyle Management", and "Menopause Clinic" and "Endometriosis Care" are added
//  - Dr. Rajeev Ranjan's Sector 51 timetable is Monday to Friday 8:30 am-1 pm, Saturday and Sunday 10 am-1 pm, every day 6-9 pm
//  - the clinic email is rajeevnidan@gmail.com
// On a new database all of this is already in place, so this changes nothing there. Nothing that staff edited is overwritten
// except Dr. Rajeev's Sector 51 timetable, which is the point of this seeder; Gaur City is left alone.
const OLD_EMAIL = 'info@nidanmotherandchildcare.com';
const NEW_EMAIL = 'rajeevnidan@gmail.com';

const PCOD = {
  slug: 'pcod-lifestyle-management',
  name: 'PCOD & Lifestyle Management',
  icon: 'pill',
  shortDescription: 'Personalized care for PCOD, combining medical treatment with diet, exercise and lifestyle guidance.',
  description:
    '<p>PCOD is a common hormonal condition that can cause irregular periods, weight gain, acne and difficulty getting pregnant. Simple lifestyle changes, such as balanced eating, regular exercise, good sleep and stress control, can greatly improve symptoms. Our gynaecologist creates a personalised plan for you, combining lifestyle guidance with medical treatment when needed. Book a consultation today for caring, confidential PCOD support.</p>',
};

const NEW_SERVICES = [
  {
    slug: 'menopause-clinic',
    name: 'Menopause Clinic',
    icon: 'scan-heart',
    imageUrl: '/images/services/menopause-clinic.webp',
    sortOrder: 13,
    shortDescription: 'Expert care and support to help women manage menopause symptoms and stay healthy.',
    description:
      "<p>Menopause is a natural stage in a woman's life, but symptoms like hot flushes, night sweats, mood changes, poor sleep and irregular periods can affect daily life. Our menopause clinic offers personalised care, including symptom relief, lifestyle guidance and screening for bone health and heart health. Our gynaecologist helps you understand your options and feel your best through this transition. Book a consultation today for caring, confidential support.</p>",
  },
  {
    slug: 'endometriosis-care',
    name: 'Endometriosis Care',
    icon: 'heart-pulse',
    imageUrl: '/images/services/endometriosis-care.webp',
    sortOrder: 14,
    shortDescription: 'Diagnosis and personalised treatment to relieve endometriosis pain and protect fertility.',
    description:
      '<p>Endometriosis is a condition where tissue similar to the lining of the uterus grows outside it, often causing painful periods, pelvic pain, pain during intercourse and difficulty getting pregnant. Early diagnosis through a detailed consultation, examination and ultrasound helps us plan the right care for you. Treatment may include pain relief, hormonal therapy, fertility support or surgery when needed, based on your symptoms and goals. Book a consultation today for caring, confidential endometriosis support.</p>',
  },
];

// weekday: 0 = Sunday ... 6 = Saturday
const MON_TO_FRI = [1, 2, 3, 4, 5];
const SAT_SUN = [6, 0];
const RAJEEV_SECTOR_51 = {
  'nidan-sector-51': [
    { days: MON_TO_FRI, start: '08:30:00', end: '13:00:00' },
    { days: SAT_SUN, start: '10:00:00', end: '13:00:00' },
    { days: [...MON_TO_FRI, ...SAT_SUN], start: '18:00:00', end: '21:00:00' },
  ],
};

module.exports = {
  async up({ models }) {
    const { Service, Setting } = models;

    // 1. Internal Medicine -> PCOD & Lifestyle Management (only while the old service is still there)
    const old = await Service.findOne({ where: { slug: 'internal-medicine' } });
    const alreadyPcod = await Service.findOne({ where: { slug: PCOD.slug } });
    if (old && !alreadyPcod) await old.update(PCOD);

    // 2. The two new services; a service that staff already added keeps its text, and only gets a picture if it has none
    for (const { imageUrl, ...values } of NEW_SERVICES) {
      const [service, created] = await Service.findOrCreate({ where: { slug: values.slug }, defaults: { ...values, imageUrl } });
      if (!created && !service.imageUrl) await service.update({ imageUrl });
    }

    // 3. Dr. Rajeev's Sector 51 timetable
    await replaceTimetable(models, 'dr-rajeev-ranjan', RAJEEV_SECTOR_51);

    // 4. The clinic email, unless staff already set another one in Site settings
    const clinic = await Setting.findOne({ where: { settingKey: 'clinic' } });
    if (clinic && clinic.settingValue?.email === OLD_EMAIL) await clinic.update({ settingValue: { ...clinic.settingValue, email: NEW_EMAIL } });
  },
};

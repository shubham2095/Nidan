const { createOnce } = require('../utils/seedHelpers');

// Photos from the clinic's previous website, stored in client/public/images and served as static files.
// Pictures marked hidden are added but switched off (Admin > Gallery): graphic surgical views, very personal newborn
// photos, and 3D design renders carrying an interior designer's watermark. The clinic decides whether to show them.
const IMAGE_BASE = '/images/gallery/';

const gallery = [
  { file: 'clinic-building-front', category: 'clinic', alt: 'The front of the NIDAN Mother & Child Clinic building in Sector 51, Noida' },
  { file: 'doctor-with-baby-girl', category: 'happy-families', alt: 'A smiling doctor with a baby girl in her arms' },
  { file: 'waiting-area-green-wall', category: 'clinic', alt: 'Spacious waiting area with comfortable seating and green wall panels' },
  { file: 'doctor-holding-baby', category: 'happy-families', alt: 'A doctor holding a baby in the consultation room' },
  { file: 'reception-desk', category: 'clinic', alt: 'Marble reception desk with warm wooden panelling' },
  { file: 'doctor-smiling-with-baby', category: 'happy-families', alt: 'A doctor smiling with a baby in her arms' },
  { file: 'clinic-hall', category: 'clinic', alt: 'Bright, spacious clinic hall with seating along the wall' },
  { file: 'baby-with-doctor-and-nurse', category: 'happy-families', alt: 'A baby in an orange jacket with two women, one in scrubs, at the clinic' },
  { file: 'clinic-hall-seating', category: 'clinic', alt: 'Clinic hall with a row of seats and consultation rooms beyond' },
  { file: 'reception-lobby', category: 'clinic', alt: 'Reception lobby with a chandelier and marble counter', hidden: true },
  { file: 'consultation-room-shelves', category: 'clinic', alt: 'Consultation room with wooden shelving and tan leather chairs', hidden: true },
  { file: 'consultation-room-seating', category: 'clinic', alt: 'Consultation room with leather chairs and a wall of shelves', hidden: true },
  { file: 'consultation-room-corner', category: 'clinic', alt: 'Corner of the consultation room with tan chairs and display shelves', hidden: true },
  { file: 'waiting-area-seating', category: 'clinic', alt: 'Waiting area with rows of seats, green wall panels and framed pictures', hidden: true },
  { file: 'mother-and-baby-consultation', category: 'happy-families', alt: 'A mother and her baby with the doctor in the consultation room' },
  { file: 'mother-baby-at-reception', category: 'happy-families', alt: 'A mother holding her baby at the clinic reception with two visitors' },
  { file: 'parents-with-newborn', category: 'happy-families', alt: 'Parents cuddling their newborn baby in a studio portrait' },
  { file: 'two-women-with-newborn', category: 'happy-families', alt: 'Two women, one holding a newborn baby, smiling at the camera' },
  { file: 'family-with-newborn', category: 'happy-families', alt: 'A family with a newborn baby in the doctor\'s room' },
  { file: 'mother-baby-and-doctor', category: 'happy-families', alt: 'A mother holding her baby with the doctor and a visitor' },
  { file: 'doctor-holding-newborn', category: 'happy-families', alt: 'A smiling doctor holding a newborn baby' },
  { file: 'family-and-doctor', category: 'happy-families', alt: 'A family with their newborn baby and the doctor in the consultation room' },
  { file: 'couple-with-newborn-and-doctor', category: 'happy-families', alt: 'A couple with their newborn baby and the doctor' },
  { file: 'mother-resting-with-newborn', category: 'happy-families', alt: 'A mother resting with her newborn baby after delivery' },
  { file: 'mother-and-newborn-cheek-to-cheek', category: 'happy-families', alt: 'A mother and her newborn baby, cheek to cheek' },
  { file: 'mother-with-two-newborns', category: 'happy-families', alt: 'A smiling mother with two newborn babies' },
  { file: 'new-mother-with-newborn', category: 'happy-families', alt: 'A new mother with her newborn baby' },
  { file: 'mother-between-two-babies', category: 'happy-families', alt: 'A mother with her two newborn babies' },
  { file: 'mother-with-two-babies', category: 'happy-families', alt: 'A mother with her two newborn babies' },
  { file: 'newborn-on-mothers-chest', category: 'happy-families', alt: 'A newborn baby resting on its mother\'s chest' },
  { file: 'team-under-surgical-lights', category: 'team', alt: 'Doctors and staff smiling in the operation theatre under bright surgical lights' },
  { file: 'doctor-with-newborn-blue-scrubs', category: 'team', alt: 'A doctor in blue scrubs holding a newborn baby wrapped in a green blanket' },
  { file: 'team-with-newborn', category: 'team', alt: 'Doctors and staff in the operation theatre holding a newborn baby' },
  { file: 'team-with-mother', category: 'team', alt: 'The doctors and nursing team with a mother in the delivery room' },
  { file: 'team-thumbs-up', category: 'team', alt: 'The operation theatre team smiling and giving a thumbs up' },
  { file: 'team-of-three', category: 'team', alt: 'Three members of the team under the surgical lights' },
  { file: 'staff-with-newborn', category: 'team', alt: 'Doctors and staff in scrubs with a newborn baby' },
  { file: 'team-in-theatre', category: 'team', alt: 'The operation theatre team with a newborn baby' },
  { file: 'group-at-event', category: 'community', alt: 'A group of women posing together at an event' },
  { file: 'theatre-team-newborn-1', category: 'team', alt: 'Doctors with a newborn baby in the operation theatre', hidden: true },
  { file: 'theatre-team-newborn-2', category: 'team', alt: 'Doctors lifting a newborn baby in the operation theatre', hidden: true },
  { file: 'theatre-caesarean-1', category: 'team', alt: 'Surgical team with a newborn baby during a caesarean delivery', hidden: true },
  { file: 'theatre-caesarean-2', category: 'team', alt: 'Surgical team with a newborn baby during a caesarean delivery', hidden: true },
  { file: 'theatre-newborn-check', category: 'team', alt: 'A newborn baby being checked during delivery', hidden: true },
  { file: 'theatre-delivery', category: 'team', alt: 'A newborn baby being delivered in the operation theatre', hidden: true },
  { file: 'theatre-caesarean-3', category: 'team', alt: 'Doctors during a caesarean delivery', hidden: true },
  { file: 'theatre-doctor-lifting-newborn', category: 'team', alt: 'A doctor lifting a newborn baby during a caesarean delivery', hidden: true },
  { file: 'newborn-baby-1', category: 'happy-families', alt: 'A newborn baby', hidden: true },
  { file: 'newborn-baby-2', category: 'happy-families', alt: 'A newborn baby on a green blanket', hidden: true },
];

// Round pictures for the service cards and pages (also from the old home page).
const serviceImages = {
  'maternity': '/images/services/maternity.webp',
  'neonatology': '/images/services/neonatology.webp',
  'gynaecology': '/images/services/gynaecology.webp',
  'fertility-ivf': '/images/services/fertility-ivf.webp',
  'neonatal-icu': '/images/services/neonatal-icu.webp',
  'fetal-medicine': '/images/services/fetal-medicine.webp',
  'general-and-laparoscopic-surgery': '/images/services/general-and-laparoscopic-surgery.webp',
  'paediatrics': '/images/services/paediatrics.webp',
  'physiotherapy': '/images/services/physiotherapy.webp',
  'internal-medicine': '/images/services/internal-medicine.webp',
  'antenatal-classes': '/images/services/antenatal-classes.webp',
  'lactation': '/images/services/lactation.webp',
};

const HERO = { imageUrl: '/images/hero-clinic.webp', imageAlt: 'The front of the NIDAN Mother & Child Clinic building in Sector 51, Noida' };

module.exports = {
  async up({ models: { GalleryCategory, GalleryImage, Service, Setting } }) {
    const [family] = await createOnce(GalleryCategory, { slug: 'happy-families' }, { name: 'Happy Families', sortOrder: 4 });
    const categories = Object.fromEntries((await GalleryCategory.findAll()).map((category) => [category.slug, category.id]));
    categories['happy-families'] = family.id;

    for (const [index, { file, category, alt, hidden }] of gallery.entries()) {
      await createOnce(GalleryImage, { imageUrl: `${IMAGE_BASE}${file}.webp` }, {
        altText: alt,
        categoryId: categories[category],
        sortOrder: index + 1,
        isActive: !hidden,
      });
    }

    // Only services without a picture get one, so pictures uploaded in the admin panel are never replaced.
    for (const [slug, imageUrl] of Object.entries(serviceImages)) {
      await Service.update({ imageUrl }, { where: { slug, imageUrl: null } });
    }

    const hero = await Setting.findOne({ where: { settingKey: 'hero' } });
    if (hero && !hero.settingValue?.imageUrl) await hero.update({ settingValue: { ...hero.settingValue, ...HERO } });
  },
};

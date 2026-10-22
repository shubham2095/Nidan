const { createOnce } = require('../utils/seedHelpers');

// weekday: 0 = Sunday ... 6 = Saturday
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const MON_TO_FRI = [1, 2, 3, 4, 5];
const MON_TO_SAT = [1, 2, 3, 4, 5, 6];
const MON_WED_FRI = [1, 3, 5];
const TUE_THU_SAT = [2, 4, 6];
const SAT_SUN = [6, 0];

const doctors = [
  {
    slug: 'dr-manisha-ranjan',
    name: 'Dr. Manisha Ranjan',
    designation: 'Consultant Obstetrician & Gynaecologist',
    qualifications: 'MBBS, MGO, FGO, DGO',
    highlights: [],
    specialities: [
      'High-risk pregnancies',
      'Infertility treatments (IUI and more)',
      'Vaginal deliveries',
      "Women's health",
    ],
    bio:
      '<p>Dr. Manisha Ranjan is a Consultant Obstetrician & Gynaecologist at Nidan Mother & Child Care in Noida. ' +
      "She cares for women through every stage of life, with a special focus on high-risk pregnancies, infertility treatments such as IUI, vaginal deliveries and women's health.</p>" +
      '<p>She believes every pregnancy deserves attentive, compassionate and personalised care, from the first visit to the day you take your baby home.</p>',
    quote: 'The journey of a thousand miles begins with the heartbeat of a new life, echoing the promise of tomorrow.',
    sortOrder: 1,
    schedules: [
      { location: 'nidan-sector-51', days: ALL_DAYS, start: '18:00:00', end: '21:00:00' },
      { location: 'cloudnine-hospital-gaur-city', days: MON_TO_SAT, start: '09:00:00', end: '15:00:00' },
      { location: 'nidan-noida-extension', days: MON_WED_FRI, start: '13:00:00', end: '15:00:00' },
      { location: 'nidan-noida-extension', days: SAT_SUN, start: '15:00:00', end: '17:00:00' },
    ],
  },
  {
    slug: 'dr-rajeev-ranjan',
    name: 'Dr. Rajeev Ranjan',
    designation: 'Consultant Paediatrician & Neonatologist',
    qualifications: 'MD (Hons), DCH, FCH, MCH',
    highlights: ['Gold Medalist'],
    specialities: ['Child vaccinations', 'Routine check-ups', 'Paediatric conditions', 'Newborn care'],
    bio:
      '<p>Dr. Rajeev Ranjan is a Gold Medalist Consultant Paediatrician & Neonatologist at Nidan Mother & Child Care in Noida. ' +
      'He looks after children from the day they are born, with a focus on child vaccinations, routine check-ups, paediatric conditions and newborn care.</p>' +
      '<p>He works closely with parents to help every child grow up healthy, happy and well protected.</p>',
    quote: "Each child's potential is a delicate seed; with the right care, it blossoms into a vibrant future.",
    sortOrder: 2,
    schedules: [
      { location: 'nidan-sector-51', days: MON_TO_FRI, start: '09:00:00', end: '13:00:00' },
      { location: 'nidan-sector-51', days: [6], start: '10:00:00', end: '13:00:00' },
      { location: 'nidan-sector-51', days: [0], start: '10:00:00', end: '14:00:00' },
      { location: 'nidan-sector-51', days: ALL_DAYS, start: '18:00:00', end: '21:00:00' },
      { location: 'motherhood-hospital-sector-48', days: TUE_THU_SAT, start: '13:00:00', end: '15:00:00' },
      { location: 'nidan-noida-extension', days: MON_WED_FRI, start: '13:00:00', end: '15:00:00' },
      { location: 'nidan-noida-extension', days: SAT_SUN, start: '15:00:00', end: '17:00:00' },
    ],
  },
];

module.exports = {
  async up({ models: { Doctor, DoctorSchedule, Location } }) {
    const locationIds = Object.fromEntries((await Location.findAll()).map((l) => [l.slug, l.id]));

    for (const { schedules, slug, ...values } of doctors) {
      const [doctor, created] = await createOnce(Doctor, { slug }, values);
      // Schedules are only seeded for a brand-new doctor so admin edits are never duplicated.
      if (!created) continue;

      const rows = schedules.flatMap(({ location, days, start, end }) =>
        days.map((weekday) => ({
          doctorId: doctor.id,
          locationId: locationIds[location],
          weekday,
          startTime: start,
          endTime: end,
        })),
      );
      await DoctorSchedule.bulkCreate(rows);
    }
  },
};

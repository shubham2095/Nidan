const { createOnce } = require('../utils/seedHelpers');

/**
 * Starter schedule based on the standard Indian paediatric (IAP-style) immunisation
 * timetable. It is only a starting point: Dr. Rajeev Ranjan should review it, and every
 * row can be edited from the admin panel (Vaccination > Schedule).
 */
const schedule = [
  { label: 'Birth', days: 0, vaccines: ['BCG', 'OPV – Zero dose', 'Hepatitis B – Dose 1'] },
  {
    label: '6 weeks',
    days: 42,
    vaccines: [
      'DTwP/DTaP – Dose 1',
      'IPV – Dose 1',
      'Hib – Dose 1',
      'Hepatitis B – Dose 2',
      'Rotavirus – Dose 1',
      'PCV – Dose 1',
    ],
  },
  {
    label: '10 weeks',
    days: 70,
    vaccines: ['DTwP/DTaP – Dose 2', 'IPV – Dose 2', 'Hib – Dose 2', 'Rotavirus – Dose 2', 'PCV – Dose 2'],
  },
  {
    label: '14 weeks',
    days: 98,
    vaccines: [
      'DTwP/DTaP – Dose 3',
      'IPV – Dose 3',
      'Hib – Dose 3',
      'Hepatitis B – Dose 3',
      'Rotavirus – Dose 3',
      'PCV – Dose 3',
    ],
  },
  { label: '6 months', days: 183, vaccines: ['Influenza – Dose 1'] },
  { label: '7 months', days: 213, vaccines: ['Influenza – Dose 2'] },
  { label: '9 months', days: 274, vaccines: ['MMR – Dose 1', 'Typhoid conjugate – Dose 1'] },
  { label: '12 months', days: 365, vaccines: ['Hepatitis A – Dose 1'] },
  { label: '15 months', days: 457, vaccines: ['MMR – Dose 2', 'Varicella – Dose 1', 'PCV – Booster'] },
  {
    label: '18 months',
    days: 548,
    vaccines: ['DTwP/DTaP – Booster 1', 'IPV – Booster 1', 'Hib – Booster', 'Hepatitis A – Dose 2'],
  },
  { label: '4–6 years', days: 1826, vaccines: ['DTwP/DTaP – Booster 2', 'Varicella – Dose 2'] },
  { label: '10–12 years', days: 3652, vaccines: ['Tdap/Td', 'HPV – Dose 1 (girls)'] },
  { label: '10–12 years + 6 months', days: 3835, vaccines: ['HPV – Dose 2 (girls)'] },
];

module.exports = {
  async up({ models: { Vaccine } }) {
    let order = 0;
    for (const { label, days, vaccines } of schedule) {
      for (const name of vaccines) {
        order += 1;
        await createOnce(Vaccine, { name, ageDays: days }, { ageLabel: label, sortOrder: order });
      }
    }
  },
};

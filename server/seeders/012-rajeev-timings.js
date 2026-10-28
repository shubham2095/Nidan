const { replaceTimetable } = require('../utils/seedHelpers');

// weekday: 0 = Sunday ... 6 = Saturday
const MON_TO_FRI = [1, 2, 3, 4, 5];
const SAT_SUN = [6, 0];
const EVERY_DAY = [...MON_TO_FRI, ...SAT_SUN];

// Dr. Rajeev Ranjan's own timetable, replacing the starter timetable seeded for him in 002.
// Morning and evening are separate rows, so patients can book 15-minute slots in each.
const TIMETABLE = {
  'nidan-sector-51': [
    { days: MON_TO_FRI, start: '08:30:00', end: '14:00:00' },
    { days: SAT_SUN, start: '10:00:00', end: '14:00:00' },
    { days: EVERY_DAY, start: '18:00:00', end: '21:00:00' },
  ],
  // Tuesday and Thursday off
  'nidan-gaur-city': [{ days: [1, 3, 5, 6, 0], start: '15:00:00', end: '17:00:00' }],
};

module.exports = {
  async up({ models }) {
    await replaceTimetable(models, 'dr-rajeev-ranjan', TIMETABLE);
  },
};

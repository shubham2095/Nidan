const { replaceTimetable } = require('../utils/seedHelpers');

// weekday: 0 = Sunday ... 6 = Saturday
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 0];

// Dr. Manisha Ranjan's own timetable, replacing the starter timetable seeded for her in 002.
const TIMETABLE = {
  'nidan-sector-51': [
    { days: EVERY_DAY, start: '18:00:00', end: '21:00:00' },
    { days: [0], start: '12:00:00', end: '14:00:00' },
  ],
  // Tuesday and Thursday off
  'nidan-gaur-city': [{ days: [1, 3, 5, 6, 0], start: '15:00:00', end: '17:00:00' }],
  // Monday to Saturday
  'cloudnine-gaur-city': [{ days: [1, 2, 3, 4, 5, 6], start: '10:00:00', end: '14:00:00' }],
};

module.exports = {
  async up({ models }) {
    await replaceTimetable(models, 'dr-manisha-ranjan', TIMETABLE);
  },
};

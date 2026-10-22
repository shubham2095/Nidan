const { createOnce } = require('../utils/seedHelpers');

// Shown on the home page, Contact page and footer. Free text, so the clinic can write "Closed" or "By appointment".
// Edit in Site settings > Opening hours. (Online booking slots come from each doctor's timetable, set separately.)
const hours = [
  { days: 'Monday – Friday', time: '7:00 am – 10:00 pm' },
  { days: 'Saturday – Sunday', time: '12:00 pm – 6:00 pm' },
];

module.exports = {
  async up({ models: { Setting } }) {
    await createOnce(Setting, { settingKey: 'hours' }, { settingValue: hours });
  },
};

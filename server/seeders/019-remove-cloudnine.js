// Cloudnine Hospital is not part of NIDAN Mother & Child Clinic and is not on the website at all, not even in the
// booking steps. New databases never get it (011 and 013 do not create it); this removes it from an existing one,
// together with Dr. Manisha Ranjan's timings there, and takes it out of the FAQ answer if that still mentions it.
// If a booking was ever made at that location, the record is kept for the history and only switched off.
const FAQ_WITH_CLOUDNINE = [
  'Both see patients at our clinics in Sector 51, Noida and in Gaur City, Greater Noida (including Cloudnine Hospital). Our addresses and timings are on the Contact page, and you can pick a clinic, a day and a time in the booking steps.',
  'Both see patients at our two clinics, in Sector 51, Noida and in Gaur City, Greater Noida. Dr. Manisha Ranjan also sees patients at Cloudnine Hospital in Gaur City. Our addresses and timings are on the Contact page, and you can pick a clinic, a day and a time in the booking steps.',
];
const FAQ_TWO_CLINICS =
  'Both see patients at our two clinics, in Sector 51, Noida and in Gaur City, Greater Noida. Our addresses and timings are on the Contact page, and you can pick a clinic, a day and a time in the booking steps.';

module.exports = {
  async up({ models: { Appointment, DoctorSchedule, Location, Setting } }) {
    const cloudnine = await Location.findOne({ where: { slug: 'cloudnine-gaur-city' } });
    if (cloudnine) {
      if ((await Appointment.count({ where: { locationId: cloudnine.id } })) > 0) {
        await cloudnine.update({ isActive: false, isOwnClinic: false });
        await DoctorSchedule.update({ isActive: false }, { where: { locationId: cloudnine.id } });
      } else {
        await DoctorSchedule.destroy({ where: { locationId: cloudnine.id } });
        await cloudnine.destroy(); // any leave entered for this location goes with it (ON DELETE CASCADE)
      }
    }

    const faq = await Setting.findOne({ where: { settingKey: 'faq' } });
    if (faq) {
      const next = faq.settingValue.map((item) => ({
        ...item,
        answer: FAQ_WITH_CLOUDNINE.reduce((answer, old) => answer.replace(old, FAQ_TWO_CLINICS), item.answer),
      }));
      if (JSON.stringify(next) !== JSON.stringify(faq.settingValue)) await faq.update({ settingValue: next });
    }
  },
};

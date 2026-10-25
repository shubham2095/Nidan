// The clinic is called "NIDAN Mother & Child Clinic" everywhere on the website, never just "Nidan".
// Earlier seeders already use the new name for fresh installs; this one brings an existing database up to date.
// Only the old wording is replaced, so the rest of any text edited in the admin panel is untouched.
const OLD_NAMES = ['Nidan Mother & Child Care', 'Nidan Mother &amp; Child Care'];
const NEW_NAME = 'NIDAN Mother & Child Clinic';

const LOCATION_NAMES = {
  'Nidan – Sector 51': `${NEW_NAME} – Sector 51`,
  'Nidan – Gaur City': `${NEW_NAME} – Gaur City`,
};

// "…Child Care clinic building" would otherwise become "…Child Clinic clinic building"
const rename = (text) =>
  OLD_NAMES.reduce((current, old) => current.split(old).join(NEW_NAME), text)
    .split(`${NEW_NAME} clinic building`)
    .join(`${NEW_NAME} building`);

module.exports = {
  async up({ models: { Doctor, GalleryImage, Location, Setting } }) {
    // every website setting (clinic name, About page, search-engine title, hero picture description ...)
    for (const row of await Setting.findAll()) {
      const before = JSON.stringify(row.settingValue);
      const after = rename(before);
      if (after !== before) await row.update({ settingValue: JSON.parse(after) });
    }

    for (const location of await Location.findAll()) {
      const next = LOCATION_NAMES[location.name];
      if (next) await location.update({ name: next });
    }

    for (const doctor of await Doctor.findAll()) {
      const bio = doctor.bio ? rename(doctor.bio) : doctor.bio;
      if (bio !== doctor.bio) await doctor.update({ bio });
    }

    for (const image of await GalleryImage.findAll()) {
      const altText = rename(image.altText);
      if (altText !== image.altText) await image.update({ altText });
    }
  },
};

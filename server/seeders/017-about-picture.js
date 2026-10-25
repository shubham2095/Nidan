// The picture beside the text on the About page (Site settings > About page). New databases get it from
// 006-settings.js; this adds it to an existing one, unless a picture was already chosen there.
const IMAGE_URL = '/images/gallery/clinic-building-front.webp';
const IMAGE_ALT = 'The front of the NIDAN Mother & Child Clinic building in Sector 51, Noida';

module.exports = {
  async up({ models: { Setting } }) {
    const row = await Setting.findOne({ where: { settingKey: 'about' } });
    if (!row || row.settingValue.imageUrl) return;
    await row.update({ settingValue: { ...row.settingValue, imageUrl: IMAGE_URL, imageAlt: IMAGE_ALT } });
  },
};

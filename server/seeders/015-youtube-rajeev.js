// Dr. Rajeev Ranjan's YouTube channel, shown next to Dr. Manisha Ranjan's in the footer, top bar and mobile menu.
// New databases get it from 006-settings.js; this adds it to an existing one, unless a link was already saved.
const CHANNEL = 'https://www.youtube.com/@dr.rajeevranjan-nidanmothe1260';

module.exports = {
  async up({ models: { Setting } }) {
    const row = await Setting.findOne({ where: { settingKey: 'social' } });
    if (!row || row.settingValue.youtubeRajeev) return;
    await row.update({ settingValue: { ...row.settingValue, youtubeRajeev: CHANNEL } });
  },
};

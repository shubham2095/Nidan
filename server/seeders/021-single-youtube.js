// The website has one YouTube link: Dr. Rajeev Ranjan's channel. Dr. Manisha Ranjan's link was removed, and the
// separate "youtubeRajeev" setting is folded into "youtube". New databases get this from 006-settings.js; this brings an
// existing one in line, and leaves a link that staff set themselves alone.
const OLD_MANISHA_LINK = 'https://youtube.com/@drmanisharanjannidan';

module.exports = {
  async up({ models: { Setting } }) {
    const row = await Setting.findOne({ where: { settingKey: 'social' } });
    if (!row) return;

    const { youtube = '', youtubeRajeev = '', ...rest } = row.settingValue;
    const link = youtubeRajeev || (youtube === OLD_MANISHA_LINK ? '' : youtube);
    await row.update({ settingValue: { ...rest, youtube: link } });
  },
};

// The website no longer shows opening hours (the starter times were not the clinic's real ones); patients see each
// doctor's own timings instead. New databases never get the "hours" setting (009-opening-hours.js was removed); this
// deletes it from an existing one.
module.exports = {
  async up({ models: { Setting } }) {
    await Setting.destroy({ where: { settingKey: 'hours' } });
  },
};

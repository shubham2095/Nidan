const { Setting } = require('../models');
const ApiError = require('../utils/ApiError');
const { sanitizeRichText } = require('../utils/sanitize');
const activityLog = require('./activityLog.service');
const mediaService = require('./media.service');

// The only settings that exist; each one's shape is checked by validators/admin.validators.js.
const SETTING_KEYS = ['clinic', 'social', 'hero', 'announcement', 'whyChooseUs', 'faq', 'hours', 'about', 'seo'];

const getAll = async () => {
  const rows = await Setting.findAll({ where: { settingKey: SETTING_KEYS } });
  return { settings: Object.fromEntries(rows.map((row) => [row.settingKey, row.settingValue])) };
};

const update = async (actor, key, value, req) => {
  if (!SETTING_KEYS.includes(key)) throw ApiError.notFound('Unknown setting');
  const next = key === 'about' ? { ...value, body: sanitizeRichText(value.body) } : value;

  const [row, created] = await Setting.findOrCreate({ where: { settingKey: key }, defaults: { settingKey: key, settingValue: next, updatedBy: actor.id } });
  const previousImage = !created && (key === 'hero' || key === 'about') ? row.settingValue?.imageUrl : null;
  if (!created) await row.update({ settingValue: next, updatedBy: actor.id });
  // a replaced or removed banner or About picture is deleted from disk
  if (previousImage && previousImage !== next.imageUrl) await mediaService.removeByUrl(previousImage);

  await activityLog.record({ user: actor, entityType: 'setting', action: 'update', summary: `Updated site settings: ${key}`, req });
  return { key, value: next };
};

module.exports = { SETTING_KEYS, getAll, update };

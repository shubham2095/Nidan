const { Op } = require('sequelize');

/** "Fertility & IVF" -> "fertility-and-ivf" */
const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

/** Returns `base`, or `base-2`, `base-3`... so the slug is unique in the table (ignoring `exceptId`, the row being edited). */
const uniqueSlug = async (Model, base, { exceptId, field = 'slug' } = {}) => {
  let slug = base;
  for (let counter = 2; ; counter += 1) {
    const taken = await Model.count({ where: { [field]: slug, ...(exceptId && { id: { [Op.ne]: exceptId } }) }, paranoid: false });
    if (!taken) return slug;
    slug = `${base}-${counter}`;
  }
};

module.exports = { slugify, uniqueSlug };

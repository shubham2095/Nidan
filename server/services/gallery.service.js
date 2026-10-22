const { GalleryImage, GalleryCategory } = require('../models');
const ApiError = require('../utils/ApiError');
const createCrud = require('./crud.factory');
const mediaService = require('./media.service');
const activityLog = require('./activityLog.service');

const images = createCrud({
  Model: GalleryImage,
  entity: 'gallery_image',
  label: 'Gallery image',
  order: [['sortOrder', 'ASC'], ['id', 'DESC']],
  describe: (row) => row.title || row.altText,
  beforeRemove: (row) => mediaService.removeByUrl(row.imageUrl),
});

const ensureCategory = async (categoryId) => {
  if (categoryId && !(await GalleryCategory.count({ where: { id: categoryId } }))) {
    throw ApiError.badRequest('Unknown category', [{ field: 'categoryId', message: 'Choose an existing category' }]);
  }
};

/** Uploads one picture and adds it to the gallery. */
const upload = async (actor, file, { title, altText, categoryId }, req) => {
  await ensureCategory(categoryId);
  const { url } = await mediaService.saveImage(file, 'gallery');
  const last = await GalleryImage.max('sortOrder');
  const row = await GalleryImage.create({ title, altText, categoryId: categoryId || null, imageUrl: url, sortOrder: (last || 0) + 1 });
  await activityLog.record({ user: actor, entityType: 'gallery_image', entityId: row.id, action: 'create', summary: `Added gallery image ${row.title || row.altText}`, req });
  return row.toJSON();
};

const update = async (actor, id, input, req) => {
  await ensureCategory(input.categoryId);
  return images.update(actor, id, input, req);
};

module.exports = { list: images.list, upload, update, remove: images.remove, reorder: images.reorder };

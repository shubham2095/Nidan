const ApiError = require('../utils/ApiError');
const { detectFileType } = require('../utils/fileType');
const storage = require('./storage.service');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const FOLDERS = new Set(['content', 'doctors', 'gallery', 'blog']);

/** Saves an uploaded picture in the public area (served at /uploads) and returns its URL. PDFs and everything else are refused. */
const saveImage = async (file, folder = 'content') => {
  if (!file) throw ApiError.badRequest('Choose an image to upload.');
  if (!FOLDERS.has(folder)) throw ApiError.badRequest('Unknown upload folder.');
  if (file.size > MAX_IMAGE_BYTES) throw new ApiError(413, 'That image is larger than 5 MB.');

  const type = detectFileType(file.buffer);
  if (!type || !IMAGE_TYPES.has(type.mime)) throw ApiError.badRequest('Only JPEG, PNG or WebP images can be uploaded.');

  const key = await storage.save({ area: 'public', folder, buffer: file.buffer, extension: type.extension });
  return { key, url: storage.publicUrl(key) };
};

/** Deletes a previously uploaded public image given its URL. Other URLs (external links) are left alone. */
const removeByUrl = async (url) => {
  if (!url || !url.startsWith('/uploads/')) return;
  await storage.remove('public', url.slice('/uploads/'.length));
};

module.exports = { saveImage, removeByUrl };

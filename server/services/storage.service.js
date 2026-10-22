const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');

/**
 * File storage behind one small interface (save / openStream / remove), currently on local disk.
 * To move to Cloudinary or S3 later, only this file changes.
 *
 * Two areas: "public" files (gallery, blog, doctor photos) are served at /uploads;
 * "private" files (patient reports) are never served directly and are streamed only through
 * authenticated routes.
 */

const roots = { public: env.publicUploadDir, private: env.privateUploadDir };

const resolveKey = (area, key) => {
  const root = path.resolve(roots[area]);
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error('Invalid storage key');
  return full;
};

/** Stores a buffer under a random name inside `folder` and returns its storage key. */
const save = async ({ area = 'private', folder, buffer, extension }) => {
  const key = `${folder}/${crypto.randomBytes(16).toString('hex')}${extension}`;
  const target = resolveKey(area, key);
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.writeFile(target, buffer, { flag: 'wx' });
  return key;
};

const openStream = (area, key) => fs.createReadStream(resolveKey(area, key));

const remove = (area, key) => fs.promises.rm(resolveKey(area, key), { force: true });

/** Public URL for a file in the "public" area. */
const publicUrl = (key) => `/uploads/${key}`;

module.exports = { save, openStream, remove, publicUrl };

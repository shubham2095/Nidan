const multer = require('multer');

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Files are held in memory just long enough to be checked and handed to the storage service.
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_BYTES, files: 1 } });

/** Accepts one file in the given form field as req.file. */
const uploadSingle = (field) => memoryUpload.single(field);

module.exports = { uploadSingle, MAX_FILE_BYTES };

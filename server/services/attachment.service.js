const { Attachment, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const { detectFileType } = require('../utils/fileType');
const { assertPatientAccess } = require('./access.service');
const storage = require('./storage.service');
const activityLog = require('./activityLog.service');

const serialize = (attachment) => ({
  id: attachment.id,
  patientId: attachment.patientId,
  title: attachment.title,
  originalName: attachment.originalName,
  mimeType: attachment.mimeType,
  sizeBytes: attachment.sizeBytes,
  createdAt: attachment.createdAt,
  uploadedBy: attachment.uploader ? attachment.uploader.name : null,
});

const list = async (actor, patientId) => {
  await assertPatientAccess(actor, patientId);
  const rows = await Attachment.findAll({
    where: { patientId },
    include: [{ model: User, as: 'uploader', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  return { items: rows.map(serialize) };
};

const upload = async (actor, patientId, file, { title }, req) => {
  await assertPatientAccess(actor, patientId);
  if (!file) throw ApiError.badRequest('Choose a file to upload.');

  const type = detectFileType(file.buffer);
  if (!type) throw ApiError.badRequest('Only PDF, JPEG, PNG or WebP files can be uploaded.');

  const storageKey = await storage.save({ area: 'private', folder: `patients/${patientId}`, buffer: file.buffer, extension: type.extension });
  const attachment = await Attachment.create({
    patientId,
    title,
    originalName: file.originalname.slice(0, 255),
    storageKey,
    mimeType: type.mime,
    sizeBytes: file.size,
    uploadedBy: actor.id,
  });

  await activityLog.record({ user: actor, entityType: 'patient', entityId: patientId, action: 'upload', summary: 'Uploaded a patient file', req });
  return serialize(attachment);
};

const findAccessible = async (actor, id) => {
  const attachment = await Attachment.findByPk(id);
  if (!attachment) throw ApiError.notFound('File not found');
  await assertPatientAccess(actor, attachment.patientId);
  return attachment;
};

/** Returns the attachment row and a read stream; the route sets the download headers. */
const open = async (actor, id) => {
  const attachment = await findAccessible(actor, id);
  return { attachment, stream: storage.openStream('private', attachment.storageKey) };
};

/** Only the uploader or a super admin may delete a file. */
const remove = async (actor, id, req) => {
  const attachment = await findAccessible(actor, id);
  if (actor.role !== ROLES.SUPER_ADMIN && attachment.uploadedBy !== actor.id) {
    throw ApiError.forbidden('Only the person who uploaded this file or an administrator can delete it.');
  }
  await storage.remove('private', attachment.storageKey);
  await attachment.destroy();
  await activityLog.record({ user: actor, entityType: 'patient', entityId: attachment.patientId, action: 'delete_file', summary: 'Deleted a patient file', req });
};

module.exports = { list, upload, open, remove };

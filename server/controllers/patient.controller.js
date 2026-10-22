const patients = require('../services/patient.service');
const visitNotes = require('../services/visitNote.service');
const attachments = require('../services/attachment.service');
const ApiError = require('../utils/ApiError');
const respond = require('../utils/respond');

const list = respond((req) => patients.list(req.user, req.valid.query));
const get = respond((req) => patients.get(req.user, req.valid.params.id).then((patient) => ({ patient })));
const create = respond((req) => patients.create(req.user, req.valid.body, req).then((patient) => ({ patient })), 201);
const update = respond((req) => patients.update(req.user, req.valid.params.id, req.valid.body, req).then((patient) => ({ patient })));
const remove = async (req, res) => {
  await patients.remove(req.user, req.valid.params.id, req);
  res.status(204).end();
};

const addRelation = respond((req) => patients.addRelation(req.user, req.valid.params.id, req.valid.body, req).then((relations) => ({ relations })), 201);
const removeRelation = respond((req) =>
  patients.removeRelation(req.user, req.valid.params.id, req.valid.params.relationId, req).then((relations) => ({ relations })),
);

const listNotes = respond((req) => visitNotes.list(req.user, req.valid.params.id));
const createNote = respond((req) => visitNotes.create(req.user, req.valid.params.id, req.valid.body, req).then((note) => ({ note })), 201);
const updateNote = respond((req) => visitNotes.update(req.user, req.valid.params.noteId, req.valid.body, req).then((note) => ({ note })));

const listFiles = respond((req) => attachments.list(req.user, req.valid.params.id));
const uploadFile = respond(
  (req) => attachments.upload(req.user, req.valid.params.id, req.file, req.valid.body, req).then((attachment) => ({ attachment })),
  201,
);

const downloadFile = async (req, res, next) => {
  const { attachment, stream } = await attachments.open(req.user, req.valid.params.id);
  const asciiName = attachment.originalName.replace(/[^\w.\- ]/g, '_');
  res.set({
    'Content-Type': attachment.mimeType,
    'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  });
  stream.on('error', () => next(ApiError.notFound('This file is no longer available.')));
  stream.pipe(res);
};

const deleteFile = async (req, res) => {
  await attachments.remove(req.user, req.valid.params.id, req);
  res.status(204).end();
};

module.exports = {
  list, get, create, update, remove, addRelation, removeRelation, listNotes, createNote, updateNote,
  listFiles, uploadFile, downloadFile, deleteFile,
};

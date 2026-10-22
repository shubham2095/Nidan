const doctors = require('../services/doctorAdmin.service');
const content = require('../services/content.service');
const gallery = require('../services/gallery.service');
const blog = require('../services/blog.service');
const settings = require('../services/settings.service');
const users = require('../services/user.service');
const media = require('../services/media.service');
const activityLog = require('../services/activityLog.service');
const respond = require('../utils/respond');

const noContent = (action) => async (req, res) => {
  await action(req);
  res.status(204).end();
};

/** list / get / create / update / delete / reorder handlers for a createCrud service. `singular` names the response key. */
const crudController = (crud, singular) => ({
  list: respond(() => crud.list()),
  get: respond((req) => crud.get(req.valid.params.id).then((item) => ({ [singular]: item }))),
  create: respond((req) => crud.create(req.user, req.valid.body, req).then((item) => ({ [singular]: item })), 201),
  update: respond((req) => crud.update(req.user, req.valid.params.id, req.valid.body, req).then((item) => ({ [singular]: item }))),
  remove: noContent((req) => crud.remove(req.user, req.valid.params.id, req)),
  reorder: respond((req) => crud.reorder(req.user, req.valid.body.ids, req)),
});

const location = crudController(content.locations, 'location');
const service = crudController(content.services, 'service');
const specialty = crudController(content.specialties, 'specialty');
const galleryCategory = crudController(content.galleryCategories, 'category');
const blogCategory = crudController(content.blogCategories, 'category');

const doctor = {
  list: respond(() => doctors.list()),
  get: respond((req) => doctors.get(req.valid.params.id).then((item) => ({ doctor: item }))),
  create: respond((req) => doctors.create(req.user, req.valid.body, req).then((item) => ({ doctor: item })), 201),
  update: respond((req) => doctors.update(req.user, req.valid.params.id, req.valid.body, req).then((item) => ({ doctor: item }))),
  photo: respond((req) => doctors.uploadPhoto(req.user, req.valid.params.id, req.file, req).then((item) => ({ doctor: item }))),
  removePhoto: respond((req) => doctors.removePhoto(req.user, req.valid.params.id, req).then((item) => ({ doctor: item }))),
  schedules: respond((req) => doctors.replaceSchedules(req.user, req.valid.params.id, req.valid.body.schedules, req).then((item) => ({ doctor: item }))),
  addLeave: respond((req) => doctors.addLeave(req.user, req.valid.params.id, req.valid.body, req), 201),
  removeLeave: noContent((req) => doctors.removeLeave(req.user, req.valid.params.id, req.valid.params.leaveId, req)),
};

const testimonial = {
  list: respond((req) => content.listTestimonials(req.valid.query)),
  create: respond((req) => content.createTestimonial(req.user, req.valid.body, req).then((item) => ({ testimonial: item })), 201),
  update: respond((req) => content.updateTestimonial(req.user, req.valid.params.id, req.valid.body, req).then((item) => ({ testimonial: item }))),
  remove: noContent((req) => content.removeTestimonial(req.user, req.valid.params.id, req)),
};

const galleryImage = {
  list: respond(() => gallery.list()),
  upload: respond((req) => gallery.upload(req.user, req.file, req.valid.body, req).then((image) => ({ image })), 201),
  update: respond((req) => gallery.update(req.user, req.valid.params.id, req.valid.body, req).then((image) => ({ image }))),
  remove: noContent((req) => gallery.remove(req.user, req.valid.params.id, req)),
  reorder: respond((req) => gallery.reorder(req.user, req.valid.body.ids, req)),
};

const post = {
  list: respond((req) => blog.list(req.valid.query)),
  get: respond((req) => blog.get(req.valid.params.id).then((item) => ({ post: item }))),
  create: respond((req) => blog.create(req.user, req.valid.body, req).then((item) => ({ post: item })), 201),
  update: respond((req) => blog.update(req.user, req.valid.params.id, req.valid.body, req).then((item) => ({ post: item }))),
  remove: noContent((req) => blog.remove(req.user, req.valid.params.id, req)),
};

const setting = {
  list: respond(() => settings.getAll()),
  update: respond((req) => settings.update(req.user, req.valid.params.key, req.valid.body, req)),
};

const user = {
  list: respond(() => users.list()),
  create: respond((req) => users.create(req.user, req.valid.body, req).then((item) => ({ user: item })), 201),
  update: respond((req) => users.update(req.user, req.valid.params.id, req.valid.body, req).then((item) => ({ user: item }))),
  setPassword: respond(async (req) => {
    await users.setPassword(req.user, req.valid.params.id, req.valid.body.password, req);
    return { message: 'The password has been changed. The person must sign in again.' };
  }),
  sendResetLink: respond(async (req) => {
    await users.sendResetLink(req.user, req.valid.params.id, req);
    return { message: 'A password reset link has been emailed.' };
  }),
};

const activity = { list: respond((req) => activityLog.list(req.valid.query)) };

const mediaUpload = respond(async (req) => media.saveImage(req.file, req.valid.body.folder).then(({ url }) => ({ url })), 201);

module.exports = {
  location, service, specialty, galleryCategory, blogCategory, doctor, testimonial, galleryImage, post, setting, user, activity, mediaUpload,
};

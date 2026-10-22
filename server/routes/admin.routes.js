const router = require('express').Router();
const c = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { guard } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const s = require('../validators/admin.validators');

// guard() with no roles = super admin only; guard('doctor') = doctors and super admins;
// guard('receptionist') = reception and super admins; guard('doctor','receptionist') = all staff.
const adminOnly = guard();
const doctorOrAdmin = guard('doctor');
const allStaff = guard('doctor', 'receptionist');
const withId = validate({ params: s.idParam });
const body = (schema) => validate({ body: schema });

/** Standard routes for a table managed by createCrud. */
const crudRoutes = (path, controller, { create, update, withReorder = true }) => {
  router.get(path, adminOnly, controller.list);
  router.post(path, adminOnly, body(create), controller.create);
  if (withReorder) router.post(`${path}/reorder`, adminOnly, body(s.reorder), controller.reorder);
  router.get(`${path}/:id`, adminOnly, withId, controller.get);
  router.patch(`${path}/:id`, adminOnly, validate({ params: s.idParam, body: update }), controller.update);
  router.delete(`${path}/:id`, adminOnly, withId, controller.remove);
};

/* Doctors: everyone can read; a doctor edits only their own profile and timetable (the service checks). */
router.get('/doctors', allStaff, c.doctor.list);
router.post('/doctors', adminOnly, body(s.createDoctor), c.doctor.create);
router.get('/doctors/:id', allStaff, withId, c.doctor.get);
router.patch('/doctors/:id', doctorOrAdmin, validate({ params: s.idParam, body: s.updateDoctor }), c.doctor.update);
router.put('/doctors/:id/schedules', doctorOrAdmin, validate({ params: s.idParam, body: s.scheduleRows }), c.doctor.schedules);
router.post('/doctors/:id/photo', doctorOrAdmin, withId, uploadSingle('file'), c.doctor.photo);
router.delete('/doctors/:id/photo', doctorOrAdmin, withId, c.doctor.removePhoto);
router.post('/doctors/:id/leaves', allStaff, validate({ params: s.idParam, body: s.leave }), c.doctor.addLeave);
router.delete('/doctors/:id/leaves/:leaveId', allStaff, validate({ params: s.leaveParams }), c.doctor.removeLeave);

/* Everything below is super admin only. */
crudRoutes('/locations', c.location, { create: s.createLocation, update: s.updateLocation });
crudRoutes('/services', c.service, { create: s.createService, update: s.updateService });
crudRoutes('/specialties', c.specialty, { create: s.specialty, update: s.updateSpecialty });
crudRoutes('/gallery/categories', c.galleryCategory, { create: s.category, update: s.updateCategory });
crudRoutes('/blog/categories', c.blogCategory, { create: s.category, update: s.updateCategory, withReorder: false });

router.get('/testimonials', adminOnly, validate({ query: s.testimonialList }), c.testimonial.list);
router.post('/testimonials', adminOnly, body(s.createTestimonial), c.testimonial.create);
router.patch('/testimonials/:id', adminOnly, validate({ params: s.idParam, body: s.updateTestimonial }), c.testimonial.update);
router.delete('/testimonials/:id', adminOnly, withId, c.testimonial.remove);

router.get('/gallery/images', adminOnly, c.galleryImage.list);
// multer runs first so the form fields exist when the body is validated
router.post('/gallery/images', adminOnly, uploadSingle('file'), body(s.galleryUpload), c.galleryImage.upload);
router.post('/gallery/images/reorder', adminOnly, body(s.reorder), c.galleryImage.reorder);
router.patch('/gallery/images/:id', adminOnly, validate({ params: s.idParam, body: s.galleryUpdate }), c.galleryImage.update);
router.delete('/gallery/images/:id', adminOnly, withId, c.galleryImage.remove);

router.get('/blog/posts', adminOnly, validate({ query: s.blogList }), c.post.list);
router.post('/blog/posts', adminOnly, body(s.createPost), c.post.create);
router.get('/blog/posts/:id', adminOnly, withId, c.post.get);
router.patch('/blog/posts/:id', adminOnly, validate({ params: s.idParam, body: s.updatePost }), c.post.update);
router.delete('/blog/posts/:id', adminOnly, withId, c.post.remove);

router.post('/media/images', adminOnly, uploadSingle('file'), validate({ body: s.mediaUpload }), c.mediaUpload);

router.get('/settings', adminOnly, c.setting.list);
// the shape of the body depends on which setting is being saved
router.put(
  '/settings/:key',
  adminOnly,
  validate({ params: s.settingKey }),
  (req, res, next) => validate({ body: s.settingSchemas[req.valid.params.key] })(req, res, next),
  c.setting.update,
);

router.get('/users', adminOnly, c.user.list);
router.post('/users', adminOnly, body(s.createUser), c.user.create);
router.patch('/users/:id', adminOnly, validate({ params: s.idParam, body: s.updateUser }), c.user.update);
router.post('/users/:id/password', adminOnly, validate({ params: s.idParam, body: s.setPassword }), c.user.setPassword);
router.post('/users/:id/reset-link', adminOnly, withId, c.user.sendResetLink);

router.get('/activity', adminOnly, validate({ query: s.activityQuery }), c.activity.list);

module.exports = router;

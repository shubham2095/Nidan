const router = require('express').Router();
const controller = require('../controllers/public.controller');
const validate = require('../middleware/validate');
const publicCache = require('../middleware/publicCache');
const { publicFormLimiter } = require('../middleware/rateLimit');
const schemas = require('../validators/public.validators');

// Everything here is public: no patient data is ever returned from these routes.
const cached = publicCache(60);
const withSlug = validate({ params: schemas.slugParam });

router.get('/site', cached, controller.site);
router.get('/home', cached, controller.home);
router.get('/doctors', cached, controller.doctors);
router.get('/doctors/:slug', cached, withSlug, controller.doctor);
router.get('/services', cached, controller.services);
router.get('/services/:slug', cached, withSlug, controller.service);
router.get('/specialties', cached, controller.specialties);
router.get('/testimonials', cached, controller.testimonials);
router.get('/gallery', cached, controller.gallery);
router.get('/blog', cached, validate({ query: schemas.blogQuery }), controller.posts);
router.get('/blog/categories', cached, controller.postCategories);
router.get('/blog/:slug', cached, withSlug, controller.post);

router.post('/contact', publicFormLimiter, validate({ body: schemas.contact }), controller.submitContact);
router.post('/testimonials', publicFormLimiter, validate({ body: schemas.testimonial }), controller.submitTestimonial);

module.exports = router;

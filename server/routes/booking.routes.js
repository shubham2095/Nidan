const router = require('express').Router();
const controller = require('../controllers/booking.controller');
const validate = require('../middleware/validate');
const { publicFormLimiter } = require('../middleware/rateLimit');
const schemas = require('../validators/booking.validators');

router.get('/dates', validate({ query: schemas.dateQuery }), controller.dates);
router.get('/slots', validate({ query: schemas.slotsQuery }), controller.slots);
router.post('/', publicFormLimiter, validate({ body: schemas.createBooking }), controller.create);

module.exports = router;

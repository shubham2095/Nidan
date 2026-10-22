const router = require('express').Router();
const controller = require('../controllers/appointment.controller');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const schemas = require('../validators/crm.validators');

// super_admin passes every requireRole check. Doctors see only their own appointments (enforced in the service).
const receptionOnly = requireRole('receptionist');
const allStaff = requireRole('doctor', 'receptionist');
const withId = validate({ params: schemas.idParam });

router.use(authenticate);

router.get('/', allStaff, validate({ query: schemas.appointmentFilters }), controller.list);
router.get('/calendar', allStaff, validate({ query: schemas.calendarQuery }), controller.calendar);
router.get('/export.csv', allStaff, validate({ query: schemas.appointmentFilters }), controller.exportCsv);
router.get('/availability/dates', receptionOnly, validate({ query: schemas.availabilityDates }), controller.dates);
router.get('/availability/slots', receptionOnly, validate({ query: schemas.availabilitySlots }), controller.slots);
router.post('/', receptionOnly, validate({ body: schemas.createAppointment }), controller.create);

router.get('/:id', allStaff, withId, controller.get);
router.patch('/:id', receptionOnly, validate({ params: schemas.idParam, body: schemas.updateAppointment }), controller.update);
router.patch('/:id/status', allStaff, validate({ params: schemas.idParam, body: schemas.changeStatus }), controller.changeStatus);
router.post('/:id/reschedule', receptionOnly, validate({ params: schemas.idParam, body: schemas.reschedule }), controller.reschedule);

module.exports = router;

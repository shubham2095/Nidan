const router = require('express').Router();
const controller = require('../controllers/crm.controller');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const schemas = require('../validators/crm.validators');

// Mounted at the API root, so authentication is attached per route (unknown URLs must still 404).
const guard = (...roles) => [authenticate, requireRole(...roles)];
const receptionOnly = guard('receptionist'); // reception + super admin
const allStaff = guard('doctor', 'receptionist');
const adminOnly = guard();
const withId = validate({ params: schemas.idParam });

router.get('/dashboard', allStaff, controller.dashboardGet);
router.get('/users/options', receptionOnly, controller.userOptions);

// Leads: reception and super admin only (doctors do not handle enquiries)
router.get('/leads', receptionOnly, validate({ query: schemas.leadList }), controller.leadList);
router.post('/leads', receptionOnly, validate({ body: schemas.createLead }), controller.leadCreate);
router.get('/leads/:id', receptionOnly, withId, controller.leadGet);
router.patch('/leads/:id', receptionOnly, validate({ params: schemas.idParam, body: schemas.updateLead }), controller.leadUpdate);
router.delete('/leads/:id', adminOnly, withId, controller.leadDelete);
router.post('/leads/:id/notes', receptionOnly, validate({ params: schemas.idParam, body: schemas.leadNote }), controller.leadNote);
router.post('/leads/:id/convert', receptionOnly, validate({ params: schemas.idParam, body: schemas.convertLead }), controller.leadConvert);

// Follow-ups: everyone, but doctors only see tasks assigned to them (enforced in the service)
router.get('/follow-ups', allStaff, validate({ query: schemas.followUpList }), controller.followUpList);
router.post('/follow-ups', allStaff, validate({ body: schemas.createFollowUp }), controller.followUpCreate);
router.patch('/follow-ups/:id', allStaff, validate({ params: schemas.idParam, body: schemas.updateFollowUp }), controller.followUpUpdate);
router.delete('/follow-ups/:id', allStaff, withId, controller.followUpDelete);

module.exports = router;

const router = require('express').Router();
const controller = require('../controllers/patient.controller');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const schemas = require('../validators/crm.validators');

// Patient files are private: they are only ever sent through these authenticated routes.
const allStaff = requireRole('doctor', 'receptionist');
const withId = validate({ params: schemas.idParam });

router.use(authenticate);
router.get('/:id/download', allStaff, withId, controller.downloadFile);
router.delete('/:id', allStaff, withId, controller.deleteFile);

module.exports = router;

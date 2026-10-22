const router = require('express').Router();
const controller = require('../controllers/patient.controller');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const schemas = require('../validators/crm.validators');

const receptionOnly = requireRole('receptionist');
const allStaff = requireRole('doctor', 'receptionist');
const clinicalOnly = requireRole('doctor'); // doctors and super admins; reception never reads medical notes
const adminOnly = requireRole();
const withId = validate({ params: schemas.idParam });

router.use(authenticate);

router.get('/', allStaff, validate({ query: schemas.patientList }), controller.list);
router.post('/', receptionOnly, validate({ body: schemas.createPatient }), controller.create);
router.get('/:id', allStaff, withId, controller.get);
router.patch('/:id', allStaff, validate({ params: schemas.idParam, body: schemas.updatePatient }), controller.update);
router.delete('/:id', adminOnly, withId, controller.remove);

router.post('/:id/relations', receptionOnly, validate({ params: schemas.idParam, body: schemas.addRelation }), controller.addRelation);
router.delete('/:id/relations/:relationId', receptionOnly, validate({ params: schemas.patientRelationParams }), controller.removeRelation);

router.get('/:id/notes', clinicalOnly, withId, controller.listNotes);
router.post('/:id/notes', clinicalOnly, validate({ params: schemas.idParam, body: schemas.visitNote }), controller.createNote);
router.patch('/:id/notes/:noteId', clinicalOnly, validate({ params: schemas.noteParams, body: schemas.updateVisitNote }), controller.updateNote);

router.get('/:id/attachments', allStaff, withId, controller.listFiles);
// multer runs first so the form field (title) exists when the body is validated
router.post('/:id/attachments', allStaff, withId, uploadSingle('file'), validate({ body: schemas.attachmentBody }), controller.uploadFile);

module.exports = router;

const router = require('express').Router();
const controller = require('../controllers/vaccination.controller');
const validate = require('../middleware/validate');
const { guard } = require('../middleware/auth');
const s = require('../validators/admin.validators');

// Everyone can read the schedule and the due list; changing the schedule is for doctors and super admins.
const allStaff = guard('doctor', 'receptionist');
const clinical = guard('doctor');
const withId = validate({ params: s.idParam });

router.get('/vaccines', allStaff, validate({ query: s.vaccineList }), controller.listVaccines);
router.post('/vaccines', clinical, validate({ body: s.vaccine }), controller.createVaccine);
router.patch('/vaccines/:id', clinical, validate({ params: s.idParam, body: s.updateVaccine }), controller.updateVaccine);
router.delete('/vaccines/:id', clinical, withId, controller.deleteVaccine);

router.get('/vaccinations/due', allStaff, validate({ query: s.dueQuery }), controller.due);
router.get('/vaccinations/counts', allStaff, controller.counts);

module.exports = router;

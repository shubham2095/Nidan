const router = require('express').Router();
const { sequelize } = require('../models');

router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'up', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down', time: new Date().toISOString() });
  }
});

router.use('/auth', require('./auth.routes'));
router.use('/public', require('./public.routes'));

// CRM (staff only; every route below requires a signed-in user and checks the role)
router.use('/appointments', require('./appointment.routes'));
router.use('/patients', require('./patient.routes'));
router.use('/attachments', require('./attachment.routes'));
router.use(require('./crm.routes'));

module.exports = router;

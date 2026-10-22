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

module.exports = router;

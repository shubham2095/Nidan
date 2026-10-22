const router = require('express').Router();
const c = require('../controllers/seo.controller');

router.get('/robots.txt', c.robots);
router.get('/sitemap.xml', c.sitemap);

module.exports = router;

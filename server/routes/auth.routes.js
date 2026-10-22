const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimit');
const schemas = require('../validators/auth.validators');

router.post('/login', loginLimiter, validate({ body: schemas.login }), controller.login);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);
router.post('/forgot-password', passwordResetLimiter, validate({ body: schemas.forgotPassword }), controller.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate({ body: schemas.resetPassword }), controller.resetPassword);
router.post('/change-password', authenticate, validate({ body: schemas.changePassword }), controller.changePassword);

module.exports = router;

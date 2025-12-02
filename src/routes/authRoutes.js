const { Router } = require('express');
const { authController } = require('../controllers/authController');
const { validateBody } = require('../middleware/validate');
const { loginSchema } = require('../models/auth');

const router = Router();

router.post('/login', validateBody(loginSchema), authController.login);
router.post('/logout', authController.logout);

module.exports = router;

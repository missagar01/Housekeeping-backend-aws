const { Router } = require('express');
const { workingDayController } = require('../controllers/workingDayController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);
router.get('/', workingDayController.list);

module.exports = router;

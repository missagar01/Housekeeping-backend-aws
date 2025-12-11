const { Router } = require('express');
const { dashboardController } = require('../controllers/dashboardController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);
// router.use(requireAdmin);

router.get('/summary', dashboardController.getSummary);
router.get('/departments', dashboardController.getDepartments);

module.exports = router;

const { Router } = require('express');
const { locationController } = require('../controllers/locationController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, locationController.list);
router.post('/', requireAdmin, locationController.create);

module.exports = router;

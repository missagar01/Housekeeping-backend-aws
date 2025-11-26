const { Router } = require('express');
const { workingDayController } = require('../controllers/workingDayController');

const router = Router();

router.get('/', workingDayController.list);

module.exports = router;

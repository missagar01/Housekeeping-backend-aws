const { Router } = require('express');
const assignTaskRoutes = require('./assignTaskRoutes');
const workingDayRoutes = require('./workingDayRoutes');
const uploadRoutes = require('./uploadRoutes');

const router = Router();

router.use('/assigntask', assignTaskRoutes);
router.use('/uploads', uploadRoutes);
router.use('/working-days', workingDayRoutes);

module.exports = router;

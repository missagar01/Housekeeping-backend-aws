const { Router } = require('express');
const assignTaskRoutes = require('./assignTaskRoutes');
const workingDayRoutes = require('./workingDayRoutes');
const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');

const router = Router();

router.use('/assigntask', assignTaskRoutes);
router.use('/uploads', uploadRoutes);
router.use('/working-days', workingDayRoutes);
router.use('/auth', authRoutes);

module.exports = router;

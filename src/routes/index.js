const { Router } = require('express');
const assignTaskRoutes = require('./assignTaskRoutes');
const workingDayRoutes = require('./workingDayRoutes');
const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const userRoutes = require('./userRoutes');
const locationRoutes = require('./locationRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/assigntask', assignTaskRoutes);
router.use('/uploads', uploadRoutes);
router.use('/working-days', workingDayRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);

module.exports = router;

/**
 * routes/api/index.js
 * Router central que monta todos los sub-routers de la API REST
 */
const express = require('express');
const router  = express.Router();

router.use('/usuarios',      require('./usuarios'));
router.use('/academic',      require('./academic'));
router.use('/students',      require('./students'));
router.use('/enrollment',    require('./enrollment'));
router.use('/billing',       require('./billing'));
router.use('/notifications', require('./notifications'));
router.use('/audit',         require('./audit'));
router.use('/reports',       require('./reports'));

module.exports = router;

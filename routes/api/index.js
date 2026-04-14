/**
 * routes/api/index.js
 * Router central de la API REST
 */
const express      = require('express');
const router       = express.Router();
const { requireAuth } = require('../../middleware/auth');

// Auth — público (login/logout/me no requieren sesión previa)
router.use('/auth', require('./auth'));

// Todos los demás endpoints requieren sesión activa
router.use(requireAuth);

router.use('/usuarios',      require('./usuarios'));
router.use('/academic',      require('./academic'));
router.use('/students',      require('./students'));
router.use('/enrollment',    require('./enrollment'));
router.use('/billing',       require('./billing'));
router.use('/notifications', require('./notifications'));
router.use('/audit',         require('./audit'));
router.use('/reports',       require('./reports'));

module.exports = router;

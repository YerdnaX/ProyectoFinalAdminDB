var express = require('express');
var router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

/* GET panel de reportes — Administrador, Finanzas */
router.get('/', requireAuth, requireRole('Administrador', 'Finanzas'), function (req, res) {
  res.render('reports/reportes', { title: 'Reportes' });
});

module.exports = router;

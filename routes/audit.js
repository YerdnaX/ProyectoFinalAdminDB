var express = require('express');
var router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

/* GET bitácora de auditoría — Administrador */
router.get('/', requireAuth, requireRole('Administrador'), function (req, res) {
  res.render('audit/bitacora', { title: 'Bitácora de Auditoría' });
});

module.exports = router;

var express = require('express');
var router  = express.Router();
const { requireAuth, requirePermiso } = require('../middleware/auth');

/* GET bitácora de auditoría */
router.get('/', requireAuth, requirePermiso('CONSULTAR_AUDITORIA'), function (req, res) {
  res.render('audit/bitacora', { title: 'Bitácora de Auditoría', activePage: 'bitacora' });
});

module.exports = router;

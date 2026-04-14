var express = require('express');
var router  = express.Router();
const { requireAuth } = require('../middleware/auth');

/* GET lista de notificaciones — cualquier usuario autenticado */
router.get('/', requireAuth, function (req, res) {
  res.render('notifications/notificaciones-lista', { title: 'Notificaciones' });
});

module.exports = router;

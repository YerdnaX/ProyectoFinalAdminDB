var express = require('express');
var router = express.Router();

/* GET lista de notificaciones */
router.get('/', function(req, res) {
  res.render('notifications/notificaciones-lista', { title: 'Notificaciones' });
});

module.exports = router;

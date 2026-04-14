var express = require('express');
var router = express.Router();

/* GET bitácora de auditoría */
router.get('/', function(req, res) {
  res.render('audit/bitacora', { title: 'Bitácora de Auditoría' });
});

module.exports = router;

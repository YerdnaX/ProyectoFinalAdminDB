var express = require('express');
var router = express.Router();

/* GET home — mapa de navegación del sistema */
router.get('/', function(req, res) {
  res.render('index', { title: 'Inicio' });
});

module.exports = router;

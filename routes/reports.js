var express = require('express');
var router = express.Router();

/* GET panel de reportes */
router.get('/', function(req, res) {
  res.render('reports/reportes', { title: 'Reportes' });
});

module.exports = router;

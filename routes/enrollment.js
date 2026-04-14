var express = require('express');
var router = express.Router();

/* GET buscar cursos */
router.get('/buscar', function(req, res) {
  res.render('enrollment/buscar-cursos', { title: 'Buscar Cursos' });
});

/* GET resumen de matrícula */
router.get('/mi-matricula', function(req, res) {
  res.render('enrollment/mi-matricula', { title: 'Mi Matrícula' });
});

/* GET comprobante de matrícula */
router.get('/comprobante', function(req, res) {
  res.render('enrollment/comprobante', { title: 'Comprobante de Matrícula' });
});

/* GET lista de matrículas (admin) */
router.get('/lista', function(req, res) {
  res.render('enrollment/matriculas-lista', { title: 'Matrículas' });
});

module.exports = router;

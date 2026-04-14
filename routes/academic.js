var express = require('express');
var router = express.Router();

/* GET programas académicos */
router.get('/programas', function(req, res) {
  res.render('academic/programas-lista', { title: 'Programas Académicos' });
});

/* GET planes de estudio */
router.get('/planes', function(req, res) {
  res.render('academic/planes-lista', { title: 'Planes de Estudio' });
});

/* GET catálogo de cursos */
router.get('/cursos', function(req, res) {
  res.render('academic/cursos-lista', { title: 'Catálogo de Cursos' });
});

/* GET periodos académicos */
router.get('/periodos', function(req, res) {
  res.render('academic/periodos-lista', { title: 'Periodos Académicos' });
});

/* GET secciones */
router.get('/secciones', function(req, res) {
  res.render('academic/secciones-lista', { title: 'Secciones' });
});

/* GET aulas */
router.get('/aulas', function(req, res) {
  res.render('academic/aulas-lista', { title: 'Aulas' });
});

module.exports = router;

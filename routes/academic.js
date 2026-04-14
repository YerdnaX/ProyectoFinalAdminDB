var express = require('express');
var router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Administrador y Docente acceden a módulo académico
const acadAuth = [requireAuth, requireRole('Administrador', 'Docente')];

/* GET programas académicos */
router.get('/programas', acadAuth, function (req, res) {
  res.render('academic/programas-lista', { title: 'Programas Académicos' });
});

/* GET planes de estudio */
router.get('/planes', acadAuth, function (req, res) {
  res.render('academic/planes-lista', { title: 'Planes de Estudio' });
});

/* GET catálogo de cursos */
router.get('/cursos', acadAuth, function (req, res) {
  res.render('academic/cursos-lista', { title: 'Catálogo de Cursos' });
});

/* GET periodos académicos */
router.get('/periodos', acadAuth, function (req, res) {
  res.render('academic/periodos-lista', { title: 'Periodos Académicos' });
});

/* GET secciones */
router.get('/secciones', acadAuth, function (req, res) {
  res.render('academic/secciones-lista', { title: 'Secciones' });
});

/* GET aulas */
router.get('/aulas', acadAuth, function (req, res) {
  res.render('academic/aulas-lista', { title: 'Aulas' });
});

module.exports = router;

var express = require('express');
var router  = express.Router();
const { requireAuth, requirePermiso } = require('../middleware/auth');

router.get('/programas', requireAuth, requirePermiso('GESTION_PROGRAMAS'), function (req, res) {
  res.render('academic/programas-lista', { title: 'Programas Académicos', activePage: 'programas' });
});

router.get('/planes', requireAuth, requirePermiso('GESTION_PLANES'), function (req, res) {
  res.render('academic/planes-lista', { title: 'Planes de Estudio', activePage: 'planes' });
});

router.get('/cursos', requireAuth, requirePermiso('GESTION_CURSOS'), function (req, res) {
  res.render('academic/cursos-lista', { title: 'Catálogo de Cursos', activePage: 'cursos' });
});

router.get('/periodos', requireAuth, requirePermiso('GESTION_PROGRAMAS'), function (req, res) {
  res.render('academic/periodos-lista', { title: 'Periodos Académicos', activePage: 'periodos' });
});

router.get('/secciones', requireAuth, requirePermiso('GESTION_SECCIONES'), function (req, res) {
  res.render('academic/secciones-lista', { title: 'Secciones', activePage: 'secciones' });
});

router.get('/aulas', requireAuth, requirePermiso('GESTION_SECCIONES'), function (req, res) {
  res.render('academic/aulas-lista', { title: 'Aulas', activePage: 'aulas' });
});

module.exports = router;

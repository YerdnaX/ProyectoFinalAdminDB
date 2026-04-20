var express = require('express');
var router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

/* GET buscar cursos - Estudiante */
router.get('/buscar', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('enrollment/buscar-cursos', { title: 'Buscar Cursos', id_estudiante: req.session.user.id_estudiante });
});

/* GET resumen de matricula - Estudiante */
router.get('/mi-matricula', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('enrollment/mi-matricula', { title: 'Mi Matricula', id_estudiante: req.session.user.id_estudiante });
});

/* GET lista de matriculas - Administrador */
router.get('/lista', requireAuth, requireRole('Administrador'), function (req, res) {
  res.render('enrollment/matriculas-lista', { title: 'Matriculas', activePage: 'matriculas' });
});

module.exports = router;

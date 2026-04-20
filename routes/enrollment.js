var express = require('express');
var router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

/* GET buscar cursos — Estudiante */
router.get('/buscar', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('enrollment/buscar-cursos', { title: 'Buscar Cursos', id_estudiante: req.session.user.id_estudiante });
});

/* GET resumen de matrícula — Estudiante */
router.get('/mi-matricula', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('enrollment/mi-matricula', { title: 'Mi Matrícula', id_estudiante: req.session.user.id_estudiante });
});

/* GET comprobante de matrícula — Estudiante */
router.get('/comprobante', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('enrollment/comprobante', { title: 'Comprobante de Matrícula', id_estudiante: req.session.user.id_estudiante });
});

/* GET lista de matrículas — Administrador */
router.get('/lista', requireAuth, requireRole('Administrador'), function (req, res) {
  res.render('enrollment/matriculas-lista', { title: 'Matrículas', activePage: 'matriculas' });
});

module.exports = router;

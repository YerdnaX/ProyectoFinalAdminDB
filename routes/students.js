var express = require('express');
var router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

/* GET portal estudiantil / dashboard — solo Estudiante */
router.get('/', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('students/dashboard-estudiante', { title: 'Portal Estudiantil', id_estudiante: req.session.user.id_estudiante });
});

/* GET lista de estudiantes — Administrador */
router.get('/lista', requireAuth, requireRole('Administrador'), function (req, res) {
  res.render('students/estudiantes-lista', { title: 'Estudiantes', activePage: 'estudiantes' });
});

/* GET historial académico — Estudiante */
router.get('/historial', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('students/historial-academico', { title: 'Historial Académico', id_estudiante: req.session.user.id_estudiante });
});

/* GET mi perfil — Estudiante */
router.get('/mi-perfil', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('students/mi-perfil', { title: 'Mi Perfil', id_estudiante: req.session.user.id_estudiante });
});

/* GET perfil de estudiante por ID — Administrador — debe ir después de las rutas nombradas */
router.get('/:id', requireAuth, requireRole('Administrador'), function (req, res) {
  res.render('students/estudiante-perfil', { title: 'Perfil del Estudiante' });
});

module.exports = router;

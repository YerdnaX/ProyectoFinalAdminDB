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
router.get('/perfil-admin/:id', requireAuth, requireRole('Administrador'), function (req, res) {
  res.render('students/estudiante-perfil-admin', {
    title: 'Perfil Administrativo del Estudiante',
    activePage: 'estudiantes',
    id_estudiante: parseInt(req.params.id, 10) || null
  });
});

router.get('/perfil-admin/:id/estado-cuenta', requireAuth, requireRole('Administrador'), function (req, res) {
  const idEstudiante = parseInt(req.params.id, 10);
  if (!Number.isInteger(idEstudiante)) return res.redirect('/students/lista');
  res.render('students/estudiante-estado-cuenta-admin', {
    title: 'Estado de Cuenta del Estudiante',
    activePage: 'estudiantes',
    id_estudiante: idEstudiante
  });
});

/* Compatibilidad: ruta antigua redirige al nuevo perfil administrativo */
router.get('/:id', requireAuth, requireRole('Administrador'), function (req, res) {
  return res.redirect(`/students/perfil-admin/${req.params.id}`);
});

module.exports = router;

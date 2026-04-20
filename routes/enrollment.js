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

/* GET comprobante de matricula - Estudiante */
router.get('/comprobante', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('enrollment/comprobante', { title: 'Comprobante de Matricula', id_estudiante: req.session.user.id_estudiante });
});

/* GET comprobante de matricula - Administrador (vista separada) */
router.get('/comprobante-admin/:id', requireAuth, requireRole('Administrador'), function (req, res) {
  const idMatricula = parseInt(req.params.id, 10);
  if (!Number.isInteger(idMatricula)) return res.redirect('/enrollment/lista');
  res.render('enrollment/comprobante-admin', {
    title: 'Comprobante de Matricula (Administracion)',
    activePage: 'matriculas',
    id_matricula: idMatricula
  });
});

/* GET lista de matriculas - Administrador */
router.get('/lista', requireAuth, requireRole('Administrador'), function (req, res) {
  res.render('enrollment/matriculas-lista', { title: 'Matriculas', activePage: 'matriculas' });
});

module.exports = router;

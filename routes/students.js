var express = require('express');
var router = express.Router();

/* GET portal estudiantil / dashboard */
router.get('/', function(req, res) {
  res.render('students/dashboard-estudiante', { title: 'Portal Estudiantil' });
});

/* GET lista de estudiantes (admin) */
router.get('/lista', function(req, res) {
  res.render('students/estudiantes-lista', { title: 'Estudiantes' });
});

/* GET historial académico */
router.get('/historial', function(req, res) {
  res.render('students/historial-academico', { title: 'Historial Académico' });
});

/* GET mi perfil (estudiante autenticado) */
router.get('/mi-perfil', function(req, res) {
  res.render('students/mi-perfil', { title: 'Mi Perfil' });
});

/* GET perfil de estudiante por ID — debe ir después de las rutas nombradas */
router.get('/:id', function(req, res) {
  res.render('students/estudiante-perfil', { title: 'Perfil del Estudiante' });
});

module.exports = router;

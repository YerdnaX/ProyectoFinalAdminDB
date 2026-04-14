var express = require('express');
var router = express.Router();

/* GET dashboard administrativo */
router.get('/', function(req, res) {
  res.render('admin/dashboard-admin', { title: 'Dashboard Administrativo' });
});

/* GET lista de usuarios */
router.get('/usuarios', function(req, res) {
  res.render('admin/usuarios-lista', { title: 'Usuarios' });
});

/* GET formulario crear usuario */
router.get('/usuarios/nuevo', function(req, res) {
  res.render('admin/usuario-crear', { title: 'Crear Usuario' });
});

/* POST crear usuario */
router.post('/usuarios/nuevo', function(req, res) {
  res.redirect('/admin/usuarios');
});

/* GET detalle de usuario */
router.get('/usuarios/:id', function(req, res) {
  res.render('admin/usuario-detalle', { title: 'Detalle de Usuario' });
});

/* GET roles y permisos */
router.get('/roles-permisos', function(req, res) {
  res.render('admin/roles-permisos', { title: 'Roles y Permisos' });
});

module.exports = router;

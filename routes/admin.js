var express = require('express');
var router  = express.Router();
const { requireAuth, requireRole, requirePermiso } = require('../middleware/auth');

const soloAdmin = [requireAuth, requireRole('Administrador')];

router.get('/', soloAdmin, function (req, res) {
  res.render('admin/dashboard-admin', { title: 'Dashboard Administrativo', activePage: 'dashboard' });
});

router.get('/usuarios', soloAdmin, function (req, res) {
  res.render('admin/usuarios-lista', { title: 'Usuarios', activePage: 'usuarios' });
});

router.get('/usuarios/nuevo', soloAdmin, function (req, res) {
  res.render('admin/usuario-crear', { title: 'Crear Usuario', activePage: 'usuarios' });
});

router.post('/usuarios/nuevo', soloAdmin, function (req, res) {
  res.redirect('/admin/usuarios');
});

router.get('/usuarios/:id', soloAdmin, function (req, res) {
  res.render('admin/usuario-detalle', { title: 'Detalle de Usuario', activePage: 'usuarios' });
});

router.get('/roles-permisos', requireAuth, requirePermiso('GESTION_ROLES'), function (req, res) {
  res.render('admin/roles-permisos', { title: 'Roles y Permisos', activePage: 'roles' });
});

module.exports = router;

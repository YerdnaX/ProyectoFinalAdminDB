/**
 * routes/auth.js
 * Rutas de vistas de autenticación
 */
var express = require('express');
var router  = express.Router();

/* GET /auth/login — si ya hay sesión activa, redirige al destino del rol */
router.get('/login', function (req, res) {
  if (req.session && req.session.user) {
    const destinos = {
      'Administrador': '/admin',
      'Finanzas'     : '/billing/facturas',
      'Docente'      : '/academic/cursos',
      'Estudiante'   : '/students'
    };
    return res.redirect(destinos[req.session.user.rol] || '/admin');
  }
  res.render('auth/login', { title: 'Iniciar Sesión', layout: 'layout' });
});

/* GET /auth/logout — destruye sesión y redirige al login */
router.get('/logout', function (req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

/* GET /auth/recuperar-acceso */
router.get('/recuperar-acceso', function (req, res) {
  res.render('auth/recuperar-acceso', { title: 'Recuperar Acceso' });
});

module.exports = router;

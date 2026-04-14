var express = require('express');
var router = express.Router();

/* GET login */
router.get('/login', function(req, res) {
  res.render('auth/login', { title: 'Iniciar Sesión' });
});

/* GET recuperar acceso */
router.get('/recuperar-acceso', function(req, res) {
  res.render('auth/recuperar-acceso', { title: 'Recuperar Acceso' });
});

/* POST login (redirige al admin por ahora) */
router.post('/login', function(req, res) {
  res.redirect('/admin');
});

module.exports = router;

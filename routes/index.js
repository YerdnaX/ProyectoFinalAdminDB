var express = require('express');
var router  = express.Router();

/* GET / — redirige según sesión activa */
router.get('/', function (req, res) {
  if (req.session && req.session.user) {
    const destinos = {
      'Administrador': '/admin',
      'Finanzas'     : '/billing/facturas',
      'Docente'      : '/academic/cursos',
      'Estudiante'   : '/students'
    };
    return res.redirect(destinos[req.session.user.rol] || '/admin');
  }
  return res.redirect('/auth/login');
});

module.exports = router;

var express = require('express');
var router  = express.Router();
const { requireAuth } = require('../middleware/auth');

/* GET lista de notificaciones — cualquier usuario autenticado */
router.get('/', requireAuth, function (req, res) {
  const u = req.session.user;
  res.render('notifications/notificaciones-lista', {
    title        : 'Notificaciones',
    rol          : u.rol,
    esEstudiante : u.rol === 'Estudiante',
    esAdmin      : u.rol === 'Administrador',
    esFinanzas   : u.rol === 'Finanzas',
    esDocente    : u.rol === 'Docente',
    idEstudiante : u.id_estudiante || ''
  });
});

module.exports = router;

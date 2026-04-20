var express = require('express');
var router  = express.Router();
const { requireAuth, requireRole, requirePermiso } = require('../middleware/auth');

router.get('/estado-cuenta', requireAuth, requireRole('Estudiante', 'Finanzas', 'Administrador'), function (req, res) {
  res.render('billing/estado-cuenta', { title: 'Estado de Cuenta', id_estudiante: req.session.user.id_estudiante });
});

router.get('/mis-facturas', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('billing/mis-facturas', { title: 'Mis Facturas', id_estudiante: req.session.user.id_estudiante });
});

router.get('/pagar', requireAuth, requireRole('Estudiante', 'Finanzas'), function (req, res) {
  res.render('billing/realizar-pago', { title: 'Realizar Pago', id_estudiante: req.session.user.id_estudiante });
});

router.post('/pagar', requireAuth, requireRole('Estudiante', 'Finanzas'), function (req, res) {
  res.redirect('/billing/mis-facturas');
});

router.get('/facturas', requireAuth, requirePermiso('GENERAR_FACTURAS'), function (req, res) {
  res.render('billing/facturas-lista', { title: 'Facturas', activePage: 'facturas' });
});

router.get('/pagos', requireAuth, requirePermiso('REGISTRAR_PAGOS'), function (req, res) {
  res.render('billing/pagos-lista', { title: 'Pagos', activePage: 'pagos' });
});

module.exports = router;

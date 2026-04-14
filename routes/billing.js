var express = require('express');
var router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

/* GET estado de cuenta — Estudiante, Finanzas, Administrador */
router.get('/estado-cuenta', requireAuth, requireRole('Estudiante', 'Finanzas', 'Administrador'), function (req, res) {
  res.render('billing/estado-cuenta', { title: 'Estado de Cuenta' });
});

/* GET mis facturas — Estudiante */
router.get('/mis-facturas', requireAuth, requireRole('Estudiante'), function (req, res) {
  res.render('billing/mis-facturas', { title: 'Mis Facturas' });
});

/* GET formulario realizar pago — Estudiante */
router.get('/pagar', requireAuth, requireRole('Estudiante', 'Finanzas'), function (req, res) {
  res.render('billing/realizar-pago', { title: 'Realizar Pago' });
});

/* POST procesar pago */
router.post('/pagar', requireAuth, requireRole('Estudiante', 'Finanzas'), function (req, res) {
  res.redirect('/billing/mis-facturas');
});

/* GET lista de facturas — Finanzas, Administrador */
router.get('/facturas', requireAuth, requireRole('Finanzas', 'Administrador'), function (req, res) {
  res.render('billing/facturas-lista', { title: 'Facturas' });
});

/* GET lista de pagos — Finanzas, Administrador */
router.get('/pagos', requireAuth, requireRole('Finanzas', 'Administrador'), function (req, res) {
  res.render('billing/pagos-lista', { title: 'Pagos' });
});

module.exports = router;

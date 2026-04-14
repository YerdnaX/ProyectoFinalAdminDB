var express = require('express');
var router = express.Router();

/* GET estado de cuenta */
router.get('/estado-cuenta', function(req, res) {
  res.render('billing/estado-cuenta', { title: 'Estado de Cuenta' });
});

/* GET mis facturas (estudiante) */
router.get('/mis-facturas', function(req, res) {
  res.render('billing/mis-facturas', { title: 'Mis Facturas' });
});

/* GET formulario realizar pago */
router.get('/pagar', function(req, res) {
  res.render('billing/realizar-pago', { title: 'Realizar Pago' });
});

/* POST procesar pago */
router.post('/pagar', function(req, res) {
  res.redirect('/billing/mis-facturas');
});

/* GET lista de facturas (admin) */
router.get('/facturas', function(req, res) {
  res.render('billing/facturas-lista', { title: 'Facturas' });
});

/* GET lista de pagos (admin) */
router.get('/pagos', function(req, res) {
  res.render('billing/pagos-lista', { title: 'Pagos' });
});

module.exports = router;

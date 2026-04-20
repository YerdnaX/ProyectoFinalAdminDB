/**
 * routes/api/billing.js
 * APIs para facturación, pagos y estado de cuenta
 */
const express = require('express');
const router  = express.Router();
const { sql, query, queryOne, getPool } = require('../../config/db');

/* ── FACTURAS ─────────────────────────────── */

/* GET /api/billing/facturas — lista admin */
router.get('/facturas', async (req, res) => {
  try {
    const { page = 1, limit = 10, estado = '', buscar = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = {};
    if (estado) { where += ' AND f.estado=@est'; params.est = estado; }
    if (buscar) {
      where += ' AND (u.nombre LIKE @b OR u.apellido LIKE @b OR f.numero_factura LIKE @b OR e.carne LIKE @b)';
      params.b = `%${buscar}%`;
    }

    const rows = await query(`
      SELECT f.id_factura, f.numero_factura, f.estado,
             CONVERT(varchar,f.fecha_emision,103) AS fecha_emision,
             f.subtotal, f.descuentos, f.recargos, f.total, f.saldo,
             e.carne, u.nombre + ' ' + u.apellido AS estudiante,
             p.nombre AS periodo
      FROM factura f
      INNER JOIN estudiante e ON e.id_estudiante = f.id_estudiante
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      INNER JOIN periodo_academico p ON p.id_periodo = f.id_periodo
      ${where}
      ORDER BY f.fecha_emision DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `, params);

    const total = await queryOne(`
      SELECT COUNT(*) AS total FROM factura f
      INNER JOIN estudiante e ON e.id_estudiante=f.id_estudiante
      INNER JOIN usuario u ON u.id_usuario=e.id_usuario
      ${where}
    `, params);

    res.json({ ok: true, data: rows, total: total.total });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/billing/facturas/estudiante/:id — facturas de un estudiante */
router.get('/facturas/estudiante/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await query(`
      SELECT f.id_factura, f.numero_factura, f.estado,
             CONVERT(varchar,f.fecha_emision,103) AS fecha_emision,
             f.subtotal, f.descuentos, f.recargos, f.total, f.saldo,
             p.nombre AS periodo,
             ISNULL(SUM(pg.monto),0) AS pagado
      FROM factura f
      INNER JOIN periodo_academico p ON p.id_periodo = f.id_periodo
      LEFT JOIN pago pg ON pg.id_factura = f.id_factura AND pg.estado='Aprobado'
      WHERE f.id_estudiante = @id
      GROUP BY f.id_factura,f.numero_factura,f.estado,f.fecha_emision,
               f.subtotal,f.descuentos,f.recargos,f.total,f.saldo,p.nombre
      ORDER BY f.fecha_emision DESC
    `, { id: { type: sql.Int, value: id } });
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/billing/facturas/:id — detalle de una factura */
router.get('/facturas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const factura = await queryOne(`
      SELECT f.id_factura, f.numero_factura, f.estado,
             CONVERT(varchar,f.fecha_emision,103) AS fecha_emision,
             f.subtotal, f.descuentos, f.recargos, f.total, f.saldo,
             p.nombre AS periodo
      FROM factura f
      INNER JOIN periodo_academico p ON p.id_periodo = f.id_periodo
      WHERE f.id_factura = @id
    `, { id: { type: sql.Int, value: id } });
    if (!factura) return res.status(404).json({ ok: false, error: 'Factura no encontrada' });

    const lineas = await query(`
      SELECT descripcion, monto FROM detalle_factura WHERE id_factura = @id
    `, { id: { type: sql.Int, value: id } }).catch(() => []);

    res.json({ ok: true, data: { ...factura, lineas } });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/billing/estado-cuenta/:id — estado de cuenta de un estudiante */
router.get('/estado-cuenta/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const perfil = await queryOne(`
      SELECT e.carne, e.saldo_pendiente, e.bloqueado_financiero,
             u.nombre + ' ' + u.apellido AS nombre
      FROM estudiante e INNER JOIN usuario u ON u.id_usuario=e.id_usuario
      WHERE e.id_estudiante=@id
    `, { id: { type: sql.Int, value: id } });

    const estados = await query(`
      SELECT ec.id_estado_cuenta, ec.monto_total, ec.monto_pagado, ec.saldo_pendiente, ec.estado,
             CONVERT(varchar,ec.fecha_generacion,103) AS fecha_generacion,
             p.nombre AS periodo, p.codigo AS periodo_codigo
      FROM estado_cuenta ec
      INNER JOIN periodo_academico p ON p.id_periodo = ec.id_periodo
      WHERE ec.id_estudiante = @id
      ORDER BY ec.fecha_generacion DESC
    `, { id: { type: sql.Int, value: id } });

    res.json({ ok: true, perfil, estados });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ── PAGOS ─────────────────────────────── */

/* GET /api/billing/pagos — lista admin */
router.get('/pagos', async (req, res) => {
  try {
    const { page = 1, limit = 10, metodo = '', estado = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = {};
    if (metodo) { where += ' AND pg.metodo_pago=@met'; params.met = metodo; }
    if (estado) { where += ' AND pg.estado=@est'; params.est = estado; }

    const rows = await query(`
      SELECT pg.id_pago, pg.monto, pg.metodo_pago, pg.referencia_pasarela,
             pg.estado, pg.observacion,
             CONVERT(varchar,pg.fecha_pago,103) AS fecha_pago,
             f.numero_factura, e.carne,
             u.nombre + ' ' + u.apellido AS estudiante
      FROM pago pg
      INNER JOIN factura f ON f.id_factura = pg.id_factura
      INNER JOIN estudiante e ON e.id_estudiante = f.id_estudiante
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      ${where}
      ORDER BY pg.fecha_pago DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `, params);

    const total = await queryOne(`SELECT COUNT(*) AS total FROM pago pg ${where}`, params);
    const suma  = await queryOne(`SELECT ISNULL(SUM(monto),0) AS total_recaudado FROM pago WHERE estado='Aprobado'`);

    res.json({ ok: true, data: rows, total: total.total, total_recaudado: suma.total_recaudado });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* POST /api/billing/pagar — registrar pago de una factura */
router.post('/pagar', async (req, res) => {
  try {
    const { id_factura, monto, metodo_pago, numero_tarjeta, nombre_tarjeta } = req.body;
    if (!id_factura || !monto || !metodo_pago)
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });

    const factura = await queryOne(
      `SELECT id_factura, saldo, estado, id_estudiante FROM factura WHERE id_factura=@id`,
      { id: { type: sql.Int, value: parseInt(id_factura) } }
    );
    if (!factura) return res.status(404).json({ ok: false, error: 'Factura no encontrada' });
    if (factura.estado === 'Pagada') return res.status(400).json({ ok: false, error: 'Factura ya pagada' });

    const montoNum = parseFloat(monto);
    if (montoNum <= 0) return res.status(400).json({ ok: false, error: 'Monto invalido' });
    if (montoNum > factura.saldo) return res.status(400).json({ ok: false, error: `Monto excede el saldo (${factura.saldo})` });

    const ref = `PAY-${Date.now()}`;

    const db = await getPool();
    const t  = new sql.Transaction(db);
    await t.begin();

    try {
      // Registrar pago
      const rPago = new sql.Request(t);
      rPago.input('fac',   sql.Int,          parseInt(id_factura));
      rPago.input('mon',   sql.Decimal(10,2), montoNum);
      rPago.input('met',   sql.VarChar,       metodo_pago);
      rPago.input('ref',   sql.VarChar,       ref);
      const rPagoRes = await rPago.query(
        `INSERT INTO pago(id_factura,monto,metodo_pago,referencia_pasarela,estado,observacion)
         OUTPUT INSERTED.id_pago
         VALUES(@fac,@mon,@met,@ref,'Aprobado','Pago registrado desde portal')`
      );
      const idPago = rPagoRes.recordset[0].id_pago;

      // Actualizar saldo de factura
      const nuevoSaldo  = parseFloat((factura.saldo - montoNum).toFixed(2));
      const nuevoEstado = nuevoSaldo <= 0 ? 'Pagada' : 'Parcial';

      const rFac = new sql.Request(t);
      rFac.input('sal', sql.Decimal(10,2), nuevoSaldo);
      rFac.input('est', sql.VarChar, nuevoEstado);
      rFac.input('fid', sql.Int, parseInt(id_factura));
      await rFac.query(`UPDATE factura SET saldo=@sal, estado=@est WHERE id_factura=@fid`);

      // Actualizar saldo del estudiante
      const rEst = new sql.Request(t);
      rEst.input('eid', sql.Int, factura.id_estudiante);
      await rEst.query(`
        UPDATE estudiante
        SET saldo_pendiente = (SELECT ISNULL(SUM(saldo),0) FROM factura WHERE id_estudiante=@eid AND estado<>'Anulada'),
            bloqueado_financiero = CASE WHEN (SELECT ISNULL(SUM(saldo),0) FROM factura WHERE id_estudiante=@eid AND estado<>'Anulada') <= 0 THEN 0 ELSE bloqueado_financiero END
        WHERE id_estudiante=@eid
      `);

      await t.commit();

      // RF-03: Bitácora
      query(`INSERT INTO bitacora_auditoria(id_usuario,entidad,accion,descripcion)
             VALUES(@u,'pago','INSERT',@det)`,
        { u:   { type: sql.Int,     value: req.session?.usuario?.id_usuario || 0 },
          det: { type: sql.VarChar, value: `Pago ${ref} de ${montoNum} registrado para factura ${id_factura} (${nuevoEstado})` }
        }).catch(() => {});

      // RF-24: Notificación automática al registrar pago
      query(`INSERT INTO notificacion(id_estudiante,tipo,asunto,mensaje,medio)
             VALUES(@est,'Pago','Pago recibido',@msg,'Portal')`,
        { est: { type: sql.Int,     value: factura.id_estudiante },
          msg: { type: sql.VarChar, value: `Se registró un pago de ${montoNum} para tu factura. Referencia: ${ref}.` }
        }).catch(() => {});

      res.json({ ok: true, id_pago: idPago, referencia: ref, nuevo_estado: nuevoEstado, mensaje: 'Pago registrado exitosamente' });
    } catch (err2) {
      await t.rollback();
      throw err2;
    }
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;

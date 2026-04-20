/**
 * routes/api/billing.js
 * APIs para facturacion, pagos y estado de cuenta
 */
const express = require('express');
const router = express.Router();
const { sql, query, queryOne, getPool } = require('../../config/db');

const METODOS_PAGO_VALIDOS = new Set(['Tarjeta', 'Transferencia', 'SINPE', 'Efectivo']);

function getSessionUser(req) {
  return req.session?.user || null;
}

function isAdminOrFinanzas(req) {
  const rol = getSessionUser(req)?.rol;
  return rol === 'Administrador' || rol === 'Finanzas';
}

function isOwnerStudent(req, idEstudiante) {
  const u = getSessionUser(req);
  return u?.rol === 'Estudiante' && Number(u.id_estudiante) === Number(idEstudiante);
}

function deny(res, message = 'Sin permisos suficientes') {
  return res.status(403).json({ ok: false, error: message });
}

async function canAccessFactura(req, idFactura) {
  if (isAdminOrFinanzas(req)) return true;
  const u = getSessionUser(req);
  if (!u || u.rol !== 'Estudiante' || !u.id_estudiante) return false;
  const fac = await queryOne(
    `SELECT id_estudiante FROM factura WHERE id_factura = @id`,
    { id: { type: sql.Int, value: idFactura } }
  );
  return !!fac && Number(fac.id_estudiante) === Number(u.id_estudiante);
}

/* GET /api/billing/facturas - lista admin */
router.get('/facturas', async (req, res) => {
  try {
    if (!isAdminOrFinanzas(req)) return deny(res);

    const { page = 1, limit = 10, estado = '', buscar = '' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    let where = 'WHERE 1=1';
    const params = {};

    if (estado) {
      where += ' AND f.estado = @est';
      params.est = estado;
    }

    if (buscar) {
      where += " AND (f.numero_factura LIKE @b OR e.carne LIKE @b OR (u.nombre + ' ' + u.apellido) LIKE @b OR p.nombre LIKE @b)";
      params.b = `%${buscar}%`;
    }

    const rows = await query(
      `SELECT f.id_factura, f.numero_factura, f.estado,
              CONVERT(varchar,f.fecha_emision,23) AS fecha_emision,
              f.subtotal, f.descuentos, f.recargos, f.total, f.saldo,
              e.id_estudiante, e.carne,
              LTRIM(RTRIM(ISNULL(u.nombre,'') + ' ' + ISNULL(u.apellido,''))) AS estudiante,
              p.nombre AS periodo
       FROM factura f
       INNER JOIN estudiante e ON e.id_estudiante = f.id_estudiante
       INNER JOIN usuario u ON u.id_usuario = e.id_usuario
       INNER JOIN periodo_academico p ON p.id_periodo = f.id_periodo
       ${where}
       ORDER BY f.fecha_emision DESC, f.id_factura DESC
       OFFSET ${offset} ROWS FETCH NEXT ${limitNum} ROWS ONLY`,
      params
    );

    const totalRow = await queryOne(
      `SELECT COUNT(*) AS total
       FROM factura f
       INNER JOIN estudiante e ON e.id_estudiante = f.id_estudiante
       INNER JOIN usuario u ON u.id_usuario = e.id_usuario
       INNER JOIN periodo_academico p ON p.id_periodo = f.id_periodo
       ${where}`,
      params
    );

    return res.json({ ok: true, data: rows, total: totalRow?.total || 0, page: pageNum, limit: limitNum });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/billing/facturas/estudiante/:id - facturas de un estudiante */
router.get('/facturas/estudiante/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID de estudiante invalido' });
    if (!isAdminOrFinanzas(req) && !isOwnerStudent(req, id)) return deny(res);

    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 50, 1);
    const offset = (pageNum - 1) * limitNum;

    const rows = await query(
      `SELECT f.id_factura, f.numero_factura, f.estado,
              CONVERT(varchar,f.fecha_emision,23) AS fecha_emision,
              f.subtotal, f.descuentos, f.recargos, f.total, f.saldo,
              p.nombre AS periodo,
              ISNULL(SUM(CASE WHEN pg.estado='Aprobado' THEN pg.monto ELSE 0 END), 0) AS pagado
       FROM factura f
       INNER JOIN periodo_academico p ON p.id_periodo = f.id_periodo
       LEFT JOIN pago pg ON pg.id_factura = f.id_factura
       WHERE f.id_estudiante = @id
       GROUP BY f.id_factura, f.numero_factura, f.estado, f.fecha_emision,
                f.subtotal, f.descuentos, f.recargos, f.total, f.saldo, p.nombre
       ORDER BY f.fecha_emision DESC, f.id_factura DESC
       OFFSET ${offset} ROWS FETCH NEXT ${limitNum} ROWS ONLY`,
      { id: { type: sql.Int, value: id } }
    );

    const totalRow = await queryOne(
      `SELECT COUNT(*) AS total FROM factura WHERE id_estudiante = @id`,
      { id: { type: sql.Int, value: id } }
    );

    return res.json({ ok: true, data: rows, total: totalRow?.total || 0, page: pageNum, limit: limitNum });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/billing/facturas/:id - detalle de factura */
router.get('/facturas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID de factura invalido' });

    if (!(await canAccessFactura(req, id))) return deny(res);

    const factura = await queryOne(
      `SELECT f.id_factura, f.id_estudiante, f.numero_factura, f.estado,
              CONVERT(varchar,f.fecha_emision,23) AS fecha_emision,
              f.subtotal, f.descuentos, f.recargos, f.total, f.saldo,
              p.nombre AS periodo,
              e.carne,
              LTRIM(RTRIM(ISNULL(u.nombre,'') + ' ' + ISNULL(u.apellido,''))) AS estudiante
       FROM factura f
       INNER JOIN periodo_academico p ON p.id_periodo = f.id_periodo
       INNER JOIN estudiante e ON e.id_estudiante = f.id_estudiante
       INNER JOIN usuario u ON u.id_usuario = e.id_usuario
       WHERE f.id_factura = @id`,
      { id: { type: sql.Int, value: id } }
    );

    if (!factura) return res.status(404).json({ ok: false, error: 'Factura no encontrada' });

    const lineas = await query(
      `SELECT c.nombre AS descripcion, dm.costo AS monto
       FROM matricula m
       INNER JOIN detalle_matricula dm ON dm.id_matricula = m.id_matricula
       INNER JOIN seccion s ON s.id_seccion = dm.id_seccion
       INNER JOIN curso c ON c.id_curso = s.id_curso
       WHERE m.id_estudiante = @est
         AND m.id_periodo = (SELECT id_periodo FROM factura WHERE id_factura = @id)
         AND dm.estado != 'Anulada'
       ORDER BY c.nombre`,
      {
        est: { type: sql.Int, value: factura.id_estudiante },
        id:  { type: sql.Int, value: id }
      }
    ).catch(() => []);

    return res.json({ ok: true, data: { ...factura, lineas } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/billing/estado-cuenta/:id - estado de cuenta */
router.get('/estado-cuenta/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID de estudiante invalido' });
    if (!isAdminOrFinanzas(req) && !isOwnerStudent(req, id)) return deny(res);

    const perfil = await queryOne(
      `SELECT e.id_estudiante, e.carne, e.saldo_pendiente, e.bloqueado_financiero,
              LTRIM(RTRIM(ISNULL(u.nombre,'') + ' ' + ISNULL(u.apellido,''))) AS nombre
       FROM estudiante e
       INNER JOIN usuario u ON u.id_usuario = e.id_usuario
       WHERE e.id_estudiante = @id`,
      { id: { type: sql.Int, value: id } }
    );

    // Construir movimientos en tiempo real desde factura para reflejar pagos inmediatamente.
    const estados = await query(
      `SELECT
          ROW_NUMBER() OVER (ORDER BY MAX(f.fecha_emision) DESC, p.nombre DESC) AS id_estado_cuenta,
          CAST(ISNULL(SUM(f.total),0) AS decimal(10,2)) AS monto_total,
          CAST(ISNULL(SUM(f.total - f.saldo),0) AS decimal(10,2)) AS monto_pagado,
          CAST(ISNULL(SUM(f.saldo),0) AS decimal(10,2)) AS saldo_pendiente,
          CASE
            WHEN ISNULL(SUM(f.saldo),0) <= 0 THEN 'Al dia'
            WHEN ISNULL(SUM(f.total - f.saldo),0) > 0 THEN 'Parcial'
            ELSE 'Pendiente'
          END AS estado,
          CONVERT(varchar, MAX(f.fecha_emision), 23) AS fecha_generacion,
          p.nombre AS periodo, p.codigo AS periodo_codigo
       FROM factura f
       INNER JOIN periodo_academico p ON p.id_periodo = f.id_periodo
       WHERE f.id_estudiante = @id
         AND f.estado <> 'Anulada'
       GROUP BY p.id_periodo, p.nombre, p.codigo
       ORDER BY MAX(f.fecha_emision) DESC, p.nombre DESC`,
      { id: { type: sql.Int, value: id } }
    );

    return res.json({ ok: true, perfil, estados });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/billing/pagos - lista admin */
router.get('/pagos', async (req, res) => {
  try {
    if (!isAdminOrFinanzas(req)) return deny(res);

    const { page = 1, limit = 10, metodo = '', estado = '', buscar = '' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    let where = 'WHERE 1=1';
    const params = {};

    if (metodo) {
      where += ' AND pg.metodo_pago = @met';
      params.met = metodo;
    }

    if (estado) {
      where += ' AND pg.estado = @est';
      params.est = estado;
    }

    if (buscar) {
      where += " AND (pg.referencia_pasarela LIKE @b OR f.numero_factura LIKE @b OR e.carne LIKE @b OR (u.nombre + ' ' + u.apellido) LIKE @b)";
      params.b = `%${buscar}%`;
    }

    const rows = await query(
      `SELECT pg.id_pago, pg.monto, pg.metodo_pago, pg.referencia_pasarela, pg.estado, pg.observacion,
              CONVERT(varchar,pg.fecha_pago,23) AS fecha_pago,
              pg.id_factura, f.numero_factura, e.carne,
              LTRIM(RTRIM(ISNULL(u.nombre,'') + ' ' + ISNULL(u.apellido,''))) AS estudiante
       FROM pago pg
       INNER JOIN factura f ON f.id_factura = pg.id_factura
       INNER JOIN estudiante e ON e.id_estudiante = f.id_estudiante
       INNER JOIN usuario u ON u.id_usuario = e.id_usuario
       ${where}
       ORDER BY pg.fecha_pago DESC, pg.id_pago DESC
       OFFSET ${offset} ROWS FETCH NEXT ${limitNum} ROWS ONLY`,
      params
    );

    const totalRow = await queryOne(
      `SELECT COUNT(*) AS total
       FROM pago pg
       INNER JOIN factura f ON f.id_factura = pg.id_factura
       INNER JOIN estudiante e ON e.id_estudiante = f.id_estudiante
       INNER JOIN usuario u ON u.id_usuario = e.id_usuario
       ${where}`,
      params
    );

    const suma = await queryOne(
      `SELECT ISNULL(SUM(monto),0) AS total_recaudado
       FROM pago
       WHERE estado = 'Aprobado'`
    );

    return res.json({
      ok: true,
      data: rows,
      total: totalRow?.total || 0,
      page: pageNum,
      limit: limitNum,
      total_recaudado: suma?.total_recaudado || 0
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* POST /api/billing/pagar - registrar pago de una factura */
router.post('/pagar', async (req, res) => {
  try {
    const { id_factura, monto, metodo_pago, referencia_pasarela, observacion } = req.body;

    const idFacturaNum = parseInt(id_factura, 10);
    const montoNum = parseFloat(monto);
    const metodo = String(metodo_pago || '').trim();

    if (!Number.isInteger(idFacturaNum) || !Number.isFinite(montoNum) || !metodo) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios o son invalidos' });
    }

    if (montoNum <= 0) return res.status(400).json({ ok: false, error: 'Monto invalido' });
    if (!METODOS_PAGO_VALIDOS.has(metodo)) {
      return res.status(400).json({ ok: false, error: 'Metodo de pago invalido' });
    }

    const factura = await queryOne(
      `SELECT id_factura, saldo, estado, id_estudiante
       FROM factura
       WHERE id_factura = @id`,
      { id: { type: sql.Int, value: idFacturaNum } }
    );

    if (!factura) return res.status(404).json({ ok: false, error: 'Factura no encontrada' });

    if (!isAdminOrFinanzas(req) && !isOwnerStudent(req, factura.id_estudiante)) {
      return deny(res, 'No puedes pagar una factura que no te pertenece');
    }

    if (factura.estado === 'Pagada') return res.status(400).json({ ok: false, error: 'Factura ya pagada' });
    if (factura.estado === 'Anulada') return res.status(400).json({ ok: false, error: 'No se puede pagar una factura anulada' });
    if (montoNum > Number(factura.saldo)) {
      return res.status(400).json({ ok: false, error: `Monto excede el saldo (${factura.saldo})` });
    }

    const ref = String(referencia_pasarela || '').trim() || `PAY-${Date.now()}`;
    const obs = String(observacion || '').trim() || 'Pago registrado desde portal';

    const db = await getPool();
    const t = new sql.Transaction(db);
    await t.begin();

    try {
      const rPago = new sql.Request(t);
      rPago.input('fac', sql.Int, idFacturaNum);
      rPago.input('mon', sql.Decimal(10, 2), montoNum);
      rPago.input('met', sql.VarChar, metodo);
      rPago.input('ref', sql.VarChar, ref);
      rPago.input('obs', sql.VarChar, obs);

      const pagoRes = await rPago.query(
        `INSERT INTO pago(id_factura,monto,metodo_pago,referencia_pasarela,estado,observacion)
         OUTPUT INSERTED.id_pago
         VALUES(@fac,@mon,@met,@ref,'Aprobado',@obs)`
      );
      const idPago = pagoRes.recordset[0].id_pago;

      const nuevoSaldo = parseFloat((Number(factura.saldo) - montoNum).toFixed(2));
      const nuevoEstado = nuevoSaldo <= 0 ? 'Pagada' : 'Parcial';

      const rFac = new sql.Request(t);
      rFac.input('sal', sql.Decimal(10, 2), nuevoSaldo);
      rFac.input('est', sql.VarChar, nuevoEstado);
      rFac.input('fid', sql.Int, idFacturaNum);
      await rFac.query(`UPDATE factura SET saldo = @sal, estado = @est WHERE id_factura = @fid`);

      const rEst = new sql.Request(t);
      rEst.input('eid', sql.Int, factura.id_estudiante);
      await rEst.query(
        `UPDATE estudiante
         SET saldo_pendiente = (
               SELECT ISNULL(SUM(saldo),0)
               FROM factura
               WHERE id_estudiante = @eid
                 AND estado <> 'Anulada'
             ),
             bloqueado_financiero = CASE
               WHEN (
                 SELECT ISNULL(SUM(saldo),0)
                 FROM factura
                 WHERE id_estudiante = @eid
                   AND estado <> 'Anulada'
               ) <= 0 THEN 0
               ELSE bloqueado_financiero
             END
         WHERE id_estudiante = @eid`
      );

      await t.commit();

      const idUsuarioSesion = getSessionUser(req)?.id_usuario || 0;

      query(
        `INSERT INTO bitacora_auditoria(id_usuario,entidad,accion,descripcion)
         VALUES(@u,'pago','INSERT',@det)`,
        {
          u: { type: sql.Int, value: idUsuarioSesion },
          det: {
            type: sql.VarChar,
            value: `Pago ${ref} de ${montoNum} registrado para factura ${idFacturaNum} (${nuevoEstado})`
          }
        }
      ).catch(() => {});

      query(
        `INSERT INTO notificacion(id_estudiante,tipo,asunto,mensaje,medio)
         VALUES(@est,'Pago','Pago recibido',@msg,'Portal')`,
        {
          est: { type: sql.Int, value: factura.id_estudiante },
          msg: {
            type: sql.VarChar,
            value: `Se registro un pago de ${montoNum} para tu factura. Referencia: ${ref}.`
          }
        }
      ).catch(() => {});

      return res.json({ ok: true, id_pago: idPago, referencia: ref, nuevo_estado: nuevoEstado, mensaje: 'Pago registrado exitosamente' });
    } catch (innerErr) {
      await t.rollback();
      throw innerErr;
    }
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;

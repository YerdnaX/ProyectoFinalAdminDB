/**
 * routes/api/reports.js
 * Endpoints de reportes y dashboard administrativo
 */
const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');

/* GET /api/reports/dashboard — metricas para dashboard admin */
router.get('/dashboard', async (req, res) => {
  try {
    const estudiantesActivos   = await queryOne(`SELECT COUNT(*) AS n FROM estudiante WHERE estado_academico='Activo'`);
    const estudiantesBlockFin  = await queryOne(`SELECT COUNT(*) AS n FROM estudiante WHERE bloqueado_financiero=1`);
    const estudiantesBlockAcad = await queryOne(`SELECT COUNT(*) AS n FROM estudiante WHERE bloqueado_academico=1`);

    const matriculasConfirmadas = await queryOne(`
      SELECT COUNT(*) AS n FROM matricula m
      INNER JOIN periodo_academico p ON p.id_periodo=m.id_periodo AND p.activo=1
      WHERE m.confirmada=1
    `);
    const matriculasPendientes = await queryOne(`
      SELECT COUNT(*) AS n FROM matricula m
      INNER JOIN periodo_academico p ON p.id_periodo=m.id_periodo AND p.activo=1
      WHERE m.confirmada=0
    `);

    const seccionesActivas = await queryOne(`
      SELECT COUNT(*) AS n FROM seccion s
      INNER JOIN periodo_academico p ON p.id_periodo=s.id_periodo AND p.activo=1
      WHERE s.estado='Abierta'
    `);

    const recaudacion = await queryOne(`
      SELECT ISNULL(SUM(pg.monto),0) AS total
      FROM pago pg
      INNER JOIN factura f ON f.id_factura=pg.id_factura
      INNER JOIN periodo_academico p ON p.id_periodo=f.id_periodo AND p.activo=1
      WHERE pg.estado='Aprobado'
    `);

    const pagosPendientes = await queryOne(`
      SELECT COUNT(*) AS n FROM factura f
      INNER JOIN periodo_academico p ON p.id_periodo=f.id_periodo AND p.activo=1
      WHERE f.estado IN ('Pendiente','Parcial')
    `);

    const actividadReciente = await query(`
      SELECT TOP 8 b.entidad, b.accion, b.descripcion,
             CONVERT(varchar,b.fecha_evento,108) AS hora,
             DATEDIFF(MINUTE,b.fecha_evento,GETDATE()) AS minutos_atras,
             ISNULL(u.nombre+' '+u.apellido,'Sistema') AS usuario
      FROM bitacora_auditoria b
      LEFT JOIN usuario u ON u.id_usuario=b.id_usuario
      ORDER BY b.fecha_evento DESC
    `);

    const periodoActivo = await queryOne(`
      SELECT TOP 1 nombre, codigo,
             CONVERT(varchar,fecha_inicio_matricula,103) AS inicio_matricula,
             CONVERT(varchar,fecha_fin_matricula,103) AS fin_matricula
      FROM periodo_academico WHERE activo=1 ORDER BY fecha_inicio DESC
    `);

    res.json({
      ok: true,
      metricas: {
        estudiantesActivos:    estudiantesActivos?.n || 0,
        estudiantesBlockFin:   estudiantesBlockFin?.n || 0,
        estudiantesBlockAcad:  estudiantesBlockAcad?.n || 0,
        matriculasConfirmadas: matriculasConfirmadas?.n || 0,
        matriculasPendientes:  matriculasPendientes?.n || 0,
        seccionesActivas:      seccionesActivas?.n || 0,
        recaudacion:           recaudacion?.total || 0,
        pagosPendientes:       pagosPendientes?.n || 0
      },
      actividadReciente,
      periodoActivo
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/reports/academico — reporte académico por periodo */
router.get('/academico', async (req, res) => {
  try {
    const programas = await query(`
      SELECT pa.nombre AS programa,
             COUNT(DISTINCT e.id_estudiante) AS estudiantes,
             COUNT(DISTINCT pe.id_plan) AS planes
      FROM programa_academico pa
      LEFT JOIN estudiante e ON e.id_programa=pa.id_programa AND e.estado_academico='Activo'
      LEFT JOIN plan_estudio pe ON pe.id_programa=pa.id_programa AND pe.activo=1
      GROUP BY pa.nombre ORDER BY pa.nombre
    `);

    const cursosPorCredito = await query(`
      SELECT creditos, COUNT(*) AS total FROM curso WHERE activo=1
      GROUP BY creditos ORDER BY creditos
    `);

    res.json({ ok: true, programas, cursosPorCredito });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/reports/financiero — reporte financiero */
router.get('/financiero', async (req, res) => {
  try {
    const porEstado = await query(`
      SELECT estado, COUNT(*) AS total, ISNULL(SUM(total),0) AS monto
      FROM factura GROUP BY estado ORDER BY estado
    `);

    const porMetodo = await query(`
      SELECT metodo_pago, COUNT(*) AS total, ISNULL(SUM(monto),0) AS monto
      FROM pago WHERE estado='Aprobado'
      GROUP BY metodo_pago ORDER BY monto DESC
    `);

    res.json({ ok: true, porEstado, porMetodo });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/reports/export/matriculas — CSV de matrículas del periodo activo (RF-22) */
router.get('/export/matriculas', async (req, res) => {
  try {
    const { periodo = '' } = req.query;
    const params = {};
    let where = 'WHERE 1=1';
    if (periodo) { where += ' AND m.id_periodo=@per'; params.per = { type: require('../../config/db').sql.Int, value: parseInt(periodo) }; }

    const rows = await query(`
      SELECT e.carne, u.nombre + ' ' + u.apellido AS estudiante,
             pa.nombre AS programa, p.nombre AS periodo,
             m.estado, m.total_creditos, m.total_monto,
             m.confirmada,
             CONVERT(varchar,m.fecha_matricula,103) AS fecha_matricula,
             m.comprobante,
             (SELECT COUNT(*) FROM detalle_matricula WHERE id_matricula=m.id_matricula) AS num_cursos
      FROM matricula m
      INNER JOIN estudiante e ON e.id_estudiante=m.id_estudiante
      INNER JOIN usuario u ON u.id_usuario=e.id_usuario
      INNER JOIN programa_academico pa ON pa.id_programa=e.id_programa
      INNER JOIN periodo_academico p ON p.id_periodo=m.id_periodo
      ${where}
      ORDER BY m.fecha_matricula DESC
    `, params);

    const header = ['Carné','Estudiante','Programa','Período','Estado','Créditos','Monto','Confirmada','Fecha','Comprobante','Cursos'];
    const csv = [header.join(','),
      ...rows.map(r => [
        r.carne, `"${(r.estudiante||'').replace(/"/g,'""')}"`, `"${(r.programa||'').replace(/"/g,'""')}"`,
        `"${(r.periodo||'').replace(/"/g,'""')}"`, r.estado, r.total_creditos, r.total_monto,
        r.confirmada ? 'Sí' : 'No', r.fecha_matricula, r.comprobante||'', r.num_cursos
      ].join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="matriculas.csv"');
    res.send('\uFEFF' + csv);
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/reports/export/pagos — CSV de pagos (RF-22) */
router.get('/export/pagos', async (req, res) => {
  try {
    const rows = await query(`
      SELECT CONVERT(varchar,pg.fecha_pago,103) AS fecha_pago,
             e.carne, u.nombre + ' ' + u.apellido AS estudiante,
             f.numero_factura, pg.monto, pg.metodo_pago,
             pg.referencia_pasarela, pg.estado, pg.observacion
      FROM pago pg
      INNER JOIN factura f ON f.id_factura=pg.id_factura
      INNER JOIN estudiante e ON e.id_estudiante=f.id_estudiante
      INNER JOIN usuario u ON u.id_usuario=e.id_usuario
      ORDER BY pg.fecha_pago DESC
    `, {});

    const header = ['Fecha','Carné','Estudiante','Factura','Monto','Método','Referencia','Estado','Observación'];
    const csv = [header.join(','),
      ...rows.map(r => [
        r.fecha_pago, r.carne, `"${(r.estudiante||'').replace(/"/g,'""')}"`,
        r.numero_factura, r.monto, r.metodo_pago,
        r.referencia_pasarela||'', r.estado, `"${(r.observacion||'').replace(/"/g,'""')}"`
      ].join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pagos.csv"');
    res.send('\uFEFF' + csv);
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;

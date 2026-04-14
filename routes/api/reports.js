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

module.exports = router;

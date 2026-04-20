/**
 * routes/api/reports.js
 * Endpoints de reportes y dashboard administrativo
 */
const express = require('express');
const router = express.Router();
const { sql, query, queryOne } = require('../../config/db');

function escCsv(v) {
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function buildCsv(header, rows) {
  const lines = [header.join(',')];
  rows.forEach(r => lines.push(r.map(escCsv).join(',')));
  return lines.join('\r\n');
}

function buildTsv(header, rows) {
  const lines = [header.join('\t')];
  rows.forEach(r => lines.push(r.map(v => String(v ?? '').replace(/[\t\r\n]+/g, ' ')).join('\t')));
  return lines.join('\r\n');
}

function pdfEscape(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function simplePdfBuffer(lines) {
  const safeLines = Array.isArray(lines) ? lines.slice(0, 46) : [];
  let content = 'BT\n/F1 10 Tf\n50 800 Td\n';
  safeLines.forEach((line, idx) => {
    content += `(${pdfEscape(line)}) Tj\n`;
    if (idx < safeLines.length - 1) content += '0 -14 Td\n';
  });
  content += 'ET';

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  objects.push(`5 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream\nendobj\n`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach(obj => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  });

  const xrefPos = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function sendExcel(res, filenameBase, header, rows) {
  const tsv = buildTsv(header, rows);
  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xls"`);
  res.send('\uFEFF' + tsv);
}

function sendPdf(res, filenameBase, title, header, rows) {
  const now = new Date().toLocaleString('es-CR');
  const lines = [title, `Generado: ${now}`, ''.concat('-').repeat(100), header.join(' | ')];
  rows.forEach(r => lines.push(r.map(v => String(v ?? '')).join(' | ').slice(0, 170)));
  const pdf = simplePdfBuffer(lines);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
  res.send(pdf);
}

async function getAcademicoData() {
  const programas = await query(`
    SELECT pa.nombre AS programa,
           COUNT(DISTINCT e.id_estudiante) AS estudiantes,
           COUNT(DISTINCT pe.id_plan) AS planes
    FROM programa_academico pa
    LEFT JOIN estudiante e ON e.id_programa = pa.id_programa AND e.estado_academico = 'Activo'
    LEFT JOIN plan_estudio pe ON pe.id_programa = pa.id_programa AND pe.activo = 1
    GROUP BY pa.nombre
    ORDER BY pa.nombre
  `);

  const cursosPorCredito = await query(`
    SELECT creditos, COUNT(*) AS total
    FROM curso
    WHERE activo = 1
    GROUP BY creditos
    ORDER BY creditos
  `);

  return { programas, cursosPorCredito };
}

async function getFinancieroData() {
  const porEstado = await query(`
    SELECT estado, COUNT(*) AS total, ISNULL(SUM(total),0) AS monto
    FROM factura
    GROUP BY estado
    ORDER BY estado
  `);

  const porMetodo = await query(`
    SELECT metodo_pago, COUNT(*) AS total, ISNULL(SUM(monto),0) AS monto
    FROM pago
    WHERE estado = 'Aprobado'
    GROUP BY metodo_pago
    ORDER BY monto DESC
  `);

  return { porEstado, porMetodo };
}

async function getMatriculaData(periodoId = null) {
  const params = {};
  let where = 'WHERE 1=1';
  if (periodoId) {
    where += ' AND m.id_periodo = @per';
    params.per = { type: sql.Int, value: Number(periodoId) };
  }

  const resumen = await query(`
    SELECT p.nombre AS periodo,
           COUNT(*) AS total_matriculas,
           SUM(CASE WHEN m.confirmada = 1 THEN 1 ELSE 0 END) AS confirmadas,
           SUM(CASE WHEN m.confirmada = 0 THEN 1 ELSE 0 END) AS pendientes,
           ISNULL(SUM(m.total_creditos),0) AS total_creditos,
           ISNULL(SUM(m.total_monto),0) AS total_monto
    FROM matricula m
    INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
    ${where}
    GROUP BY p.nombre
    ORDER BY MAX(m.fecha_matricula) DESC
  `, params);

  const detalle = await query(`
    SELECT e.carne,
           u.nombre + ' ' + u.apellido AS estudiante,
           pa.nombre AS programa,
           p.nombre AS periodo,
           m.estado,
           m.total_creditos,
           m.total_monto,
           m.confirmada,
           CONVERT(varchar,m.fecha_matricula,23) AS fecha_matricula,
           ISNULL(m.comprobante, '') AS comprobante,
           (SELECT COUNT(*) FROM detalle_matricula dm WHERE dm.id_matricula = m.id_matricula) AS num_cursos
    FROM matricula m
    INNER JOIN estudiante e ON e.id_estudiante = m.id_estudiante
    INNER JOIN usuario u ON u.id_usuario = e.id_usuario
    INNER JOIN programa_academico pa ON pa.id_programa = e.id_programa
    INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
    ${where}
    ORDER BY m.fecha_matricula DESC
  `, params);

  return { resumen, detalle };
}

async function getEstudiantesData() {
  return query(`
    SELECT
      e.carne,
      u.nombre + ' ' + u.apellido AS estudiante,
      u.correo,
      pa.nombre AS programa,
      CONVERT(varchar,e.fecha_ingreso,23) AS fecha_ingreso,
      e.estado_academico,
      ISNULL(e.saldo_pendiente, 0) AS saldo_pendiente,
      e.bloqueado_financiero,
      e.bloqueado_academico
    FROM estudiante e
    INNER JOIN usuario u ON u.id_usuario = e.id_usuario
    INNER JOIN programa_academico pa ON pa.id_programa = e.id_programa
    ORDER BY u.apellido, u.nombre
  `, {});
}

async function getAuditoriaData(limit = 100) {
  const lim = Math.max(1, Math.min(1000, Number(limit) || 100));
  const data = await query(`
    SELECT TOP ${lim}
      CONVERT(varchar,b.fecha_evento,23) AS fecha,
      CONVERT(varchar,b.fecha_evento,108) AS hora,
      ISNULL(u.nombre + ' ' + u.apellido, 'Sistema') AS usuario,
      ISNULL(r.nombre, '-') AS rol,
      b.entidad,
      b.accion,
      b.descripcion,
      ISNULL(b.ip_origen, '') AS ip_origen
    FROM bitacora_auditoria b
    LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
    LEFT JOIN rol r ON r.id_rol = u.id_rol
    ORDER BY b.fecha_evento DESC
  `);
  return data;
}

/* GET /api/reports/dashboard */
router.get('/dashboard', async (req, res) => {
  try {
    const estudiantesActivos = await queryOne(`SELECT COUNT(*) AS n FROM estudiante WHERE estado_academico='Activo'`);
    const estudiantesBlockFin = await queryOne(`SELECT COUNT(*) AS n FROM estudiante WHERE bloqueado_financiero=1`);
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
        estudiantesActivos: estudiantesActivos?.n || 0,
        estudiantesBlockFin: estudiantesBlockFin?.n || 0,
        estudiantesBlockAcad: estudiantesBlockAcad?.n || 0,
        matriculasConfirmadas: matriculasConfirmadas?.n || 0,
        matriculasPendientes: matriculasPendientes?.n || 0,
        seccionesActivas: seccionesActivas?.n || 0,
        recaudacion: recaudacion?.total || 0,
        pagosPendientes: pagosPendientes?.n || 0
      },
      actividadReciente,
      periodoActivo
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/reports/academico */
router.get('/academico', async (req, res) => {
  try {
    const data = await getAcademicoData();
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/reports/financiero */
router.get('/financiero', async (req, res) => {
  try {
    const data = await getFinancieroData();
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/reports/matricula */
router.get('/matricula', async (req, res) => {
  try {
    const data = await getMatriculaData(req.query.periodo || null);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/reports/auditoria */
router.get('/auditoria', async (req, res) => {
  try {
    const data = await getAuditoriaData(req.query.limit || 100);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/reports/export/:seccion/:formato */
router.get('/export/:seccion/:formato', async (req, res) => {
  try {
    const seccion = String(req.params.seccion || '').toLowerCase();
    const formato = String(req.params.formato || '').toLowerCase();

    if (!['pdf', 'excel'].includes(formato)) {
      return res.status(400).json({ ok: false, error: 'Formato invalido' });
    }

    if (seccion === 'academico') {
      const { programas } = await getAcademicoData();
      const header = ['Programa', 'Estudiantes activos', 'Planes activos'];
      const rows = programas.map(r => [r.programa, r.estudiantes, r.planes]);
      if (formato === 'pdf') return sendPdf(res, 'reporte-academico', 'Reporte Academico', header, rows);
      return sendExcel(res, 'reporte-academico', header, rows);
    }

    if (seccion === 'financiero') {
      const { porEstado } = await getFinancieroData();
      const header = ['Estado factura', 'Total facturas', 'Monto'];
      const rows = porEstado.map(r => [r.estado, r.total, r.monto]);
      if (formato === 'pdf') return sendPdf(res, 'reporte-financiero', 'Reporte Financiero', header, rows);
      return sendExcel(res, 'reporte-financiero', header, rows);
    }

    if (seccion === 'matricula') {
      const { detalle } = await getMatriculaData(req.query.periodo || null);
      const header = ['Carne', 'Estudiante', 'Programa', 'Periodo', 'Estado', 'Creditos', 'Monto', 'Confirmada', 'Fecha', 'Comprobante', 'Cursos'];
      const rows = detalle.map(r => [
        r.carne,
        r.estudiante,
        r.programa,
        r.periodo,
        r.estado,
        r.total_creditos,
        r.total_monto,
        r.confirmada ? 'Si' : 'No',
        r.fecha_matricula,
        r.comprobante,
        r.num_cursos
      ]);
      if (formato === 'pdf') return sendPdf(res, 'reporte-matricula', 'Reporte de Matricula', header, rows);
      return sendExcel(res, 'reporte-matricula', header, rows);
    }

    if (seccion === 'estudiantes') {
      const data = await getEstudiantesData();
      const header = ['Carne', 'Estudiante', 'Correo', 'Programa', 'Ingreso', 'Estado', 'Saldo pendiente', 'Bloqueos'];
      const rows = data.map(r => [
        r.carne,
        r.estudiante,
        r.correo,
        r.programa,
        r.fecha_ingreso,
        r.estado_academico,
        r.saldo_pendiente,
        [r.bloqueado_financiero ? 'Financiero' : '', r.bloqueado_academico ? 'Academico' : ''].filter(Boolean).join(' / ') || 'Ninguno'
      ]);
      if (formato === 'pdf') return sendPdf(res, 'reporte-estudiantes', 'Reporte de Estudiantes', header, rows);
      return sendExcel(res, 'reporte-estudiantes', header, rows);
    }

    if (seccion === 'auditoria') {
      const data = await getAuditoriaData(req.query.limit || 200);
      const header = ['Fecha', 'Hora', 'Usuario', 'Rol', 'Entidad', 'Accion', 'Descripcion', 'IP'];
      const rows = data.map(r => [r.fecha, r.hora, r.usuario, r.rol, r.entidad, r.accion, r.descripcion, r.ip_origen]);
      if (formato === 'pdf') return sendPdf(res, 'reporte-auditoria', 'Reporte de Auditoria', header, rows);
      return sendExcel(res, 'reporte-auditoria', header, rows);
    }

    return res.status(404).json({ ok: false, error: 'Seccion de reporte no soportada' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* Legacy: export matriculas CSV */
router.get('/export/matriculas', async (req, res) => {
  try {
    const { detalle } = await getMatriculaData(req.query.periodo || null);
    const header = ['Carne', 'Estudiante', 'Programa', 'Periodo', 'Estado', 'Creditos', 'Monto', 'Confirmada', 'Fecha', 'Comprobante', 'Cursos'];
    const rows = detalle.map(r => [
      r.carne,
      r.estudiante,
      r.programa,
      r.periodo,
      r.estado,
      r.total_creditos,
      r.total_monto,
      r.confirmada ? 'Si' : 'No',
      r.fecha_matricula,
      r.comprobante,
      r.num_cursos
    ]);
    const csv = buildCsv(header, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="matriculas.csv"');
    res.send('\uFEFF' + csv);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* Legacy: export pagos CSV */
router.get('/export/pagos', async (req, res) => {
  try {
    const rowsDb = await query(`
      SELECT CONVERT(varchar,pg.fecha_pago,23) AS fecha_pago,
             e.carne,
             u.nombre + ' ' + u.apellido AS estudiante,
             f.numero_factura,
             pg.monto,
             pg.metodo_pago,
             ISNULL(pg.referencia_pasarela,'') AS referencia_pasarela,
             pg.estado,
             ISNULL(pg.observacion,'') AS observacion
      FROM pago pg
      INNER JOIN factura f ON f.id_factura = pg.id_factura
      INNER JOIN estudiante e ON e.id_estudiante = f.id_estudiante
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      ORDER BY pg.fecha_pago DESC
    `, {});

    const header = ['Fecha', 'Carne', 'Estudiante', 'Factura', 'Monto', 'Metodo', 'Referencia', 'Estado', 'Observacion'];
    const rows = rowsDb.map(r => [r.fecha_pago, r.carne, r.estudiante, r.numero_factura, r.monto, r.metodo_pago, r.referencia_pasarela, r.estado, r.observacion]);
    const csv = buildCsv(header, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pagos.csv"');
    res.send('\uFEFF' + csv);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
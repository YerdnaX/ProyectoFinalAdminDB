/**
 * routes/api/students.js
 * APIs para gestión de estudiantes
 */
const express = require('express');
const router  = express.Router();
const { sql, query, queryOne } = require('../../config/db');
const { requireRole } = require('../../middleware/auth');

function requireOwnerOrAdmin(req, res, next) {
  const user = req.session?.user;
  if (!user) return res.status(401).json({ ok: false, error: 'No autenticado' });
  if (user.rol === 'Administrador') return next();
  const id = parseInt(req.params.id, 10);
  if (user.rol === 'Estudiante' && Number.isInteger(id) && user.id_estudiante === id) return next();
  return res.status(403).json({ ok: false, error: 'Sin permisos suficientes' });
}

/* GET /api/students — lista de estudiantes (admin) */
router.get('/', requireRole('Administrador'), async (req, res) => {
  try {
    const { buscar = '', estado = '', programa = '', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = {};

    if (buscar) {
      where += ` AND (u.nombre LIKE @b OR u.apellido LIKE @b OR e.carne LIKE @b OR u.correo LIKE @b)`;
      params.b = `%${buscar}%`;
    }
    if (estado)   { where += ' AND e.estado_academico=@est'; params.est = estado; }
    if (programa) { where += ' AND e.id_programa=@prog'; params.prog = { type: sql.Int, value: parseInt(programa) }; }

    const rows = await query(`
      SELECT e.id_estudiante, e.carne, e.estado_academico,
             CONVERT(varchar,e.fecha_ingreso,103) AS fecha_ingreso,
             YEAR(e.fecha_ingreso) AS anio_ingreso,
             e.saldo_pendiente, e.bloqueado_financiero, e.bloqueado_academico,
             u.id_usuario, u.nombre, u.apellido, u.correo, u.identificador_sso, u.activo,
             pa.nombre AS programa
      FROM estudiante e
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      INNER JOIN programa_academico pa ON pa.id_programa = e.id_programa
      ${where}
      ORDER BY u.apellido, u.nombre
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `, params);

    const total = await queryOne(`
      SELECT COUNT(*) AS total FROM estudiante e
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      INNER JOIN programa_academico pa ON pa.id_programa = e.id_programa
      ${where}
    `, params);

    res.json({ ok: true, data: rows, total: total.total, page: parseInt(page) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/students/:id — perfil completo */
router.get('/:id', requireOwnerOrAdmin, async (req, res) => {
  try {
    const estudiante = await queryOne(`
      SELECT e.id_estudiante, e.carne, e.estado_academico,
             CONVERT(varchar,e.fecha_ingreso,103) AS fecha_ingreso,
             e.saldo_pendiente, e.bloqueado_financiero, e.bloqueado_academico,
             u.nombre, u.apellido, u.correo, u.identificador_sso, u.activo,
             pa.nombre AS programa, pa.nivel,
             pe.nombre AS plan_estudio
      FROM estudiante e
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      INNER JOIN programa_academico pa ON pa.id_programa = e.id_programa
      LEFT JOIN plan_estudio pe ON pe.id_programa = pa.id_programa AND pe.activo=1
      WHERE e.id_estudiante = @id
    `, { id: { type: sql.Int, value: parseInt(req.params.id) } });

    if (!estudiante) return res.status(404).json({ ok: false, error: 'Estudiante no encontrado' });

    // Matriculas del estudiante
    const matriculas = await query(`
      SELECT m.id_matricula, m.estado, m.total_creditos, m.total_monto, m.confirmada,
             CONVERT(varchar,m.fecha_matricula,103) AS fecha_matricula,
             p.nombre AS periodo, p.codigo AS periodo_codigo
      FROM matricula m
      INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
      WHERE m.id_estudiante = @id
      ORDER BY m.fecha_matricula DESC
    `, { id: { type: sql.Int, value: parseInt(req.params.id) } });

    res.json({ ok: true, data: { ...estudiante, matriculas } });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/students/:id/historial — historial academico */
router.get('/:id/historial', requireOwnerOrAdmin, async (req, res) => {
  try {
    const detalle = await query(`
      SELECT dm.id_detalle_matricula, dm.estado, dm.costo,
             c.codigo AS curso_codigo, c.nombre AS curso_nombre, c.creditos,
             p.nombre AS periodo, p.codigo AS periodo_codigo,
             s.codigo_seccion, s.modalidad,
             u.nombre + ' ' + u.apellido AS docente
      FROM detalle_matricula dm
      INNER JOIN matricula m ON m.id_matricula = dm.id_matricula
      INNER JOIN seccion s ON s.id_seccion = dm.id_seccion
      INNER JOIN curso c ON c.id_curso = s.id_curso
      INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
      LEFT JOIN usuario u ON u.id_usuario = s.id_docente_usuario
      WHERE m.id_estudiante = @id
      ORDER BY p.fecha_inicio DESC, c.codigo
    `, { id: { type: sql.Int, value: parseInt(req.params.id) } });

    const resumen = await queryOne(`
      SELECT COUNT(DISTINCT m.id_periodo) AS periodos_cursados,
             SUM(c.creditos) AS creditos_acumulados
      FROM detalle_matricula dm
      INNER JOIN matricula m ON m.id_matricula = dm.id_matricula
      INNER JOIN seccion s ON s.id_seccion = dm.id_seccion
      INNER JOIN curso c ON c.id_curso = s.id_curso
      WHERE m.id_estudiante = @id AND dm.estado = 'Matriculada'
    `, { id: { type: sql.Int, value: parseInt(req.params.id) } });

    res.json({ ok: true, data: detalle, resumen });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* PUT /api/students/:id — actualizar estado/bloqueos del estudiante */
router.put('/:id', requireRole('Administrador'), async (req, res) => {
  try {
    const { estado_academico, bloqueado_financiero, bloqueado_academico } = req.body;
    await query(
      `UPDATE estudiante SET estado_academico=@est,bloqueado_financiero=@bf,bloqueado_academico=@ba
       WHERE id_estudiante=@id`,
      { est: estado_academico,
        bf: { type: sql.Bit, value: bloqueado_financiero ? 1 : 0 },
        ba: { type: sql.Bit, value: bloqueado_academico ? 1 : 0 },
        id: { type: sql.Int, value: parseInt(req.params.id) } }
    );
    res.json({ ok: true, mensaje: 'Estudiante actualizado' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* PUT /api/students/:id/bloqueo — toggle bloqueo financiero */
router.put('/:id/bloqueo', requireRole('Administrador'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { bloqueo } = req.body;
    await query(
      `UPDATE estudiante SET bloqueado_financiero=@bf, bloqueado_academico=@ba WHERE id_estudiante=@id`,
      { bf: { type: sql.Bit, value: bloqueo ? 1 : 0 },
        ba: { type: sql.Bit, value: bloqueo ? 1 : 0 },
        id: { type: sql.Int, value: id } }
    );
    res.json({ ok: true, mensaje: 'Bloqueo actualizado' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/students/:id/dashboard — datos del portal estudiantil */
router.get('/:id/dashboard', requireOwnerOrAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const perfil = await queryOne(`
      SELECT e.id_estudiante, e.carne, e.saldo_pendiente,
             e.bloqueado_financiero, e.bloqueado_academico,
             u.nombre, u.apellido, pa.nombre AS programa
      FROM estudiante e
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      INNER JOIN programa_academico pa ON pa.id_programa = e.id_programa
      WHERE e.id_estudiante = @id
    `, { id: { type: sql.Int, value: id } });

    if (!perfil) return res.status(404).json({ ok: false, error: 'Estudiante no encontrado' });

    const matriculaActual = await queryOne(`
      SELECT TOP 1 m.id_matricula, m.estado, m.total_creditos, m.total_monto,
             m.confirmada, m.comprobante,
             p.nombre AS periodo, p.limite_creditos
      FROM matricula m
      INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
      WHERE m.id_estudiante = @id
      ORDER BY m.fecha_matricula DESC
    `, { id: { type: sql.Int, value: id } });

    const cursos = matriculaActual ? await query(`
      SELECT c.codigo, c.nombre, c.creditos, dm.estado,
             s.modalidad, a.nombre AS aula,
             (SELECT TOP 1 hs.dia_semana + ' ' + CONVERT(varchar,hs.hora_inicio,108)
              FROM horario_seccion hs WHERE hs.id_seccion=s.id_seccion) AS horario
      FROM detalle_matricula dm
      INNER JOIN seccion s ON s.id_seccion = dm.id_seccion
      INNER JOIN curso c ON c.id_curso = s.id_curso
      LEFT JOIN aula a ON a.id_aula = s.id_aula
      WHERE dm.id_matricula = @mid
    `, { mid: { type: sql.Int, value: matriculaActual.id_matricula } }) : [];

    const planInfo = await queryOne(`
      SELECT pe.creditos_totales, COUNT(dm.id_detalle_matricula) AS creditos_aprobados
      FROM plan_estudio pe
      LEFT JOIN plan_estudio_curso pc ON pc.id_plan = pe.id_plan
      LEFT JOIN curso c2 ON c2.id_curso = pc.id_curso
      LEFT JOIN seccion s2 ON s2.id_curso = c2.id_curso
      LEFT JOIN detalle_matricula dm ON dm.id_seccion = s2.id_seccion
        AND dm.estado = 'Matriculada'
      LEFT JOIN matricula m2 ON m2.id_matricula = dm.id_matricula AND m2.id_estudiante = @id
      WHERE pe.activo = 1
      GROUP BY pe.creditos_totales
    `, { id: { type: sql.Int, value: id } }).catch(() => null);

    res.json({
      ok: true,
      nombre: [perfil.nombre, perfil.apellido].filter(Boolean).join(' '),
      carne: perfil.carne,
      programa: perfil.programa,
      saldo_pendiente: perfil.saldo_pendiente || 0,
      periodo: matriculaActual?.periodo || null,
      estado_matricula: matriculaActual ? `${matriculaActual.estado} con ${cursos.length} cursos y ${matriculaActual.total_creditos} créditos` : null,
      num_cursos: cursos.length,
      creditos_actuales: matriculaActual?.total_creditos || 0,
      limite_creditos: matriculaActual?.limite_creditos || 20,
      creditos_aprobados: planInfo?.creditos_aprobados || 0,
      creditos_plan: planInfo?.creditos_totales || 160,
      cursos
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/students/dashboard/:id — alias backward compat */
router.get('/dashboard/:id', requireOwnerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const perfil = await queryOne(`
      SELECT e.id_estudiante, e.carne, e.saldo_pendiente,
             e.bloqueado_financiero, e.bloqueado_academico,
             u.nombre, u.apellido, pa.nombre AS programa
      FROM estudiante e
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      INNER JOIN programa_academico pa ON pa.id_programa = e.id_programa
      WHERE e.id_estudiante = @id
    `, { id: { type: sql.Int, value: id } });

    const matriculaActual = await queryOne(`
      SELECT TOP 1 m.id_matricula, m.estado, m.total_creditos, m.total_monto,
             m.confirmada, m.comprobante,
             p.nombre AS periodo, p.limite_creditos
      FROM matricula m
      INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
      WHERE m.id_estudiante = @id
      ORDER BY m.fecha_matricula DESC
    `, { id: { type: sql.Int, value: id } });

    const cursosActuales = matriculaActual ? await query(`
      SELECT c.codigo, c.nombre, c.creditos, dm.estado,
             s.modalidad, s.codigo_seccion,
             u.nombre + ' ' + u.apellido AS docente,
             (SELECT TOP 1 hs.dia_semana + ' ' + CONVERT(varchar,hs.hora_inicio,108)
              FROM horario_seccion hs WHERE hs.id_seccion=s.id_seccion) AS horario
      FROM detalle_matricula dm
      INNER JOIN seccion s ON s.id_seccion = dm.id_seccion
      INNER JOIN curso c ON c.id_curso = s.id_curso
      LEFT JOIN usuario u ON u.id_usuario = s.id_docente_usuario
      WHERE dm.id_matricula = @mid
    `, { mid: { type: sql.Int, value: matriculaActual.id_matricula } }) : [];

    res.json({ ok: true, perfil, matriculaActual, cursosActuales });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;

/**
 * routes/api/academic.js
 * APIs para gestión académica: programas, planes, cursos, periodos, secciones, aulas
 */
const express = require('express');
const router  = express.Router();
const { sql, query, queryOne } = require('../../config/db');

/* ══════════════════════════════════════
   PROGRAMAS ACADEMICOS
══════════════════════════════════════ */

router.get('/programas', async (req, res) => {
  try {
    const rows = await query(`
      SELECT pa.id_programa, pa.codigo, pa.nombre, pa.nivel, pa.activo,
             COUNT(DISTINCT pe.id_plan) AS total_planes,
             COUNT(DISTINCT e.id_estudiante) AS total_estudiantes
      FROM programa_academico pa
      LEFT JOIN plan_estudio pe ON pe.id_programa = pa.id_programa
      LEFT JOIN estudiante e ON e.id_programa = pa.id_programa
      GROUP BY pa.id_programa, pa.codigo, pa.nombre, pa.nivel, pa.activo
      ORDER BY pa.nombre
    `);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/programas', async (req, res) => {
  try {
    const { codigo, nombre, nivel, activo = 1 } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ ok: false, error: 'codigo y nombre son requeridos' });
    const r = await query(
      `INSERT INTO programa_academico(codigo,nombre,nivel,activo) OUTPUT INSERTED.id_programa VALUES(@c,@n,@nv,@a)`,
      { c: codigo, n: nombre, nv: nivel || null, a: activo ? 1 : 0 }
    );
    res.status(201).json({ ok: true, id: r[0].id_programa });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.put('/programas/:id', async (req, res) => {
  try {
    const { nombre, nivel, activo } = req.body;
    await query(`UPDATE programa_academico SET nombre=@n,nivel=@nv,activo=@a WHERE id_programa=@id`,
      { n: nombre, nv: nivel || null, a: activo ? 1 : 0, id: { type: sql.Int, value: parseInt(req.params.id) } });
    res.json({ ok: true, mensaje: 'Programa actualizado' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ══════════════════════════════════════
   PLANES DE ESTUDIO
══════════════════════════════════════ */

router.get('/planes', async (req, res) => {
  try {
    const rows = await query(`
      SELECT pl.id_plan, pl.codigo, pl.nombre, pl.activo,
             CONVERT(varchar,pl.fecha_vigencia_inicio,23) AS fecha_inicio,
             CONVERT(varchar,pl.fecha_vigencia_fin,23)    AS fecha_fin,
             pa.nombre AS programa,
             COUNT(pc.id_curso) AS total_cursos
      FROM plan_estudio pl
      INNER JOIN programa_academico pa ON pa.id_programa = pl.id_programa
      LEFT JOIN plan_estudio_curso pc ON pc.id_plan = pl.id_plan
      GROUP BY pl.id_plan,pl.codigo,pl.nombre,pl.activo,pl.fecha_vigencia_inicio,pl.fecha_vigencia_fin,pa.nombre
      ORDER BY pa.nombre, pl.nombre
    `);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/planes', async (req, res) => {
  try {
    const { id_programa, codigo, nombre, fecha_vigencia_inicio, activo = 1 } = req.body;
    if (!id_programa || !codigo || !nombre || !fecha_vigencia_inicio)
      return res.status(400).json({ ok: false, error: 'Faltan campos' });
    const r = await query(
      `INSERT INTO plan_estudio(id_programa,codigo,nombre,fecha_vigencia_inicio,activo)
       OUTPUT INSERTED.id_plan VALUES(@p,@c,@n,@fi,@a)`,
      { p: { type: sql.Int, value: parseInt(id_programa) }, c: codigo, n: nombre,
        fi: fecha_vigencia_inicio, a: activo ? 1 : 0 }
    );
    res.status(201).json({ ok: true, id: r[0].id_plan });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ══════════════════════════════════════
   CURSOS
══════════════════════════════════════ */

router.get('/cursos', async (req, res) => {
  try {
    const { buscar = '', estado = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = {};
    if (buscar) { where += ' AND (c.nombre LIKE @b OR c.codigo LIKE @b)'; params.b = `%${buscar}%`; }
    if (estado === 'Activo')   { where += ' AND c.activo=1'; }
    if (estado === 'Inactivo') { where += ' AND c.activo=0'; }

    const rows = await query(`
      SELECT c.id_curso, c.codigo, c.nombre, c.descripcion, c.creditos, c.horas_semanales, c.activo,
             STRING_AGG(cp.codigo, ', ') AS prerrequisitos
      FROM curso c
      LEFT JOIN curso_prerrequisito pre ON pre.id_curso = c.id_curso
      LEFT JOIN curso cp ON cp.id_curso = pre.id_curso_prerrequisito
      ${where}
      GROUP BY c.id_curso,c.codigo,c.nombre,c.descripcion,c.creditos,c.horas_semanales,c.activo
      ORDER BY c.codigo
    `, params);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/cursos/:id', async (req, res) => {
  try {
    const curso = await queryOne(
      `SELECT * FROM curso WHERE id_curso=@id`,
      { id: { type: sql.Int, value: parseInt(req.params.id) } }
    );
    if (!curso) return res.status(404).json({ ok: false, error: 'Curso no encontrado' });
    res.json({ ok: true, data: curso });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/cursos', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, creditos, horas_semanales, activo = 1 } = req.body;
    if (!codigo || !nombre || !creditos)
      return res.status(400).json({ ok: false, error: 'codigo, nombre y creditos son requeridos' });
    const r = await query(
      `INSERT INTO curso(codigo,nombre,descripcion,creditos,horas_semanales,activo)
       OUTPUT INSERTED.id_curso VALUES(@c,@n,@d,@cr,@h,@a)`,
      { c: codigo, n: nombre, d: descripcion || null,
        cr: { type: sql.Int, value: parseInt(creditos) },
        h:  { type: sql.Int, value: horas_semanales ? parseInt(horas_semanales) : null },
        a:  activo ? 1 : 0 }
    );
    res.status(201).json({ ok: true, id: r[0].id_curso });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.put('/cursos/:id', async (req, res) => {
  try {
    const { nombre, descripcion, creditos, horas_semanales, activo } = req.body;
    await query(
      `UPDATE curso SET nombre=@n,descripcion=@d,creditos=@cr,horas_semanales=@h,activo=@a WHERE id_curso=@id`,
      { n: nombre, d: descripcion || null,
        cr: { type: sql.Int, value: parseInt(creditos) },
        h:  { type: sql.Int, value: horas_semanales ? parseInt(horas_semanales) : null },
        a:  activo ? 1 : 0,
        id: { type: sql.Int, value: parseInt(req.params.id) } }
    );
    res.json({ ok: true, mensaje: 'Curso actualizado' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ══════════════════════════════════════
   PERIODOS ACADEMICOS
══════════════════════════════════════ */

router.get('/periodos', async (req, res) => {
  try {
    const rows = await query(`
      SELECT p.id_periodo, p.codigo, p.nombre, p.tipo_periodo, p.activo,
             CONVERT(varchar,p.fecha_inicio,23)            AS fecha_inicio,
             CONVERT(varchar,p.fecha_fin,23)               AS fecha_fin,
             CONVERT(varchar,p.fecha_inicio_matricula,23)  AS fecha_inicio_matricula,
             CONVERT(varchar,p.fecha_fin_matricula,23)     AS fecha_fin_matricula,
             p.limite_creditos,
             COUNT(DISTINCT s.id_seccion)  AS total_secciones,
             COUNT(DISTINCT m.id_matricula) AS total_matriculas
      FROM periodo_academico p
      LEFT JOIN seccion s ON s.id_periodo = p.id_periodo
      LEFT JOIN matricula m ON m.id_periodo = p.id_periodo
      GROUP BY p.id_periodo,p.codigo,p.nombre,p.tipo_periodo,p.activo,
               p.fecha_inicio,p.fecha_fin,p.fecha_inicio_matricula,p.fecha_fin_matricula,p.limite_creditos
      ORDER BY p.fecha_inicio DESC
    `);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/periodos', async (req, res) => {
  try {
    const { codigo, nombre, tipo_periodo, fecha_inicio, fecha_fin,
            fecha_inicio_matricula, fecha_fin_matricula, limite_creditos, activo = 1 } = req.body;
    if (!codigo || !nombre || !tipo_periodo || !fecha_inicio || !fecha_fin)
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    const r = await query(
      `INSERT INTO periodo_academico(codigo,nombre,tipo_periodo,fecha_inicio,fecha_fin,
         fecha_inicio_matricula,fecha_fin_matricula,limite_creditos,activo)
       OUTPUT INSERTED.id_periodo
       VALUES(@c,@n,@tp,@fi,@ff,@fim,@ffm,@lc,@a)`,
      { c: codigo, n: nombre, tp: tipo_periodo, fi: fecha_inicio, ff: fecha_fin,
        fim: fecha_inicio_matricula, ffm: fecha_fin_matricula,
        lc: { type: sql.Int, value: parseInt(limite_creditos) || 16 },
        a: activo ? 1 : 0 }
    );
    res.status(201).json({ ok: true, id: r[0].id_periodo });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.put('/periodos/:id', async (req, res) => {
  try {
    const { nombre, activo, limite_creditos } = req.body;
    await query(
      `UPDATE periodo_academico SET nombre=@n,activo=@a,limite_creditos=@lc WHERE id_periodo=@id`,
      { n: nombre, a: activo ? 1 : 0,
        lc: { type: sql.Int, value: parseInt(limite_creditos) },
        id: { type: sql.Int, value: parseInt(req.params.id) } }
    );
    res.json({ ok: true, mensaje: 'Periodo actualizado' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ══════════════════════════════════════
   AULAS
══════════════════════════════════════ */

router.get('/aulas', async (req, res) => {
  try {
    const rows = await query(`
      SELECT a.id_aula, a.codigo, a.nombre, a.edificio, a.capacidad, a.activa,
             COUNT(s.id_seccion) AS secciones_activas
      FROM aula a
      LEFT JOIN seccion s ON s.id_aula = a.id_aula AND s.estado='Abierta'
      GROUP BY a.id_aula,a.codigo,a.nombre,a.edificio,a.capacidad,a.activa
      ORDER BY a.edificio, a.codigo
    `);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/aulas', async (req, res) => {
  try {
    const { codigo, nombre, edificio, capacidad, activa = 1 } = req.body;
    if (!codigo || !nombre || !capacidad)
      return res.status(400).json({ ok: false, error: 'codigo, nombre y capacidad son requeridos' });
    const r = await query(
      `INSERT INTO aula(codigo,nombre,edificio,capacidad,activa) OUTPUT INSERTED.id_aula VALUES(@c,@n,@e,@cap,@a)`,
      { c: codigo, n: nombre, e: edificio || null,
        cap: { type: sql.Int, value: parseInt(capacidad) }, a: activa ? 1 : 0 }
    );
    res.status(201).json({ ok: true, id: r[0].id_aula });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.put('/aulas/:id', async (req, res) => {
  try {
    const { nombre, edificio, capacidad, activa } = req.body;
    await query(
      `UPDATE aula SET nombre=@n,edificio=@e,capacidad=@cap,activa=@a WHERE id_aula=@id`,
      { n: nombre, e: edificio || null,
        cap: { type: sql.Int, value: parseInt(capacidad) },
        a: activa ? 1 : 0,
        id: { type: sql.Int, value: parseInt(req.params.id) } }
    );
    res.json({ ok: true, mensaje: 'Aula actualizada' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ══════════════════════════════════════
   SECCIONES
══════════════════════════════════════ */

router.get('/secciones', async (req, res) => {
  try {
    const { periodo = '', buscar = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = {};
    if (periodo) { where += ' AND s.id_periodo=@per'; params.per = { type: sql.Int, value: parseInt(periodo) }; }
    if (buscar)  { where += ' AND (c.nombre LIKE @b OR c.codigo LIKE @b)'; params.b = `%${buscar}%`; }

    const rows = await query(`
      SELECT s.id_seccion, s.codigo_seccion, s.cupo_maximo, s.cupo_disponible,
             s.modalidad, s.estado,
             c.codigo AS curso_codigo, c.nombre AS curso_nombre, c.creditos,
             u.nombre + ' ' + u.apellido AS docente,
             a.nombre AS aula, a.edificio,
             p.nombre AS periodo,
             (SELECT STRING_AGG(hs.dia_semana+' '+CONVERT(varchar,hs.hora_inicio,108)+'-'+CONVERT(varchar,hs.hora_fin,108),', ')
              FROM horario_seccion hs WHERE hs.id_seccion=s.id_seccion) AS horario
      FROM seccion s
      INNER JOIN curso c ON c.id_curso = s.id_curso
      INNER JOIN periodo_academico p ON p.id_periodo = s.id_periodo
      LEFT JOIN usuario u ON u.id_usuario = s.id_docente_usuario
      LEFT JOIN aula a ON a.id_aula = s.id_aula
      ${where}
      ORDER BY c.codigo, s.codigo_seccion
    `, params);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/secciones', async (req, res) => {
  try {
    const { id_curso, id_periodo, codigo_seccion, id_docente_usuario,
            id_aula, cupo_maximo, modalidad, estado = 'Abierta' } = req.body;
    if (!id_curso || !id_periodo || !codigo_seccion || !cupo_maximo)
      return res.status(400).json({ ok: false, error: 'Faltan campos' });
    const r = await query(
      `INSERT INTO seccion(id_curso,id_periodo,codigo_seccion,id_docente_usuario,id_aula,
         cupo_maximo,cupo_disponible,modalidad,estado)
       OUTPUT INSERTED.id_seccion
       VALUES(@ic,@ip,@cs,@doc,@aula,@cm,@cm,@mod,@est)`,
      { ic: { type: sql.Int, value: parseInt(id_curso) },
        ip: { type: sql.Int, value: parseInt(id_periodo) },
        cs: codigo_seccion,
        doc: { type: sql.Int, value: id_docente_usuario ? parseInt(id_docente_usuario) : null },
        aula: { type: sql.Int, value: id_aula ? parseInt(id_aula) : null },
        cm: { type: sql.Int, value: parseInt(cupo_maximo) },
        mod: modalidad || 'Presencial', est: estado }
    );
    res.status(201).json({ ok: true, id: r[0].id_seccion });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;

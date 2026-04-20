/**
 * routes/api/academic.js
 * APIs para gestiÃƒÆ’Ã‚Â³n acadÃƒÆ’Ã‚Â©mica: programas, planes, cursos, periodos, secciones, aulas
 */
const express = require('express');
const router  = express.Router();
const { sql, query, queryOne } = require('../../config/db');

function normalizarNivel(valor) {
  const key = String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const mapa = {
    tecnico: 'Tecnico',
    diplomado: 'Diplomado',
    bachillerato: 'Bachillerato',
    licenciatura: 'Licenciatura',
    maestria: 'Maestria',
    doctorado: 'Doctorado'
  };
  return mapa[key] || null;
}

function normalizarTipoPeriodo(valor) {
  const key = String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const mapa = {
    semestre: 'Semestre',
    semestral: 'Semestre',
    cuatrimestre: 'Cuatrimestre',
    cuatrimestral: 'Cuatrimestre',
    trimestre: 'Trimestre',
    trimestral: 'Trimestre'
  };
  return mapa[key] || null;
}

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   PROGRAMAS ACADEMICOS
ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

router.get('/programas', async (req, res) => {
  try {
    const { buscar = '', nivel = '', estado = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = {};
    if (buscar) {
      where += ' AND (pa.codigo LIKE @buscar OR pa.nombre LIKE @buscar)';
      params.buscar = `%${buscar}%`;
    }
    if (nivel) {
      const nivelSql = normalizarNivel(nivel);
      if (!nivelSql) return res.status(400).json({ ok: false, error: 'Nivel acadÃƒÆ’Ã‚Â©mico invÃƒÆ’Ã‚Â¡lido' });
      where += ' AND pa.nivel = @nivel';
      params.nivel = nivelSql;
    }
    if (estado === '1' || String(estado).toLowerCase() === 'activo') {
      where += ' AND pa.activo = 1';
    } else if (estado === '0' || String(estado).toLowerCase() === 'inactivo') {
      where += ' AND pa.activo = 0';
    }

    const rows = await query(`
      SELECT pa.id_programa, pa.codigo, pa.nombre, pa.nivel, pa.activo,
             COUNT(DISTINCT pe.id_plan) AS total_planes,
             COUNT(DISTINCT e.id_estudiante) AS total_estudiantes
      FROM programa_academico pa
      LEFT JOIN plan_estudio pe ON pe.id_programa = pa.id_programa
      LEFT JOIN estudiante e ON e.id_programa = pa.id_programa
      ${where}
      GROUP BY pa.id_programa, pa.codigo, pa.nombre, pa.nivel, pa.activo
      ORDER BY pa.nombre
    `, params);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/programas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invÃƒÆ’Ã‚Â¡lido' });
    const row = await queryOne(
      `SELECT id_programa, codigo, nombre, nivel, activo
       FROM programa_academico
       WHERE id_programa = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!row) return res.status(404).json({ ok: false, error: 'Programa no encontrado' });
    return res.json({ ok: true, data: row });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/programas/:id/planes', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });

    const rows = await query(
      `SELECT pl.id_plan, pl.codigo, pl.nombre, pl.activo,
              CONVERT(varchar,pl.fecha_vigencia_inicio,23) AS fecha_inicio,
              CONVERT(varchar,pl.fecha_vigencia_fin,23)    AS fecha_fin,
              COUNT(pc.id_curso) AS total_cursos
       FROM plan_estudio pl
       LEFT JOIN plan_estudio_curso pc ON pc.id_plan = pl.id_plan
       WHERE pl.id_programa = @id
       GROUP BY pl.id_plan, pl.codigo, pl.nombre, pl.activo, pl.fecha_vigencia_inicio, pl.fecha_vigencia_fin
       ORDER BY pl.nombre`,
      { id: { type: sql.Int, value: id } }
    );
    return res.json({ ok: true, data: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/programas', async (req, res) => {
  try {
    const { codigo, nombre, nivel, activo = 1 } = req.body;
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const nivelSql = normalizarNivel(nivel);
    if (!codigoClean || !nombreClean || !nivelSql) {
      return res.status(400).json({ ok: false, error: 'codigo, nombre y nivel vÃƒÆ’Ã‚Â¡lidos son requeridos' });
    }
    const r = await query(
      `INSERT INTO programa_academico(codigo,nombre,nivel,activo) OUTPUT INSERTED.id_programa VALUES(@c,@n,@nv,@a)`,
      { c: codigoClean, n: nombreClean, nv: nivelSql, a: activo ? 1 : 0 }
    );
    res.status(201).json({ ok: true, id: r[0].id_programa });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un programa con ese cÃƒÆ’Ã‚Â³digo' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/programas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { codigo, nombre, nivel, activo } = req.body;
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const nivelSql = normalizarNivel(nivel);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invÃƒÆ’Ã‚Â¡lido' });
    if (!codigoClean || !nombreClean || !nivelSql) {
      return res.status(400).json({ ok: false, error: 'codigo, nombre y nivel vÃƒÆ’Ã‚Â¡lidos son requeridos' });
    }

    const updated = await query(
      `UPDATE programa_academico
       SET codigo=@c,nombre=@n,nivel=@nv,activo=@a
       OUTPUT INSERTED.id_programa
       WHERE id_programa=@id`,
      {
        c: codigoClean,
        n: nombreClean,
        nv: nivelSql,
        a: (activo === undefined ? 1 : (activo ? 1 : 0)),
        id: { type: sql.Int, value: id }
      }
    );
    if (!updated.length) return res.status(404).json({ ok: false, error: 'Programa no encontrado' });
    res.json({ ok: true, mensaje: 'Programa actualizado' });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un programa con ese cÃƒÆ’Ã‚Â³digo' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   PLANES DE ESTUDIO
ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

router.get('/planes', async (req, res) => {
  try {
    const { buscar = '', programa = '', estado = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = {};
    if (buscar) {
      where += ' AND (pl.codigo LIKE @buscar OR pl.nombre LIKE @buscar)';
      params.buscar = `%${buscar}%`;
    }
    if (programa) {
      const idPrograma = parseInt(programa, 10);
      if (!Number.isInteger(idPrograma)) return res.status(400).json({ ok: false, error: 'Programa invalido' });
      where += ' AND pl.id_programa = @id_programa';
      params.id_programa = { type: sql.Int, value: idPrograma };
    }
    if (estado === '1' || String(estado).toLowerCase() === 'activo') {
      where += ' AND pl.activo = 1';
    } else if (estado === '0' || String(estado).toLowerCase() === 'inactivo') {
      where += ' AND pl.activo = 0';
    }

    const rows = await query(`
      SELECT pl.id_plan, pl.id_programa, pl.codigo, pl.nombre, pl.activo,
             CONVERT(varchar,pl.fecha_vigencia_inicio,23) AS fecha_inicio,
             CONVERT(varchar,pl.fecha_vigencia_fin,23)    AS fecha_fin,
             pa.codigo AS programa_codigo,
             pa.nombre AS programa_nombre,
             COUNT(pc.id_curso) AS total_cursos
      FROM plan_estudio pl
      INNER JOIN programa_academico pa ON pa.id_programa = pl.id_programa
      LEFT JOIN plan_estudio_curso pc ON pc.id_plan = pl.id_plan
      ${where}
      GROUP BY pl.id_plan,pl.id_programa,pl.codigo,pl.nombre,pl.activo,pl.fecha_vigencia_inicio,pl.fecha_vigencia_fin,pa.codigo,pa.nombre
      ORDER BY pa.nombre, pl.nombre
    `, params);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/planes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    const row = await queryOne(
      `SELECT id_plan, id_programa, codigo, nombre, activo,
              CONVERT(varchar,fecha_vigencia_inicio,23) AS fecha_inicio,
              CONVERT(varchar,fecha_vigencia_fin,23)    AS fecha_fin
       FROM plan_estudio
       WHERE id_plan = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!row) return res.status(404).json({ ok: false, error: 'Plan no encontrado' });
    return res.json({ ok: true, data: row });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/planes/:id/cursos', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });

    const rows = await query(
      `SELECT c.id_curso, c.codigo, c.nombre, c.descripcion, c.creditos, c.horas_semanales, c.activo
       FROM plan_estudio_curso pc
       INNER JOIN curso c ON c.id_curso = pc.id_curso
       WHERE pc.id_plan = @id
       ORDER BY c.codigo`,
      { id: { type: sql.Int, value: id } }
    );
    return res.json({ ok: true, data: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/planes', async (req, res) => {
  try {
    const { id_programa, codigo, nombre, fecha_vigencia_inicio, fecha_vigencia_fin, activo = 1 } = req.body;
    const idPrograma = parseInt(id_programa, 10);
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const inicio = String(fecha_vigencia_inicio || '').trim();
    const fin = String(fecha_vigencia_fin || '').trim();

    if (!Number.isInteger(idPrograma) || !codigoClean || !nombreClean || !inicio)
      return res.status(400).json({ ok: false, error: 'Faltan campos' });
    if (fin && fin <= inicio) return res.status(400).json({ ok: false, error: 'La fecha fin debe ser mayor a la fecha inicio' });

    const r = await query(
      `INSERT INTO plan_estudio(id_programa,codigo,nombre,fecha_vigencia_inicio,fecha_vigencia_fin,activo)
       OUTPUT INSERTED.id_plan VALUES(@p,@c,@n,@fi,@ff,@a)`,
      {
        p: { type: sql.Int, value: idPrograma },
        c: codigoClean,
        n: nombreClean,
        fi: inicio,
        ff: fin || null,
        a: activo ? 1 : 0
      }
    );
    res.status(201).json({ ok: true, id: r[0].id_plan });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un plan con ese codigo' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/planes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { id_programa, codigo, nombre, fecha_vigencia_inicio, fecha_vigencia_fin, activo } = req.body;
    const idPrograma = parseInt(id_programa, 10);
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const inicio = String(fecha_vigencia_inicio || '').trim();
    const fin = String(fecha_vigencia_fin || '').trim();

    if (!Number.isInteger(id) || !Number.isInteger(idPrograma) || !codigoClean || !nombreClean || !inicio) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }
    if (fin && fin <= inicio) return res.status(400).json({ ok: false, error: 'La fecha fin debe ser mayor a la fecha inicio' });

    const updated = await query(
      `UPDATE plan_estudio
       SET id_programa=@p,codigo=@c,nombre=@n,fecha_vigencia_inicio=@fi,fecha_vigencia_fin=@ff,activo=@a
       OUTPUT INSERTED.id_plan
       WHERE id_plan=@id`,
      {
        p: { type: sql.Int, value: idPrograma },
        c: codigoClean,
        n: nombreClean,
        fi: inicio,
        ff: fin || null,
        a: (activo === undefined ? 1 : (activo ? 1 : 0)),
        id: { type: sql.Int, value: id }
      }
    );
    if (!updated.length) return res.status(404).json({ ok: false, error: 'Plan no encontrado' });
    return res.json({ ok: true, mensaje: 'Plan actualizado' });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un plan con ese codigo' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   CURSOS
ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

router.get('/cursos', async (req, res) => {
  try {
    const { buscar = '', estado = '', creditos = '', plan = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = {};
    if (buscar) { where += ' AND (c.nombre LIKE @b OR c.codigo LIKE @b)'; params.b = `%${buscar}%`; }
    if (estado === 'Activo')   { where += ' AND c.activo=1'; }
    if (estado === 'Inactivo') { where += ' AND c.activo=0'; }
    if (estado === '1') { where += ' AND c.activo=1'; }
    if (estado === '0') { where += ' AND c.activo=0'; }
    if (creditos) {
      const credits = parseInt(creditos, 10);
      if (!Number.isInteger(credits)) return res.status(400).json({ ok: false, error: 'Filtro de creditos invalido' });
      where += ' AND c.creditos=@cr';
      params.cr = { type: sql.Int, value: credits };
    }
    if (plan) {
      const idPlan = parseInt(plan, 10);
      if (!Number.isInteger(idPlan)) return res.status(400).json({ ok: false, error: 'Filtro de plan invalido' });
      where += ' AND pc.id_plan=@pl';
      params.pl = { type: sql.Int, value: idPlan };
    }

    const rows = await query(`
      SELECT c.id_curso, c.codigo, c.nombre, c.descripcion, c.creditos, c.horas_semanales, c.activo,
             pc.id_plan, pl.codigo AS plan_codigo, pl.nombre AS plan_nombre,
             STRING_AGG(cp.codigo, ', ') AS prerrequisitos
      FROM curso c
      INNER JOIN plan_estudio_curso pc ON pc.id_curso = c.id_curso
      INNER JOIN plan_estudio pl ON pl.id_plan = pc.id_plan
      LEFT JOIN curso_prerrequisito pre ON pre.id_curso = c.id_curso
      LEFT JOIN curso cp ON cp.id_curso = pre.id_curso_prerrequisito
      ${where}
      GROUP BY c.id_curso,c.codigo,c.nombre,c.descripcion,c.creditos,c.horas_semanales,c.activo,pc.id_plan,pl.codigo,pl.nombre
      ORDER BY c.codigo
    `, params);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/cursos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    const curso = await queryOne(
      `SELECT c.*, pc.id_plan, pl.codigo AS plan_codigo, pl.nombre AS plan_nombre
       FROM curso c
       INNER JOIN plan_estudio_curso pc ON pc.id_curso = c.id_curso
       INNER JOIN plan_estudio pl ON pl.id_plan = pc.id_plan
       WHERE c.id_curso=@id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!curso) return res.status(404).json({ ok: false, error: 'Curso no encontrado' });
    res.json({ ok: true, data: curso });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/cursos', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, creditos, horas_semanales, id_plan, activo = 1 } = req.body;
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const creditosVal = parseInt(creditos, 10);
    const idPlanVal = parseInt(id_plan, 10);
    const horasVal = (horas_semanales === undefined || horas_semanales === null || horas_semanales === '')
      ? null
      : parseInt(horas_semanales, 10);

    if (!codigoClean || !nombreClean || !Number.isInteger(creditosVal) || creditosVal <= 0 || !Number.isInteger(idPlanVal))
      return res.status(400).json({ ok: false, error: 'codigo, nombre, creditos e id_plan son requeridos' });
    if (horasVal !== null && (!Number.isInteger(horasVal) || horasVal <= 0)) {
      return res.status(400).json({ ok: false, error: 'horas_semanales debe ser mayor a cero' });
    }

    const r = await query(
      `INSERT INTO curso(codigo,nombre,descripcion,creditos,horas_semanales,activo)
       OUTPUT INSERTED.id_curso VALUES(@c,@n,@d,@cr,@h,@a)`,
      { c: codigoClean, n: nombreClean, d: descripcion || null,
        cr: { type: sql.Int, value: creditosVal },
        h:  { type: sql.Int, value: horasVal },
        a:  activo ? 1 : 0 }
    );
    const idCurso = r[0].id_curso;

    try {
      await query(
        `INSERT INTO plan_estudio_curso(id_plan,id_curso,ciclo,obligatorio)
         VALUES(@p,@c,NULL,1)`,
        {
          p: { type: sql.Int, value: idPlanVal },
          c: { type: sql.Int, value: idCurso }
        }
      );
    } catch (relErr) {
      await query('DELETE FROM curso WHERE id_curso=@id', { id: { type: sql.Int, value: idCurso } });
      throw relErr;
    }
    res.status(201).json({ ok: true, id: idCurso });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un curso con ese codigo o ya esta asignado en otro plan' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/cursos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { codigo, nombre, descripcion, creditos, horas_semanales, id_plan, activo } = req.body;
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const creditosVal = parseInt(creditos, 10);
    const idPlanVal = parseInt(id_plan, 10);
    const horasVal = (horas_semanales === undefined || horas_semanales === null || horas_semanales === '')
      ? null
      : parseInt(horas_semanales, 10);

    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    if (!codigoClean || !nombreClean || !Number.isInteger(creditosVal) || creditosVal <= 0 || !Number.isInteger(idPlanVal)) {
      return res.status(400).json({ ok: false, error: 'codigo, nombre, creditos e id_plan son requeridos' });
    }
    if (horasVal !== null && (!Number.isInteger(horasVal) || horasVal <= 0)) {
      return res.status(400).json({ ok: false, error: 'horas_semanales debe ser mayor a cero' });
    }

    const updated = await query(
      `UPDATE curso
       SET codigo=@c,nombre=@n,descripcion=@d,creditos=@cr,horas_semanales=@h,activo=@a
       OUTPUT INSERTED.id_curso
       WHERE id_curso=@id`,
      { c: codigoClean, n: nombreClean, d: descripcion || null,
        cr: { type: sql.Int, value: creditosVal },
        h:  { type: sql.Int, value: horasVal },
        a:  (activo === undefined ? 1 : (activo ? 1 : 0)),
        id: { type: sql.Int, value: id } }
    );
    if (!updated.length) return res.status(404).json({ ok: false, error: 'Curso no encontrado' });

    await query(
      `DELETE FROM plan_estudio_curso
       WHERE id_curso=@c AND id_plan<>@p`,
      {
        c: { type: sql.Int, value: id },
        p: { type: sql.Int, value: idPlanVal }
      }
    );

    await query(
      `IF NOT EXISTS(SELECT 1 FROM plan_estudio_curso WHERE id_curso=@c AND id_plan=@p)
         INSERT INTO plan_estudio_curso(id_plan,id_curso,ciclo,obligatorio)
         VALUES(@p,@c,NULL,1)`,
      {
        c: { type: sql.Int, value: id },
        p: { type: sql.Int, value: idPlanVal }
      }
    );

    res.json({ ok: true, mensaje: 'Curso actualizado' });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un curso con ese codigo o ya esta asignado en otro plan' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   PERIODOS ACADEMICOS
ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

router.get('/periodos', async (req, res) => {
  try {
    const { buscar = '', estado = '', tipo = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = {};
    if (buscar) {
      where += ' AND (p.codigo LIKE @buscar OR p.nombre LIKE @buscar)';
      params.buscar = `%${buscar}%`;
    }
    if (tipo) {
      const tipoSql = normalizarTipoPeriodo(tipo);
      if (!tipoSql) return res.status(400).json({ ok: false, error: 'Tipo de periodo invalido' });
      where += ' AND p.tipo_periodo = @tipo';
      params.tipo = tipoSql;
    }
    if (estado === '1' || String(estado).toLowerCase() === 'activo') {
      where += ' AND p.activo = 1';
    } else if (estado === '0' || String(estado).toLowerCase() === 'inactivo') {
      where += ' AND p.activo = 0';
    }

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
      ${where}
      GROUP BY p.id_periodo,p.codigo,p.nombre,p.tipo_periodo,p.activo,
               p.fecha_inicio,p.fecha_fin,p.fecha_inicio_matricula,p.fecha_fin_matricula,p.limite_creditos
      ORDER BY p.fecha_inicio DESC
    `, params);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/periodos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    const row = await queryOne(
      `SELECT id_periodo, codigo, nombre, tipo_periodo, activo,
              CONVERT(varchar,fecha_inicio,23)            AS fecha_inicio,
              CONVERT(varchar,fecha_fin,23)               AS fecha_fin,
              CONVERT(varchar,fecha_inicio_matricula,23)  AS fecha_inicio_matricula,
              CONVERT(varchar,fecha_fin_matricula,23)     AS fecha_fin_matricula,
              limite_creditos
       FROM periodo_academico
       WHERE id_periodo = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!row) return res.status(404).json({ ok: false, error: 'Periodo no encontrado' });
    return res.json({ ok: true, data: row });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/periodos', async (req, res) => {
  try {
    const { codigo, nombre, tipo_periodo, fecha_inicio, fecha_fin,
            fecha_inicio_matricula, fecha_fin_matricula, limite_creditos, activo = 1 } = req.body;
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const tipoSql = normalizarTipoPeriodo(tipo_periodo);
    const inicio = String(fecha_inicio || '').trim();
    const fin = String(fecha_fin || '').trim();
    const inicioMat = String(fecha_inicio_matricula || '').trim();
    const finMat = String(fecha_fin_matricula || '').trim();
    const limite = parseInt(limite_creditos, 10);

    if (!codigoClean || !nombreClean || !tipoSql || !inicio || !fin || !inicioMat || !finMat || !Number.isInteger(limite) || limite <= 0) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }
    if (fin <= inicio) return res.status(400).json({ ok: false, error: 'La fecha fin debe ser mayor a la fecha inicio' });
    if (finMat < inicioMat) return res.status(400).json({ ok: false, error: 'La fecha fin de matricula no puede ser menor al inicio' });

    const r = await query(
      `INSERT INTO periodo_academico(codigo,nombre,tipo_periodo,fecha_inicio,fecha_fin,
         fecha_inicio_matricula,fecha_fin_matricula,limite_creditos,activo)
       OUTPUT INSERTED.id_periodo
       VALUES(@c,@n,@tp,@fi,@ff,@fim,@ffm,@lc,@a)`,
      { c: codigoClean, n: nombreClean, tp: tipoSql, fi: inicio, ff: fin,
        fim: inicioMat, ffm: finMat,
        lc: { type: sql.Int, value: limite },
        a: activo ? 1 : 0 }
    );
    res.status(201).json({ ok: true, id: r[0].id_periodo });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un periodo con ese codigo' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/periodos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { codigo, nombre, tipo_periodo, fecha_inicio, fecha_fin,
            fecha_inicio_matricula, fecha_fin_matricula, limite_creditos, activo } = req.body;
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const tipoSql = normalizarTipoPeriodo(tipo_periodo);
    const inicio = String(fecha_inicio || '').trim();
    const fin = String(fecha_fin || '').trim();
    const inicioMat = String(fecha_inicio_matricula || '').trim();
    const finMat = String(fecha_fin_matricula || '').trim();
    const limite = parseInt(limite_creditos, 10);

    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    if (!codigoClean || !nombreClean || !tipoSql || !inicio || !fin || !inicioMat || !finMat || !Number.isInteger(limite) || limite <= 0) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }
    if (fin <= inicio) return res.status(400).json({ ok: false, error: 'La fecha fin debe ser mayor a la fecha inicio' });
    if (finMat < inicioMat) return res.status(400).json({ ok: false, error: 'La fecha fin de matricula no puede ser menor al inicio' });

    const updated = await query(
      `UPDATE periodo_academico
       SET codigo=@c,nombre=@n,tipo_periodo=@tp,fecha_inicio=@fi,fecha_fin=@ff,
           fecha_inicio_matricula=@fim,fecha_fin_matricula=@ffm,limite_creditos=@lc,activo=@a
       OUTPUT INSERTED.id_periodo
       WHERE id_periodo=@id`,
      {
        c: codigoClean,
        n: nombreClean,
        tp: tipoSql,
        fi: inicio,
        ff: fin,
        fim: inicioMat,
        ffm: finMat,
        lc: { type: sql.Int, value: limite },
        a: (activo === undefined ? 1 : (activo ? 1 : 0)),
        id: { type: sql.Int, value: id }
      }
    );
    if (!updated.length) return res.status(404).json({ ok: false, error: 'Periodo no encontrado' });
    res.json({ ok: true, mensaje: 'Periodo actualizado' });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un periodo con ese codigo' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   AULAS
ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

router.get('/aulas', async (req, res) => {
  try {
    const { buscar = '', edificio = '', estado = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = {};
    if (buscar) {
      where += ' AND (a.codigo LIKE @b OR a.nombre LIKE @b OR ISNULL(a.edificio, \'\') LIKE @b)';
      params.b = `%${buscar}%`;
    }
    if (edificio) {
      where += ' AND a.edificio = @ed';
      params.ed = edificio;
    }
    if (estado === '1' || String(estado).toLowerCase() === 'activa') where += ' AND a.activa = 1';
    if (estado === '0' || String(estado).toLowerCase() === 'inactiva') where += ' AND a.activa = 0';

    const rows = await query(`
      SELECT a.id_aula, a.codigo, a.nombre, a.edificio, a.capacidad, a.activa,
             COUNT(s.id_seccion) AS secciones_activas
      FROM aula a
      LEFT JOIN seccion s ON s.id_aula = a.id_aula AND s.estado='Abierta'
      ${where}
      GROUP BY a.id_aula,a.codigo,a.nombre,a.edificio,a.capacidad,a.activa
      ORDER BY a.edificio, a.codigo
    `, params);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/aulas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    const aula = await queryOne(
      `SELECT id_aula, codigo, nombre, edificio, capacidad, activa
       FROM aula
       WHERE id_aula=@id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!aula) return res.status(404).json({ ok: false, error: 'Aula no encontrada' });
    return res.json({ ok: true, data: aula });
  } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/aulas', async (req, res) => {
  try {
    const { codigo, nombre, edificio, capacidad, activa = 1 } = req.body;
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const cap = parseInt(capacidad, 10);
    if (!codigoClean || !nombreClean || !Number.isInteger(cap) || cap <= 0)
      return res.status(400).json({ ok: false, error: 'codigo, nombre y capacidad son requeridos' });
    const r = await query(
      `INSERT INTO aula(codigo,nombre,edificio,capacidad,activa) OUTPUT INSERTED.id_aula VALUES(@c,@n,@e,@cap,@a)`,
      { c: codigoClean, n: nombreClean, e: edificio || null,
        cap: { type: sql.Int, value: cap }, a: activa ? 1 : 0 }
    );
    res.status(201).json({ ok: true, id: r[0].id_aula });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un aula con ese codigo' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/aulas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { codigo, nombre, edificio, capacidad, activa } = req.body;
    const codigoClean = String(codigo || '').trim();
    const nombreClean = String(nombre || '').trim();
    const cap = parseInt(capacidad, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    if (!codigoClean || !nombreClean || !Number.isInteger(cap) || cap <= 0) {
      return res.status(400).json({ ok: false, error: 'codigo, nombre y capacidad son requeridos' });
    }

    const updated = await query(
      `UPDATE aula SET codigo=@c,nombre=@n,edificio=@e,capacidad=@cap,activa=@a
       OUTPUT INSERTED.id_aula
       WHERE id_aula=@id`,
      { c: codigoClean, n: nombreClean, e: edificio || null,
        cap: { type: sql.Int, value: cap },
        a: (activa === undefined ? 1 : (activa ? 1 : 0)),
        id: { type: sql.Int, value: id } }
    );
    if (!updated.length) return res.status(404).json({ ok: false, error: 'Aula no encontrada' });
    res.json({ ok: true, mensaje: 'Aula actualizada' });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un aula con ese codigo' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â
   SECCIONES
ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */

router.get('/secciones', async (req, res) => {
  try {
    const { periodo = '', estado = '', aula = '', buscar = '' } = req.query;
    let where = 'WHERE 1=1';
    const params = {};
    if (periodo) {
      const idPeriodo = parseInt(periodo, 10);
      if (!Number.isInteger(idPeriodo)) return res.status(400).json({ ok: false, error: 'Periodo invalido' });
      where += ' AND s.id_periodo=@per';
      params.per = { type: sql.Int, value: idPeriodo };
    }
    if (estado) {
      where += ' AND s.estado = @est';
      params.est = estado;
    }
    if (aula) {
      const idAula = parseInt(aula, 10);
      if (!Number.isInteger(idAula)) return res.status(400).json({ ok: false, error: 'Aula invalida' });
      where += ' AND s.id_aula = @aula';
      params.aula = { type: sql.Int, value: idAula };
    }
    if (buscar) {
      where += ` AND (
        s.codigo_seccion LIKE @b OR c.codigo LIKE @b OR c.nombre LIKE @b
        OR (u.nombre + ' ' + u.apellido) LIKE @b
        OR ISNULL(a.codigo, '') LIKE @b OR ISNULL(a.nombre, '') LIKE @b
      )`;
      params.b = `%${buscar}%`;
    }

    const rows = await query(`
      SELECT s.id_seccion, s.id_curso, s.id_periodo, s.id_docente_usuario, s.id_aula,
             s.codigo_seccion, s.cupo_maximo, s.cupo_disponible, s.estado,
             c.codigo AS curso_codigo, c.nombre AS curso_nombre, c.creditos,
             LTRIM(RTRIM(ISNULL(u.nombre, '') + ' ' + ISNULL(u.apellido, ''))) AS docente,
             a.codigo AS aula_codigo, a.nombre AS aula_nombre, a.edificio,
             p.nombre AS periodo_nombre,
             (SELECT STRING_AGG(hs.dia_semana+' '+CONVERT(varchar,hs.hora_inicio,108)+'-'+CONVERT(varchar,hs.hora_fin,108),', ')
              FROM horario_seccion hs WHERE hs.id_seccion=s.id_seccion) AS horario
      FROM seccion s
      INNER JOIN curso c ON c.id_curso = s.id_curso
      INNER JOIN periodo_academico p ON p.id_periodo = s.id_periodo
      LEFT JOIN usuario u ON u.id_usuario = s.id_docente_usuario
      LEFT JOIN aula a ON a.id_aula = s.id_aula
      ${where}
      ORDER BY p.fecha_inicio DESC, c.codigo, s.codigo_seccion
    `, params);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/secciones/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    const row = await queryOne(
      `SELECT s.id_seccion, s.id_curso, s.id_periodo, s.id_docente_usuario, s.id_aula,
              s.codigo_seccion, s.cupo_maximo, s.cupo_disponible, s.estado,
              (SELECT TOP 1 hs.dia_semana FROM horario_seccion hs WHERE hs.id_seccion = s.id_seccion ORDER BY hs.id_horario) AS dia_semana,
              (SELECT TOP 1 CONVERT(varchar, hs.hora_inicio, 8) FROM horario_seccion hs WHERE hs.id_seccion = s.id_seccion ORDER BY hs.id_horario) AS hora_inicio,
              (SELECT TOP 1 CONVERT(varchar, hs.hora_fin, 8) FROM horario_seccion hs WHERE hs.id_seccion = s.id_seccion ORDER BY hs.id_horario) AS hora_fin
       FROM seccion s
       WHERE s.id_seccion = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!row) return res.status(404).json({ ok: false, error: 'Seccion no encontrada' });
    return res.json({ ok: true, data: row });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

async function validarDocente(idDocente) {
  if (!idDocente) return true;
  const row = await queryOne(
    `SELECT u.id_usuario
     FROM usuario u
     INNER JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = @id AND LOWER(r.nombre) LIKE '%docente%'`,
    { id: { type: sql.Int, value: idDocente } }
  );
  return !!row;
}

async function capacidadAula(idAula) {
  if (!idAula) return null;
  const row = await queryOne(
    `SELECT id_aula, capacidad FROM aula WHERE id_aula = @id AND activa = 1`,
    { id: { type: sql.Int, value: idAula } }
  );
  return row || null;
}

async function validarDisponibilidadHorario({ idPeriodo, idDocente, idAula, diaSemana, horaInicio, horaFin, excluirSeccionId = null }) {
  if (!diaSemana || !horaInicio || !horaFin) return null;

  if (idDocente) {
    const conflictoDocente = await queryOne(
      `SELECT TOP 1 s.id_seccion, s.codigo_seccion,
              c.codigo AS curso_codigo, c.nombre AS curso_nombre,
              CONVERT(varchar,hs.hora_inicio,108) AS hi,
              CONVERT(varchar,hs.hora_fin,108)    AS hf
       FROM seccion s
       INNER JOIN curso c ON c.id_curso = s.id_curso
       INNER JOIN horario_seccion hs ON hs.id_seccion = s.id_seccion
       WHERE s.id_periodo = @per
         AND s.id_docente_usuario = @doc
         AND s.estado <> 'Cancelada'
         AND hs.dia_semana = @dia
         AND hs.hora_inicio < @hf
         AND hs.hora_fin > @hi
         AND (@excluir IS NULL OR s.id_seccion <> @excluir)
       ORDER BY hs.hora_inicio`,
      {
        per: { type: sql.Int, value: idPeriodo },
        doc: { type: sql.Int, value: idDocente },
        dia: diaSemana,
        hi: horaInicio,
        hf: horaFin,
        excluir: excluirSeccionId ? { type: sql.Int, value: excluirSeccionId } : null
      }
    );
    if (conflictoDocente) {
      return {
        tipo: 'docente',
        mensaje: `El docente ya tiene una sesion en ese horario (${conflictoDocente.curso_codigo} ${conflictoDocente.codigo_seccion}, ${conflictoDocente.hi}-${conflictoDocente.hf})`
      };
    }
  }

  const conflictoAula = await queryOne(
    `SELECT TOP 1 s.id_seccion, s.codigo_seccion,
            c.codigo AS curso_codigo, c.nombre AS curso_nombre,
            CONVERT(varchar,hs.hora_inicio,108) AS hi,
            CONVERT(varchar,hs.hora_fin,108)    AS hf
     FROM seccion s
     INNER JOIN curso c ON c.id_curso = s.id_curso
     INNER JOIN horario_seccion hs ON hs.id_seccion = s.id_seccion
     WHERE s.id_periodo = @per
       AND s.id_aula = @aula
       AND s.estado <> 'Cancelada'
       AND hs.dia_semana = @dia
       AND hs.hora_inicio < @hf
       AND hs.hora_fin > @hi
       AND (@excluir IS NULL OR s.id_seccion <> @excluir)
     ORDER BY hs.hora_inicio`,
    {
      per: { type: sql.Int, value: idPeriodo },
      aula: { type: sql.Int, value: idAula },
      dia: diaSemana,
      hi: horaInicio,
      hf: horaFin,
      excluir: excluirSeccionId ? { type: sql.Int, value: excluirSeccionId } : null
    }
  );
  if (conflictoAula) {
    return {
      tipo: 'aula',
      mensaje: `El aula ya esta ocupada en ese horario (${conflictoAula.curso_codigo} ${conflictoAula.codigo_seccion}, ${conflictoAula.hi}-${conflictoAula.hf})`
    };
  }

  return null;
}

router.post('/secciones', async (req, res) => {
  try {
    const { id_curso, id_periodo, codigo_seccion, id_docente_usuario,
            id_aula, cupo_maximo, estado = 'Abierta', dia_semana, hora_inicio, hora_fin } = req.body;
    const idCurso = parseInt(id_curso, 10);
    const idPeriodo = parseInt(id_periodo, 10);
    const idDocente = id_docente_usuario ? parseInt(id_docente_usuario, 10) : null;
    const idAula = id_aula ? parseInt(id_aula, 10) : null;
    const codigo = String(codigo_seccion || '').trim();
    if (!Number.isInteger(idCurso) || !Number.isInteger(idPeriodo) || !codigo || !Number.isInteger(idAula)) {
      return res.status(400).json({ ok: false, error: 'Curso, periodo, seccion y aula son requeridos' });
    }
    if (idDocente && !Number.isInteger(idDocente)) {
      return res.status(400).json({ ok: false, error: 'Docente invalido' });
    }
    const aula = await capacidadAula(idAula);
    if (!aula) return res.status(400).json({ ok: false, error: 'Aula invalida o inactiva' });
    if (!(await validarDocente(idDocente))) {
      return res.status(400).json({ ok: false, error: 'El usuario seleccionado no es docente' });
    }
    const cupoSolicitado = cupo_maximo === undefined || cupo_maximo === null || String(cupo_maximo).trim() === ''
      ? aula.capacidad
      : parseInt(cupo_maximo, 10);
    if (!Number.isInteger(cupoSolicitado) || cupoSolicitado <= 0) {
      return res.status(400).json({ ok: false, error: 'Cupo maximo invalido' });
    }
    if (cupoSolicitado > aula.capacidad) {
      return res.status(400).json({ ok: false, error: `El cupo maximo no puede superar la capacidad del aula (${aula.capacidad})` });
    }
    if (dia_semana && hora_inicio && hora_fin) {
      const conflicto = await validarDisponibilidadHorario({
        idPeriodo,
        idDocente,
        idAula,
        diaSemana: dia_semana,
        horaInicio: hora_inicio,
        horaFin: hora_fin
      });
      if (conflicto) {
        return res.status(409).json({ ok: false, error: conflicto.mensaje });
      }
    }

    const r = await query(
      `INSERT INTO seccion(id_curso,id_periodo,codigo_seccion,id_docente_usuario,id_aula,
         cupo_maximo,cupo_disponible,modalidad,estado)
       OUTPUT INSERTED.id_seccion
       VALUES(@ic,@ip,@cs,@doc,@aula,@cm,@cm,@mod,@est)`,
      {
        ic: { type: sql.Int, value: idCurso },
        ip: { type: sql.Int, value: idPeriodo },
        cs: codigo,
        doc: { type: sql.Int, value: idDocente },
        aula: { type: sql.Int, value: idAula },
        cm: { type: sql.Int, value: cupoSolicitado },
        mod: null,
        est: estado || 'Abierta'
      }
    );
    const idSeccion = r[0].id_seccion;

    if (dia_semana && hora_inicio && hora_fin) {
      await query(
        `INSERT INTO horario_seccion(id_seccion,dia_semana,hora_inicio,hora_fin)
         VALUES(@id,@dia,@hi,@hf)`,
        {
          id: { type: sql.Int, value: idSeccion },
          dia: dia_semana,
          hi: hora_inicio,
          hf: hora_fin
        }
      );
    }

    res.status(201).json({ ok: true, id: idSeccion });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe una seccion con ese codigo para el curso y periodo seleccionados' });
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/secciones/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { id_curso, id_periodo, codigo_seccion, id_docente_usuario,
            id_aula, cupo_maximo, estado = 'Abierta', dia_semana, hora_inicio, hora_fin } = req.body;
    const idCurso = parseInt(id_curso, 10);
    const idPeriodo = parseInt(id_periodo, 10);
    const idDocente = id_docente_usuario ? parseInt(id_docente_usuario, 10) : null;
    const idAula = id_aula ? parseInt(id_aula, 10) : null;
    const codigo = String(codigo_seccion || '').trim();
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });
    if (!Number.isInteger(idCurso) || !Number.isInteger(idPeriodo) || !codigo || !Number.isInteger(idAula)) {
      return res.status(400).json({ ok: false, error: 'Curso, periodo, seccion y aula son requeridos' });
    }
    if (idDocente && !Number.isInteger(idDocente)) {
      return res.status(400).json({ ok: false, error: 'Docente invalido' });
    }
    const aula = await capacidadAula(idAula);
    if (!aula) return res.status(400).json({ ok: false, error: 'Aula invalida o inactiva' });
    if (!(await validarDocente(idDocente))) {
      return res.status(400).json({ ok: false, error: 'El usuario seleccionado no es docente' });
    }

    const actual = await queryOne(
      `SELECT cupo_maximo, cupo_disponible
       FROM seccion
       WHERE id_seccion = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!actual) return res.status(404).json({ ok: false, error: 'Seccion no encontrada' });

    const inscritos = actual.cupo_maximo - actual.cupo_disponible;
    const cupoSolicitado = cupo_maximo === undefined || cupo_maximo === null || String(cupo_maximo).trim() === ''
      ? aula.capacidad
      : parseInt(cupo_maximo, 10);
    if (!Number.isInteger(cupoSolicitado) || cupoSolicitado <= 0) {
      return res.status(400).json({ ok: false, error: 'Cupo maximo invalido' });
    }
    if (cupoSolicitado > aula.capacidad) {
      return res.status(400).json({ ok: false, error: `El cupo maximo no puede superar la capacidad del aula (${aula.capacidad})` });
    }
    if (inscritos > cupoSolicitado) {
      return res.status(400).json({ ok: false, error: `No se puede reducir cupo por debajo de matriculados actuales (${inscritos})` });
    }
    const nuevoDisponible = cupoSolicitado - inscritos;
    if (dia_semana && hora_inicio && hora_fin) {
      const conflicto = await validarDisponibilidadHorario({
        idPeriodo,
        idDocente,
        idAula,
        diaSemana: dia_semana,
        horaInicio: hora_inicio,
        horaFin: hora_fin,
        excluirSeccionId: id
      });
      if (conflicto) {
        return res.status(409).json({ ok: false, error: conflicto.mensaje });
      }
    }

    const updated = await query(
      `UPDATE seccion
       SET id_curso=@ic,id_periodo=@ip,codigo_seccion=@cs,id_docente_usuario=@doc,id_aula=@aula,
           cupo_maximo=@cm,cupo_disponible=@cd,modalidad=NULL,estado=@est
       OUTPUT INSERTED.id_seccion
       WHERE id_seccion=@id`,
      {
        ic: { type: sql.Int, value: idCurso },
        ip: { type: sql.Int, value: idPeriodo },
        cs: codigo,
        doc: { type: sql.Int, value: idDocente },
        aula: { type: sql.Int, value: idAula },
        cm: { type: sql.Int, value: cupoSolicitado },
        cd: { type: sql.Int, value: nuevoDisponible },
        est: estado || 'Abierta',
        id: { type: sql.Int, value: id }
      }
    );
    if (!updated.length) return res.status(404).json({ ok: false, error: 'Seccion no encontrada' });

    await query('DELETE FROM horario_seccion WHERE id_seccion=@id', { id: { type: sql.Int, value: id } });
    if (dia_semana && hora_inicio && hora_fin) {
      await query(
        `INSERT INTO horario_seccion(id_seccion,dia_semana,hora_inicio,hora_fin)
         VALUES(@id,@dia,@hi,@hf)`,
        { id: { type: sql.Int, value: id }, dia: dia_semana, hi: hora_inicio, hf: hora_fin }
      );
    }

    res.json({ ok: true, mensaje: 'Seccion actualizada' });
  } catch (e) {
    if (e && (e.number === 2627 || e.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Ya existe una seccion con ese codigo para el curso y periodo seleccionados' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/secciones/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID invalido' });

    await query('DELETE FROM horario_seccion WHERE id_seccion=@id', { id: { type: sql.Int, value: id } });
    const deleted = await query(
      `DELETE FROM seccion
       OUTPUT DELETED.id_seccion
       WHERE id_seccion=@id`,
      { id: { type: sql.Int, value: id } }
    );
    if (deleted.length) return res.json({ ok: true, mensaje: 'Seccion eliminada' });

    return res.status(404).json({ ok: false, error: 'Seccion no encontrada' });
  } catch (e) {
    if (e && e.number === 547) {
      const id = parseInt(req.params.id, 10);
      await query(
        `UPDATE seccion SET estado='Cancelada' WHERE id_seccion=@id`,
        { id: { type: sql.Int, value: id } }
      );
      return res.json({ ok: true, mensaje: 'Seccion con matriculas: se marco como Cancelada' });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;

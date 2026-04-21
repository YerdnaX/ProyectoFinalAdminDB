/**
 * routes/api/enrollment.js
 * APIs para el proceso de matricula
 */
const express = require('express');
const router  = express.Router();
const { sql, query, queryOne, getPool } = require('../../config/db');

function getSessionStudentId(req) {
  const raw = req.session?.user?.id_estudiante;
  const id = parseInt(raw, 10);
  return Number.isInteger(id) ? id : null;
}

function isStudentSession(req) {
  return req.session?.user?.rol === 'Estudiante';
}

/* GET /api/enrollment/secciones — buscar secciones disponibles */
router.get('/secciones', async (req, res) => {
  try {
    const { buscar = '', modalidad = '', periodo } = req.query;
    // Preferir sesión sobre query param para el id del estudiante
    const idEstudiante = req.session?.user?.id_estudiante || (req.query.id_estudiante ? parseInt(req.query.id_estudiante) : null);

    // Periodo activo
    let idPeriodo = periodo ? parseInt(periodo) : null;
    let nombrePeriodo = null;
    if (!idPeriodo) {
      const per = await queryOne(`SELECT TOP 1 id_periodo, nombre FROM periodo_academico WHERE activo=1 ORDER BY fecha_inicio DESC`);
      if (per) { idPeriodo = per.id_periodo; nombrePeriodo = per.nombre; }
    } else {
      const per = await queryOne(`SELECT nombre FROM periodo_academico WHERE id_periodo=@id`, { id: { type: sql.Int, value: idPeriodo } });
      if (per) nombrePeriodo = per.nombre;
    }
    if (!idPeriodo) return res.json({ ok: true, data: [], mensaje: 'No hay periodo activo' });

    // Obtener IDs de cursos del plan del estudiante
    let cursosDelPlan = null;
    let debugInfo = { idEstudiante, idPrograma: null, cursosEnPlan: 0, planEncontrado: false };

    if (idEstudiante) {
      const estInfo = await queryOne(
        `SELECT e.id_programa, pa.nombre AS nombre_programa
         FROM estudiante e
         INNER JOIN programa_academico pa ON pa.id_programa = e.id_programa
         WHERE e.id_estudiante = @id`,
        { id: { type: sql.Int, value: idEstudiante } }
      ).catch(() => null);

      if (estInfo) {
        debugInfo.idPrograma = estInfo.id_programa;
        debugInfo.nombrePrograma = estInfo.nombre_programa;

        const planCursos = await query(
          `SELECT pec.id_curso, c.codigo, c.nombre
           FROM plan_estudio_curso pec
           INNER JOIN plan_estudio pe ON pe.id_plan = pec.id_plan
           INNER JOIN curso c ON c.id_curso = pec.id_curso
           WHERE pe.id_programa = @prog`,
          { prog: { type: sql.Int, value: estInfo.id_programa } }
        ).catch(() => []);

        debugInfo.planEncontrado = true;
        debugInfo.cursosEnPlan = planCursos.length;
        debugInfo.cursosList = planCursos.map(r => `${r.codigo} - ${r.nombre}`);

        if (planCursos.length > 0) {
          cursosDelPlan = planCursos.map(r => r.id_curso);
        }
      }
    }

    console.log('[secciones] debug:', JSON.stringify(debugInfo));

    let where = `WHERE s.id_periodo=@per AND s.estado='Abierta'`;
    const params = { per: { type: sql.Int, value: idPeriodo } };

    if (buscar) { where += ' AND (c.nombre LIKE @b OR c.codigo LIKE @b)'; params.b = `%${buscar}%`; }
    if (modalidad && modalidad !== 'Todas') { where += ' AND s.modalidad=@mod'; params.mod = modalidad; }
    if (cursosDelPlan) { where += ` AND c.id_curso IN (${cursosDelPlan.join(',')})`; }

    const rows = await query(`
      SELECT s.id_seccion, s.codigo_seccion, s.cupo_maximo, s.cupo_disponible, s.modalidad, s.estado,
             c.id_curso, c.codigo AS curso_codigo, c.nombre AS curso_nombre, c.creditos,
             u.nombre + ' ' + u.apellido AS docente,
             a.nombre AS aula, a.edificio,
             (SELECT STRING_AGG(hs.dia_semana+' '+CONVERT(varchar,hs.hora_inicio,108)+'-'+CONVERT(varchar,hs.hora_fin,108),', ')
              FROM horario_seccion hs WHERE hs.id_seccion=s.id_seccion) AS horario,
             (SELECT STRING_AGG(cp.codigo, ', ')
              FROM curso_prerrequisito pr
              INNER JOIN curso cp ON cp.id_curso=pr.id_curso_prerrequisito
              WHERE pr.id_curso=c.id_curso) AS prerrequisitos
      FROM seccion s
      INNER JOIN curso c ON c.id_curso = s.id_curso
      LEFT JOIN usuario u ON u.id_usuario = s.id_docente_usuario
      LEFT JOIN aula a ON a.id_aula = s.id_aula
      ${where}
      ORDER BY c.codigo, s.codigo_seccion
    `, params);

    res.json({ ok: true, data: rows, periodo: idPeriodo, nombre_periodo: nombrePeriodo, _debug: debugInfo });
  } catch (e) {
    console.error('[secciones] Error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* GET /api/enrollment/lista — lista admin con metricas
   DEBE estar antes de GET /:idEstudiante */
router.get('/lista', async (req, res) => {
  const { page = 1, limit = 15, periodo = '', estado = '', buscar = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = 'WHERE 1=1';
  const params = {};
  if (periodo) { where += ' AND m.id_periodo=@per'; params.per = { type: sql.Int, value: parseInt(periodo) }; }
  if (estado)  { where += ' AND m.estado=@est'; params.est = estado; }
  if (buscar)  { where += ' AND (u.nombre LIKE @b OR u.apellido LIKE @b OR e.carne LIKE @b OR m.comprobante LIKE @b)'; params.b = `%${buscar}%`; }

  try {
    const rows = await query(`
      SELECT m.id_matricula, m.estado, m.total_creditos, m.total_monto, m.confirmada, m.comprobante,
             CONVERT(varchar,m.fecha_matricula,103) AS fecha,
             e.carne, u.nombre + ' ' + u.apellido AS nombre_estudiante,
             p.nombre AS periodo,
             (SELECT COUNT(*) FROM detalle_matricula WHERE id_matricula=m.id_matricula) AS num_cursos
      FROM matricula m
      INNER JOIN estudiante e ON e.id_estudiante = m.id_estudiante
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
      ${where}
      ORDER BY m.fecha_matricula DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `, params);

    const total = await queryOne(`SELECT COUNT(*) AS total FROM matricula m
      INNER JOIN estudiante e ON e.id_estudiante=m.id_estudiante
      INNER JOIN usuario u ON u.id_usuario=e.id_usuario
      ${where}`, params);

    const metricas = await queryOne(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN m.estado='Confirmada' THEN 1 ELSE 0 END) AS confirmadas,
             SUM(CASE WHEN m.estado='En proceso' OR m.estado='Pendiente' THEN 1 ELSE 0 END) AS en_proceso,
             SUM(CASE WHEN m.estado='Cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM matricula m
    `, {}).catch(() => null);

    res.json({ ok: true, matriculas: rows.map(r => ({ ...r, monto: r.total_monto, creditos: r.total_creditos })), total: total.total, metricas });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET /api/enrollment/:idEstudiante — matricula activa del estudiante */
router.get('/:idEstudiante', async (req, res) => {
  try {
    const id = parseInt(req.params.idEstudiante);

    const periodo = await queryOne(`SELECT TOP 1 id_periodo, nombre FROM periodo_academico WHERE activo=1 ORDER BY fecha_inicio DESC`);
    if (!periodo) return res.json({ ok: true, data: null, mensaje: 'Sin periodo activo' });

    const matricula = await queryOne(`
      SELECT m.id_matricula, m.estado, m.total_creditos, m.total_monto,
             m.confirmada, m.comprobante,
             CONVERT(varchar,m.fecha_matricula,103) AS fecha_matricula,
             p.nombre AS periodo, p.limite_creditos
      FROM matricula m
      INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
      WHERE m.id_estudiante=@id AND m.id_periodo=@per
    `, { id: { type: sql.Int, value: id }, per: { type: sql.Int, value: periodo.id_periodo } });

    if (!matricula) return res.json({ ok: true, data: null, periodo: periodo.nombre });

    const detalle = await query(`
      SELECT dm.id_detalle_matricula, dm.costo, dm.estado,
             s.id_seccion, s.codigo_seccion, s.modalidad,
             c.codigo AS curso_codigo, c.nombre AS curso_nombre, c.creditos,
             u.nombre + ' ' + u.apellido AS docente, a.nombre AS aula,
             (SELECT STRING_AGG(hs.dia_semana+' '+CONVERT(varchar,hs.hora_inicio,108)+'-'+CONVERT(varchar,hs.hora_fin,108),', ')
              FROM horario_seccion hs WHERE hs.id_seccion=s.id_seccion) AS horario
      FROM detalle_matricula dm
      INNER JOIN seccion s ON s.id_seccion = dm.id_seccion
      INNER JOIN curso c ON c.id_curso = s.id_curso
      LEFT JOIN usuario u ON u.id_usuario = s.id_docente_usuario
      LEFT JOIN aula a ON a.id_aula = s.id_aula
      WHERE dm.id_matricula = @mid
    `, { mid: { type: sql.Int, value: matricula.id_matricula } });

    res.json({ ok: true, data: { ...matricula, detalle } });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* POST /api/enrollment — agregar seccion a matricula */
router.post('/', async (req, res) => {
  try {
    const { id_estudiante, id_seccion } = req.body;
    if (!id_seccion)
      return res.status(400).json({ ok: false, error: 'Falta id_seccion' });

    const idEst = isStudentSession(req) ? getSessionStudentId(req) : parseInt(id_estudiante, 10);
    const idSec = parseInt(id_seccion);
    if (!Number.isInteger(idEst)) {
      return res.status(400).json({ ok: false, error: 'No se pudo identificar el estudiante de la sesion' });
    }
    if (!Number.isInteger(idSec)) {
      return res.status(400).json({ ok: false, error: 'Seccion invalida' });
    }

    // Verificar estudiante sin bloqueos
    const est = await queryOne(
      `SELECT bloqueado_financiero, bloqueado_academico FROM estudiante WHERE id_estudiante=@id`,
      { id: { type: sql.Int, value: idEst } }
    );
    if (!est) return res.status(404).json({ ok: false, error: 'Estudiante no encontrado' });
    if (est.bloqueado_financiero) return res.status(400).json({ ok: false, error: 'Estudiante con bloqueo financiero' });
    if (est.bloqueado_academico)  return res.status(400).json({ ok: false, error: 'Estudiante con bloqueo academico' });

    // Obtener seccion y periodo
    const sec = await queryOne(
      `SELECT s.id_seccion, s.id_periodo, s.cupo_disponible, s.cupo_maximo, s.id_curso,
              c.creditos
       FROM seccion s INNER JOIN curso c ON c.id_curso=s.id_curso
       WHERE s.id_seccion=@id AND s.estado='Abierta'`,
      { id: { type: sql.Int, value: idSec } }
    );
    if (!sec) return res.status(404).json({ ok: false, error: 'Seccion no encontrada o cerrada' });
    if (sec.cupo_disponible <= 0) return res.status(400).json({ ok: false, error: 'Sin cupos disponibles' });

    // Regla: no permitir matricular un curso ya matriculado o ya finalizado/aprobado
    const cursoPrevio = await queryOne(
      `SELECT TOP 1
          s2.id_curso,
          dm2.estado AS estado_detalle,
          m2.estado  AS estado_matricula,
          m2.confirmada,
          CONVERT(varchar,m2.fecha_matricula,23) AS fecha_matricula
       FROM detalle_matricula dm2
       INNER JOIN matricula m2 ON m2.id_matricula = dm2.id_matricula
       INNER JOIN seccion s2   ON s2.id_seccion   = dm2.id_seccion
       WHERE m2.id_estudiante = @est
         AND s2.id_curso      = @cur
         AND m2.estado       <> 'Cancelada'
         AND dm2.estado IN ('Matriculada','Reservada')
       ORDER BY m2.confirmada DESC, m2.fecha_matricula DESC`,
      {
        est: { type: sql.Int, value: idEst },
        cur: { type: sql.Int, value: sec.id_curso }
      }
    ).catch(() => null);

    if (cursoPrevio) {
      const yaFinalizado = Number(cursoPrevio.confirmada) === 1
        && cursoPrevio.estado_matricula === 'Confirmada'
        && cursoPrevio.estado_detalle === 'Matriculada';

      if (yaFinalizado) {
        return res.status(409).json({
          ok: false,
          error: 'No puedes matricular un curso que ya aprobaste/finalizaste'
        });
      }

      return res.status(409).json({
        ok: false,
        error: 'No puedes matricular un curso que ya tienes matriculado'
      });
    }

    // RF-07: Verificar prerrequisitos
    const prereqs = await query(
      `SELECT cp.id_curso_prerrequisito, c.codigo AS codigo_prereq, c.nombre AS nombre_prereq
       FROM curso_prerrequisito cp
       INNER JOIN curso c ON c.id_curso = cp.id_curso_prerrequisito
       WHERE cp.id_curso = @idc`,
      { idc: { type: sql.Int, value: sec.id_curso } }
    );
    if (prereqs.length > 0) {
      const cumplidos = await query(
        `SELECT DISTINCT s2.id_curso
         FROM detalle_matricula dm2
         INNER JOIN matricula m2 ON m2.id_matricula = dm2.id_matricula
           AND m2.id_estudiante = @est
           AND m2.confirmada = 1
           AND m2.estado = 'Confirmada'
         INNER JOIN seccion s2 ON s2.id_seccion = dm2.id_seccion
         WHERE s2.id_curso IN (${prereqs.map(p => p.id_curso_prerrequisito).join(',')})
           AND dm2.estado = 'Matriculada'`,
        { est: { type: sql.Int, value: idEst } }
      ).catch(() => []);
      if (cumplidos.length < prereqs.length) {
        const faltantes = prereqs.filter(p => !cumplidos.find(c => c.id_curso === p.id_curso_prerrequisito));
        return res.status(400).json({
          ok: false,
          error: `Prerrequisitos no cumplidos: ${faltantes.map(f => f.codigo_prereq).join(', ')}`
        });
      }
    }

    // RF-12: Verificar conflicto de horario
    const conflicto = await queryOne(`
      SELECT TOP 1 c2.nombre AS curso_conflicto, s2.codigo_seccion,
                   hs2.dia_semana,
                   CONVERT(varchar,hs2.hora_inicio,108) AS hi,
                   CONVERT(varchar,hs2.hora_fin,108)    AS hf
      FROM detalle_matricula dm2
      INNER JOIN matricula m2     ON m2.id_matricula  = dm2.id_matricula
      INNER JOIN seccion s2       ON s2.id_seccion    = dm2.id_seccion
      INNER JOIN curso c2         ON c2.id_curso      = s2.id_curso
      INNER JOIN horario_seccion hs2   ON hs2.id_seccion = dm2.id_seccion
      INNER JOIN horario_seccion hs_nv ON hs_nv.id_seccion = @sid
        AND hs2.dia_semana   = hs_nv.dia_semana
        AND hs2.hora_inicio  < hs_nv.hora_fin
        AND hs2.hora_fin     > hs_nv.hora_inicio
      WHERE m2.id_estudiante = @est
        AND m2.id_periodo    = @per
        AND m2.estado       <> 'Cancelada'
        AND dm2.estado       = 'Matriculada'
        AND dm2.id_seccion  <> @sid
    `, { sid: { type: sql.Int, value: idSec },
         est: { type: sql.Int, value: idEst },
         per: { type: sql.Int, value: sec.id_periodo } }
    ).catch(() => null);
    if (conflicto) {
      return res.status(400).json({
        ok: false,
        error: `Conflicto de horario con "${conflicto.curso_conflicto}" (${conflicto.dia_semana} ${conflicto.hi}–${conflicto.hf})`
      });
    }

    // Obtener o crear matricula
    let matricula = await queryOne(
      `SELECT id_matricula, total_creditos, total_monto FROM matricula WHERE id_estudiante=@est AND id_periodo=@per`,
      { est: { type: sql.Int, value: idEst }, per: { type: sql.Int, value: sec.id_periodo } }
    );

    const periodo = await queryOne(
      `SELECT limite_creditos FROM periodo_academico WHERE id_periodo=@id`,
      { id: { type: sql.Int, value: sec.id_periodo } }
    );

    const db = await getPool();
    const t  = new sql.Transaction(db);
    await t.begin();

    try {
      if (!matricula) {
        const rr = new sql.Request(t);
        rr.input('est', sql.Int, idEst);
        rr.input('per', sql.Int, sec.id_periodo);
        const rm = await rr.query(
          `INSERT INTO matricula(id_estudiante,id_periodo,estado,total_creditos,total_monto,confirmada)
           OUTPUT INSERTED.id_matricula, INSERTED.total_creditos, INSERTED.total_monto
           VALUES(@est,@per,'Pendiente',0,0,0)`
        );
        matricula = rm.recordset[0];
      }

      // Verificar limite de creditos
      const nuevosCreditos = (matricula.total_creditos || 0) + sec.creditos;
      if (nuevosCreditos > (periodo?.limite_creditos || 16)) {
        await t.rollback();
        return res.status(400).json({ ok: false, error: `Excede el limite de ${periodo?.limite_creditos || 16} creditos` });
      }

      // Verificar que no ya este matriculado en esta seccion
      const yaMatric = new sql.Request(t);
      yaMatric.input('mid', sql.Int, matricula.id_matricula);
      yaMatric.input('sid', sql.Int, idSec);
      const existeDet = await yaMatric.query(
        `SELECT 1 AS x FROM detalle_matricula WHERE id_matricula=@mid AND id_seccion=@sid`
      );
      if (existeDet.recordset.length > 0) {
        await t.rollback();
        return res.status(409).json({ ok: false, error: 'Ya tienes esta seccion en tu matricula' });
      }

      // Calcular costo (creditos * precio por credito)
      const costoPorCredito = 12500;
      const costo = sec.creditos * costoPorCredito;

      // Insertar detalle
      const rDet = new sql.Request(t);
      rDet.input('mid',  sql.Int,          matricula.id_matricula);
      rDet.input('sid',  sql.Int,          idSec);
      rDet.input('cost', sql.Decimal(10,2), costo);
      await rDet.query(
        `INSERT INTO detalle_matricula(id_matricula,id_seccion,costo,estado) VALUES(@mid,@sid,@cost,'Matriculada')`
      );

      // Actualizar totales de matricula
      const rUpd = new sql.Request(t);
      rUpd.input('mid',   sql.Int, matricula.id_matricula);
      rUpd.input('cred',  sql.Int, sec.creditos);
      rUpd.input('costo', sql.Decimal(10,2), costo);
      await rUpd.query(
        `UPDATE matricula SET total_creditos=total_creditos+@cred, total_monto=total_monto+@costo WHERE id_matricula=@mid`
      );

      // Reducir cupo
      const rCupo = new sql.Request(t);
      rCupo.input('sid', sql.Int, idSec);
      await rCupo.query(`UPDATE seccion SET cupo_disponible=cupo_disponible-1 WHERE id_seccion=@sid`);

      await t.commit();

      // RF-03: Bitácora
      query(`INSERT INTO bitacora_auditoria(id_usuario,entidad,accion,descripcion)
             VALUES(@u,'detalle_matricula','INSERT',@det)`,
        { u:   { type: sql.Int,     value: req.session?.user?.id_usuario || 0 },
          det: { type: sql.VarChar, value: `Sección ${idSec} agregada a matrícula ${matricula.id_matricula}` }
        }).catch(() => {});

      res.json({ ok: true, mensaje: 'Seccion agregada a tu matricula', id_matricula: matricula.id_matricula });
    } catch (err2) {
      await t.rollback();
      throw err2;
    }
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* DELETE /api/enrollment/:idEstudiante/seccion/:idSeccion — quitar seccion */
router.delete('/:idEstudiante/seccion/:idSeccion', async (req, res) => {
  try {
    const idEst = parseInt(req.params.idEstudiante);
    const idSec = parseInt(req.params.idSeccion);

    const detalle = await queryOne(`
      SELECT dm.id_detalle_matricula, dm.costo, m.id_matricula, s.id_curso,
             c.creditos
      FROM detalle_matricula dm
      INNER JOIN matricula m ON m.id_matricula=dm.id_matricula
      INNER JOIN seccion s ON s.id_seccion=dm.id_seccion
      INNER JOIN curso c ON c.id_curso=s.id_curso
      WHERE m.id_estudiante=@est AND dm.id_seccion=@sec AND m.confirmada=0
    `, {
      est: { type: sql.Int, value: idEst },
      sec: { type: sql.Int, value: idSec }
    });

    if (!detalle) return res.status(404).json({ ok: false, error: 'Seccion no encontrada en tu matricula o ya confirmada' });

    await query(`DELETE FROM detalle_matricula WHERE id_detalle_matricula=@id`,
      { id: { type: sql.Int, value: detalle.id_detalle_matricula } });

    await query(`UPDATE matricula SET total_creditos=total_creditos-@c, total_monto=total_monto-@costo WHERE id_matricula=@mid`,
      { c: { type: sql.Int, value: detalle.creditos },
        costo: { type: sql.Decimal(10,2), value: detalle.costo },
        mid: { type: sql.Int, value: detalle.id_matricula } });

    await query(`UPDATE seccion SET cupo_disponible=cupo_disponible+1 WHERE id_seccion=@sid`,
      { sid: { type: sql.Int, value: idSec } });

    // RF-03: Bitácora
    query(`INSERT INTO bitacora_auditoria(id_usuario,entidad,accion,descripcion)
           VALUES(@u,'detalle_matricula','DELETE',@det)`,
      { u:   { type: sql.Int,     value: req.session?.user?.id_usuario || 0 },
        det: { type: sql.VarChar, value: `Sección ${idSec} eliminada de matrícula ${detalle.id_matricula}` }
      }).catch(() => {});

    res.json({ ok: true, mensaje: 'Seccion eliminada de tu matricula' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* POST /api/enrollment/:id/confirmar — confirmar matricula y generar factura */
router.post('/:id/confirmar', async (req, res) => {
  try {
    const idMat = parseInt(req.params.id);
    if (!Number.isInteger(idMat)) {
      return res.status(400).json({ ok: false, error: 'ID de matricula invalido' });
    }
    const sessionEstudianteId = getSessionStudentId(req);
    const mat = await queryOne(
      `SELECT m.*, e.id_estudiante, e.bloqueado_financiero
       FROM matricula m INNER JOIN estudiante e ON e.id_estudiante=m.id_estudiante
       WHERE m.id_matricula=@id`,
      { id: { type: sql.Int, value: idMat } }
    );
    if (!mat) return res.status(404).json({ ok: false, error: 'Matricula no encontrada' });
    if (mat.confirmada) return res.status(400).json({ ok: false, error: 'Matricula ya confirmada' });
    if (mat.bloqueado_financiero) return res.status(400).json({ ok: false, error: 'Tiene un bloqueo financiero activo' });
    const idEstudiante = parseInt(mat.id_estudiante, 10);
    if (!Number.isInteger(idEstudiante)) {
      if (isStudentSession(req) && Number.isInteger(sessionEstudianteId)) {
        return res.status(409).json({ ok: false, error: 'Matricula inconsistente en base de datos. Contacte al administrador.' });
      }
      return res.status(400).json({ ok: false, error: 'La matricula no tiene un estudiante valido asociado' });
    }
    if (isStudentSession(req)) {
      if (!Number.isInteger(sessionEstudianteId)) {
        return res.status(403).json({ ok: false, error: 'Sesion de estudiante invalida' });
      }
      if (idEstudiante !== sessionEstudianteId) {
        return res.status(403).json({ ok: false, error: 'No puedes confirmar una matricula de otro estudiante' });
      }
    }

    const numComprobante = `CMP-${new Date().getFullYear()}-${String(idMat).padStart(4,'0')}`;
    const numFactura     = `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    console.log('[enrollment.confirmar] init', {
      id_matricula: idMat,
      id_estudiante: idEstudiante,
      id_periodo: mat.id_periodo,
      total_monto: mat.total_monto,
      confirmada: mat.confirmada
    });

    const db = await getPool();
    const t  = new sql.Transaction(db);
    await t.begin();

    try {
      // Confirmar matricula
      const rMat = new sql.Request(t);
      rMat.input('id', sql.Int, idMat);
      rMat.input('comp', sql.VarChar, numComprobante);
      await rMat.query(`UPDATE matricula SET estado='Confirmada',confirmada=1,comprobante=@comp WHERE id_matricula=@id`);

      // Crear factura
      const rFac = new sql.Request(t);
      rFac.input('idmat', sql.Int,          idMat);
      rFac.input('per',   sql.Int,          mat.id_periodo);
      rFac.input('num',   sql.VarChar,      numFactura);
      rFac.input('sub',   sql.Decimal(10,2), mat.total_monto);
      rFac.input('tot',   sql.Decimal(10,2), mat.total_monto);
      rFac.input('sal',   sql.Decimal(10,2), mat.total_monto);
      const rFacResult = await rFac.query(
        `INSERT INTO factura(id_estudiante,id_periodo,numero_factura,subtotal,total,saldo,estado)
         OUTPUT INSERTED.id_factura
         SELECT id_estudiante, @per, @num, @sub, @tot, @sal, 'Pendiente'
         FROM matricula
         WHERE id_matricula=@idmat`
      );
      const idFactura = rFacResult.recordset[0].id_factura;
      console.log('[enrollment.confirmar] factura_creada', {
        id_matricula: idMat,
        id_factura: idFactura,
        numero_factura: numFactura
      });

      await t.commit();

      // RF-03: Bitácora
      query(`INSERT INTO bitacora_auditoria(id_usuario,entidad,accion,descripcion)
             VALUES(@u,'matricula','UPDATE',@det)`,
        { u:   { type: sql.Int,     value: req.session?.user?.id_usuario || 0 },
          det: { type: sql.VarChar, value: `Matrícula ${idMat} confirmada. Comprobante: ${numComprobante}` }
        }).catch(() => {});

      // RF-23: Notificación automática al confirmar matrícula
      query(`INSERT INTO notificacion(id_estudiante,tipo,asunto,mensaje,medio)
             VALUES(@est,'Matricula','Matrícula confirmada',@msg,'Portal')`,
        { est: { type: sql.Int,     value: idEstudiante },
          msg: { type: sql.VarChar, value: `Tu matricula fue confirmada. Comprobante: ${numComprobante}. Factura: ${numFactura} en estado Pendiente.` }
        }).catch(() => {});

      res.json({
        ok: true,
        comprobante: numComprobante,
        id_factura: idFactura,
        estado_factura: 'Pendiente',
        mensaje: 'Matricula confirmada. El pago queda pendiente para realizarse en Realizar Pago.'
      });
    } catch (err2) {
      console.error('[enrollment.confirmar] tx_error', {
        id_matricula: idMat,
        id_estudiante: idEstudiante,
        error: err2?.message
      });
      await t.rollback();
      throw err2;
    }
  } catch (e) {
    console.error('[enrollment.confirmar] error', {
      id_matricula: req.params?.id,
      error: e?.message
    });
    res.status(500).json({ ok: false, error: e.message });
  }
});


/* NOTE: GET /lista is registered earlier, before /:idEstudiante */

/* GET /api/enrollment/lista/admin — lista de todas las matriculas (admin) */
router.get('/lista/admin', async (req, res) => {
  try {
    const { page = 1, limit = 10, periodo = '', estado = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = {};
    if (periodo) { where += ' AND m.id_periodo=@per'; params.per = { type: sql.Int, value: parseInt(periodo) }; }
    if (estado)  { where += ' AND m.estado=@est'; params.est = estado; }

    const rows = await query(`
      SELECT m.id_matricula, m.estado, m.total_creditos, m.total_monto, m.confirmada, m.comprobante,
             CONVERT(varchar,m.fecha_matricula,103) AS fecha_matricula,
             e.carne, u.nombre + ' ' + u.apellido AS estudiante,
             p.nombre AS periodo
      FROM matricula m
      INNER JOIN estudiante e ON e.id_estudiante = m.id_estudiante
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      INNER JOIN periodo_academico p ON p.id_periodo = m.id_periodo
      ${where}
      ORDER BY m.fecha_matricula DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `, params);

    const total = await queryOne(`SELECT COUNT(*) AS total FROM matricula m ${where}`, params);
    res.json({ ok: true, data: rows, total: total.total });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;



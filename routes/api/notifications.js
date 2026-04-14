/**
 * routes/api/notifications.js
 */
const express = require('express');
const router  = express.Router();
const { sql, query, queryOne } = require('../../config/db');

/* GET /api/notifications — todas (admin) o filtradas por estudiante */
router.get('/', async (req, res) => {
  try {
    const { id_estudiante, tipo, estado, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = {};

    if (id_estudiante) { where += ' AND n.id_estudiante=@est'; params.est = { type: sql.Int, value: parseInt(id_estudiante) }; }
    if (tipo)          { where += ' AND n.tipo=@tipo';        params.tipo = tipo; }
    if (estado)        { where += ' AND n.estado=@est2';      params.est2 = estado; }

    const rows = await query(`
      SELECT n.id_notificacion, n.tipo, n.asunto, n.mensaje, n.medio, n.estado,
             CONVERT(varchar,n.fecha_envio,103) AS fecha_envio,
             CONVERT(varchar,n.fecha_envio,108) AS hora_envio,
             e.carne, u.nombre + ' ' + u.apellido AS estudiante
      FROM notificacion n
      INNER JOIN estudiante e ON e.id_estudiante = n.id_estudiante
      INNER JOIN usuario u ON u.id_usuario = e.id_usuario
      ${where}
      ORDER BY n.fecha_envio DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `, params);

    const total = await queryOne(`SELECT COUNT(*) AS total FROM notificacion n ${where}`, params);
    res.json({ ok: true, data: rows, total: total.total });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* POST /api/notifications — enviar notificacion */
router.post('/', async (req, res) => {
  try {
    const { id_estudiante, tipo, asunto, mensaje, medio = 'Correo' } = req.body;
    if (!id_estudiante || !tipo || !asunto || !mensaje)
      return res.status(400).json({ ok: false, error: 'Faltan campos' });
    const r = await query(
      `INSERT INTO notificacion(id_estudiante,tipo,asunto,mensaje,medio,estado)
       OUTPUT INSERTED.id_notificacion VALUES(@est,@tipo,@asunto,@msg,@medio,'Enviada')`,
      { est: { type: sql.Int, value: parseInt(id_estudiante) },
        tipo, asunto, msg: mensaje, medio }
    );
    res.status(201).json({ ok: true, id: r[0].id_notificacion });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;

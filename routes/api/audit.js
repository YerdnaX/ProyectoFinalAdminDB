/**
 * routes/api/audit.js
 */
const express = require('express');
const router  = express.Router();
const { sql, query, queryOne } = require('../../config/db');

/* GET /api/audit — bitacora con filtros */
router.get('/', async (req, res) => {
  try {
    const { usuario, id_usuario, entidad, accion, desde, hasta, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = {};

    if (id_usuario) { where += ' AND b.id_usuario=@uid'; params.uid = { type: sql.Int, value: parseInt(id_usuario) }; }
    if (usuario)    { where += ' AND (u.nombre LIKE @usr OR u.apellido LIKE @usr)'; params.usr = `%${usuario}%`; }
    if (entidad) { where += ' AND b.entidad=@ent'; params.ent = entidad; }
    if (accion)  { where += ' AND b.accion=@acc';  params.acc = accion; }
    if (desde)   { where += ' AND CAST(b.fecha_evento AS DATE)>=@desde'; params.desde = desde; }
    if (hasta)   { where += ' AND CAST(b.fecha_evento AS DATE)<=@hasta'; params.hasta = hasta; }

    const rows = await query(`
      SELECT b.id_bitacora, b.entidad, b.accion, b.descripcion, b.ip_origen,
             CONVERT(varchar,b.fecha_evento,103) AS fecha,
             CONVERT(varchar,b.fecha_evento,108) AS hora,
             ISNULL(u.nombre + ' ' + u.apellido, 'Sistema') AS usuario,
             ISNULL(r.nombre,'—') AS rol
      FROM bitacora_auditoria b
      LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
      LEFT JOIN rol r ON r.id_rol = u.id_rol
      ${where}
      ORDER BY b.fecha_evento DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `, params);

    const total = await queryOne(
      `SELECT COUNT(*) AS total FROM bitacora_auditoria b LEFT JOIN usuario u ON u.id_usuario=b.id_usuario ${where}`,
      params
    );

    const entidades = await query(`SELECT DISTINCT entidad FROM bitacora_auditoria ORDER BY entidad`);
    res.json({ ok: true, data: rows, total: total.total, entidades: entidades.map(r => r.entidad) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* POST /api/audit — registrar evento */
router.post('/', async (req, res) => {
  try {
    const { id_usuario, entidad, accion, descripcion, ip_origen } = req.body;
    await query(
      `INSERT INTO bitacora_auditoria(id_usuario,entidad,accion,descripcion,ip_origen)
       VALUES(@uid,@ent,@acc,@desc,@ip)`,
      { uid: id_usuario ? { type: sql.Int, value: parseInt(id_usuario) } : null,
        ent: entidad, acc: accion, desc: descripcion || null, ip: ip_origen || null }
    );
    res.status(201).json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;

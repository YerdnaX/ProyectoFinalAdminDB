/**
 * routes/api/usuarios.js
 * API REST para gestion de usuarios y roles
 * NOTA: rutas especificas (/roles/...) DEBEN estar antes de la ruta dinamica (/:id)
 */
const express = require('express');
const router  = express.Router();
const { sql, query, queryOne } = require('../../config/db');

/* ─────────────────────────────────────────
   GET /api/usuarios
   Lista usuarios con filtros y paginacion
───────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { buscar = '', rol = '', estado = '', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = {};

    if (buscar) {
      where += ` AND (u.nombre LIKE @buscar OR u.apellido LIKE @buscar
                   OR u.correo LIKE @buscar OR u.identificador_sso LIKE @buscar)`;
      params.buscar = `%${buscar}%`;
    }
    if (rol) {
      where += ' AND r.nombre = @rol';
      params.rol = rol;
    }
    if (estado === 'Activo')   { where += ' AND u.activo = 1'; }
    if (estado === 'Inactivo') { where += ' AND u.activo = 0'; }

    const rows = await query(`
      SELECT u.id_usuario, u.nombre, u.apellido, u.correo,
             u.identificador_sso, u.activo,
             CONVERT(varchar,u.fecha_creacion,103) AS fecha_creacion,
             r.nombre AS rol
      FROM usuario u
      INNER JOIN rol r ON u.id_rol = r.id_rol
      ${where}
      ORDER BY u.fecha_creacion DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `, params);

    const total = await queryOne(`
      SELECT COUNT(*) AS total
      FROM usuario u
      INNER JOIN rol r ON u.id_rol = r.id_rol
      ${where}
    `, params);

    res.json({ ok: true, data: rows, total: total.total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────
   GET /api/usuarios/roles/lista — lista de roles
   DEBE estar antes de GET /:id
───────────────────────────────────────── */
router.get('/roles/lista', async (req, res) => {
  try {
    const roles = await query(`
      SELECT r.id_rol, r.nombre, r.descripcion,
             COUNT(DISTINCT u.id_usuario) AS num_usuarios
      FROM rol r
      LEFT JOIN usuario u ON u.id_rol = r.id_rol
      GROUP BY r.id_rol, r.nombre, r.descripcion
      ORDER BY r.nombre
    `);
    res.json({ ok: true, data: roles });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────
   GET /api/usuarios/roles/permisos — roles con permisos
   DEBE estar antes de GET /:id
───────────────────────────────────────── */
router.get('/roles/permisos', async (req, res) => {
  try {
    const roles = await query(`
      SELECT r.id_rol, r.nombre, r.descripcion,
             COUNT(DISTINCT u.id_usuario) AS total_usuarios,
             COUNT(DISTINCT rp.id_permiso) AS total_permisos
      FROM rol r
      LEFT JOIN usuario u ON u.id_rol = r.id_rol
      LEFT JOIN rol_permiso rp ON rp.id_rol = r.id_rol
      GROUP BY r.id_rol, r.nombre, r.descripcion
      ORDER BY r.nombre
    `);

    const permisos = await query('SELECT id_permiso, nombre, descripcion FROM permiso ORDER BY nombre');

    const asignados = await query('SELECT rp.id_rol, rp.id_permiso FROM rol_permiso rp');

    res.json({ ok: true, roles, permisos, asignados });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────
   GET /api/usuarios/:id
───────────────────────────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const user = await queryOne(`
      SELECT u.id_usuario, u.nombre, u.apellido, u.correo,
             u.identificador_sso, u.activo,
             CONVERT(varchar,u.fecha_creacion,103) AS fecha_creacion,
             r.id_rol, r.nombre AS rol
      FROM usuario u
      INNER JOIN rol r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = @id
    `, { id: parseInt(req.params.id) });

    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────
   POST /api/usuarios  — Crear usuario
───────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const { nombre, apellido, correo, identificador_sso, id_rol, activo = 1 } = req.body;
    if (!nombre || !apellido || !correo || !identificador_sso || !id_rol) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }

    const existe = await queryOne(
      'SELECT 1 AS x FROM usuario WHERE correo=@correo OR identificador_sso=@sso',
      { correo, sso: identificador_sso }
    );
    if (existe) return res.status(409).json({ ok: false, error: 'El correo o SSO ya existe' });

    const result = await query(`
      INSERT INTO usuario (id_rol,identificador_sso,nombre,apellido,correo,activo,fecha_creacion)
      OUTPUT INSERTED.id_usuario
      VALUES (@id_rol,@sso,@nombre,@apellido,@correo,@activo,GETDATE())
    `, {
      id_rol:   { type: sql.Int,     value: parseInt(id_rol) },
      sso:      { type: sql.VarChar, value: identificador_sso },
      nombre:   { type: sql.VarChar, value: nombre },
      apellido: { type: sql.VarChar, value: apellido },
      correo:   { type: sql.VarChar, value: correo },
      activo:   { type: sql.Bit,     value: activo ? 1 : 0 }
    });

    res.status(201).json({ ok: true, id: result[0].id_usuario, mensaje: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────
   PUT /api/usuarios/:id — Actualizar usuario (soporta actualizacion parcial)
───────────────────────────────────────── */
router.put('/:id', async (req, res) => {
  try {
    const { nombre, apellido, correo, id_rol, activo } = req.body;
    const id = parseInt(req.params.id);

    // Usa ISNULL para no sobrescribir campos que no vienen en el body
    await query(`
      UPDATE usuario
      SET nombre   = ISNULL(@nombre,   nombre),
          apellido = ISNULL(@apellido, apellido),
          correo   = ISNULL(@correo,   correo),
          id_rol   = ISNULL(@id_rol,   id_rol),
          activo   = ISNULL(@activo,   activo)
      WHERE id_usuario = @id
    `, {
      nombre:   nombre   != null ? { type: sql.VarChar, value: nombre }   : null,
      apellido: apellido != null ? { type: sql.VarChar, value: apellido } : null,
      correo:   correo   != null ? { type: sql.VarChar, value: correo }   : null,
      id_rol:   id_rol   != null ? { type: sql.Int,     value: parseInt(id_rol) } : null,
      activo:   activo   != null ? { type: sql.Bit,     value: activo ? 1 : 0 }  : null,
      id:       { type: sql.Int, value: id }
    });

    res.json({ ok: true, mensaje: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────
   DELETE /api/usuarios/:id — Desactivar usuario
───────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    await query(`UPDATE usuario SET activo=0 WHERE id_usuario=@id`,
      { id: { type: sql.Int, value: parseInt(req.params.id) } });
    res.json({ ok: true, mensaje: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────
   PUT /api/usuarios/roles/:id/permisos — Actualizar permisos de un rol
───────────────────────────────────────── */
router.put('/roles/:id/permisos', async (req, res) => {
  try {
    const idRol = parseInt(req.params.id);
    const { permisos = [] } = req.body; // array de id_permiso

    const db = await require('../../config/db').getPool();
    const t  = new sql.Transaction(db);
    await t.begin();

    try {
      const reqDel = new sql.Request(t);
      reqDel.input('id_rol', sql.Int, idRol);
      await reqDel.query('DELETE FROM rol_permiso WHERE id_rol=@id_rol');

      for (const idPerm of permisos) {
        const reqIns = new sql.Request(t);
        reqIns.input('id_rol',     sql.Int, idRol);
        reqIns.input('id_permiso', sql.Int, parseInt(idPerm));
        await reqIns.query('INSERT INTO rol_permiso(id_rol,id_permiso) VALUES(@id_rol,@id_permiso)');
      }

      await t.commit();
      res.json({ ok: true, mensaje: 'Permisos actualizados' });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

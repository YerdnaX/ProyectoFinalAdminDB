/**
 * routes/api/usuarios.js
 * API REST para gestion de usuarios y roles
 * NOTA: rutas especificas (/roles/...) DEBEN estar antes de la ruta dinamica (/:id)
 */
const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const { sql, query, queryOne, getPool } = require('../../config/db');

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function toBit(v, defaultValue = 1) {
  if (v === undefined || v === null || v === '') return defaultValue ? 1 : 0;
  if (v === true || v === 1 || v === '1') return 1;
  if (v === false || v === 0 || v === '0') return 0;
  return defaultValue ? 1 : 0;
}

async function obtenerRol(idRol) {
  if (!Number.isInteger(idRol)) return null;
  return await queryOne(
    `SELECT id_rol, nombre
     FROM rol
     WHERE id_rol = @id`,
    { id: { type: sql.Int, value: idRol } }
  );
}

async function obtenerProgramaDefecto() {
  return await queryOne(
    `SELECT TOP 1 id_programa
     FROM programa_academico
     WHERE activo = 1
     ORDER BY id_programa`
  );
}

async function generarCarneUnico(idUsuario, tx = null) {
  const year = new Date().getFullYear();
  const base = `${year}${String(idUsuario).padStart(4, '0')}`;
  const request = tx ? new sql.Request(tx) : (await getPool()).request();
  request.input('carne', sql.VarChar, base);
  const existe = await request.query('SELECT 1 AS x FROM estudiante WHERE carne = @carne');
  if (!existe.recordset.length) return base;

  for (let i = 1; i <= 999; i++) {
    const candidato = `${base}${String(i).padStart(3, '0')}`;
    const req2 = tx ? new sql.Request(tx) : (await getPool()).request();
    req2.input('carne', sql.VarChar, candidato);
    const ex2 = await req2.query('SELECT 1 AS x FROM estudiante WHERE carne = @carne');
    if (!ex2.recordset.length) return candidato;
  }
  throw new Error('No se pudo generar un carne unico');
}

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
             CONVERT(varchar,u.fecha_creacion,23) AS fecha_creacion,
             r.id_rol, r.nombre AS rol,
             e.id_estudiante, e.carne, e.id_programa
      FROM usuario u
      INNER JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN estudiante e ON e.id_usuario = u.id_usuario
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
    const { nombre, apellido, correo, identificador_sso, id_rol, activo = 1, contrasena, id_programa, carne } = req.body;
    const idRol = parseInt(id_rol, 10);
    const idPrograma = id_programa ? parseInt(id_programa, 10) : null;
    const carneClean = String(carne || '').trim();
    if (!nombre || !apellido || !correo || !identificador_sso || !id_rol) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }
    if (!contrasena) {
      return res.status(400).json({ ok: false, error: 'La contraseña es obligatoria' });
    }

    const existe = await queryOne(
      'SELECT 1 AS x FROM usuario WHERE correo=@correo OR identificador_sso=@sso',
      { correo, sso: identificador_sso }
    );
    if (existe) return res.status(409).json({ ok: false, error: 'El correo o SSO ya existe' });

    const clave_hash = hashPassword(contrasena);
    const rol = await obtenerRol(idRol);
    if (!rol) return res.status(400).json({ ok: false, error: 'Rol invalido' });

    const db = await getPool();
    const tx = new sql.Transaction(db);
    await tx.begin();
    try {
      const reqIns = new sql.Request(tx);
      reqIns.input('id_rol', sql.Int, idRol);
      reqIns.input('sso', sql.VarChar, identificador_sso);
      reqIns.input('nombre', sql.VarChar, nombre);
      reqIns.input('apellido', sql.VarChar, apellido);
      reqIns.input('correo', sql.VarChar, correo);
      reqIns.input('hash', sql.VarChar, clave_hash);
      reqIns.input('activo', sql.Bit, toBit(activo, 1));
      const result = await reqIns.query(`
        INSERT INTO usuario (id_rol,identificador_sso,nombre,apellido,correo,clave_hash,activo,fecha_creacion)
        OUTPUT INSERTED.id_usuario
        VALUES (@id_rol,@sso,@nombre,@apellido,@correo,@hash,@activo,GETDATE())
      `);
      const idUsuario = result.recordset[0].id_usuario;

      if (String(rol.nombre).toLowerCase() === 'estudiante') {
        let programaFinal = idPrograma;
        if (!Number.isInteger(programaFinal)) {
          const programaDef = await obtenerProgramaDefecto();
          programaFinal = programaDef?.id_programa || null;
        }
        if (!Number.isInteger(programaFinal)) {
          throw new Error('No existe un programa academico activo para asignar al estudiante');
        }

        const carneFinal = carneClean || await generarCarneUnico(idUsuario, tx);
        const reqEst = new sql.Request(tx);
        reqEst.input('uid', sql.Int, idUsuario);
        reqEst.input('carne', sql.VarChar, carneFinal);
        reqEst.input('prog', sql.Int, programaFinal);
        await reqEst.query(`
          INSERT INTO estudiante (id_usuario, carne, id_programa, estado_academico, fecha_ingreso, saldo_pendiente, bloqueado_financiero, bloqueado_academico)
          VALUES (@uid, @carne, @prog, 'Activo', CONVERT(date, GETDATE()), 0, 0, 0)
        `);
      }

      await tx.commit();
      res.status(201).json({ ok: true, id: idUsuario, mensaje: 'Usuario creado' });
    } catch (txErr) {
      await tx.rollback();
      throw txErr;
    }
  } catch (err) {
    if (err && (err.number === 2627 || err.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Correo, SSO o carne duplicado' });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─────────────────────────────────────────
   PUT /api/usuarios/:id — Actualizar usuario (soporta actualizacion parcial)
───────────────────────────────────────── */
router.put('/:id', async (req, res) => {
  try {
    const { nombre, apellido, correo, id_rol, activo, id_programa, carne } = req.body;
    const id = parseInt(req.params.id);
    const idRol = id_rol != null && id_rol !== '' ? parseInt(id_rol, 10) : null;
    const idPrograma = id_programa != null && id_programa !== '' ? parseInt(id_programa, 10) : null;
    const carneClean = carne != null ? String(carne).trim() : null;

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
      id_rol:   idRol != null && Number.isInteger(idRol) ? { type: sql.Int, value: idRol } : null,
      activo:   activo   != null ? { type: sql.Bit,     value: toBit(activo, 1) }  : null,
      id:       { type: sql.Int, value: id }
    });

    const user = await queryOne(
      `SELECT u.id_usuario, u.id_rol, r.nombre AS rol
       FROM usuario u
       INNER JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });

    if (String(user.rol).toLowerCase() === 'estudiante') {
      let programaFinal = Number.isInteger(idPrograma) ? idPrograma : null;
      if (!programaFinal) {
        const ex = await queryOne('SELECT id_programa FROM estudiante WHERE id_usuario=@id', { id: { type: sql.Int, value: id } });
        programaFinal = ex?.id_programa || null;
      }
      if (!programaFinal) {
        const def = await obtenerProgramaDefecto();
        programaFinal = def?.id_programa || null;
      }
      if (!programaFinal) {
        return res.status(400).json({ ok: false, error: 'No existe programa activo para asignar al estudiante' });
      }

      const est = await queryOne('SELECT id_estudiante, carne FROM estudiante WHERE id_usuario=@id', { id: { type: sql.Int, value: id } });
      if (!est) {
        const carneFinal = carneClean || await generarCarneUnico(id);
        await query(
          `INSERT INTO estudiante (id_usuario, carne, id_programa, estado_academico, fecha_ingreso, saldo_pendiente, bloqueado_financiero, bloqueado_academico)
           VALUES (@uid, @carne, @prog, 'Activo', CONVERT(date, GETDATE()), 0, 0, 0)`,
          {
            uid: { type: sql.Int, value: id },
            carne: { type: sql.VarChar, value: carneFinal },
            prog: { type: sql.Int, value: programaFinal }
          }
        );
      } else {
        await query(
          `UPDATE estudiante
           SET id_programa = ISNULL(@prog, id_programa),
               carne = ISNULL(@carne, carne)
           WHERE id_usuario = @uid`,
          {
            prog: Number.isInteger(idPrograma) ? { type: sql.Int, value: idPrograma } : null,
            carne: carneClean ? { type: sql.VarChar, value: carneClean } : null,
            uid: { type: sql.Int, value: id }
          }
        );
      }
    }

    res.json({ ok: true, mensaje: 'Usuario actualizado' });
  } catch (err) {
    if (err && (err.number === 2627 || err.number === 2601)) {
      return res.status(409).json({ ok: false, error: 'Datos duplicados (correo, SSO o carne)' });
    }
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

/**
 * routes/api/auth.js
 * Endpoints de autenticación: login, logout, sesión actual
 */
const express  = require('express');
const crypto   = require('crypto');
const router   = express.Router();
const { sql, query, queryOne } = require('../../config/db');

/** Verifica contraseña contra hash almacenado (scrypt) */
function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':');
    const hashBuffer   = crypto.scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(hash, 'hex');
    return crypto.timingSafeEqual(hashBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/** Genera hash de contrasena (scrypt) */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
/* ── POST /api/auth/login ───────────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ ok: false, error: 'Correo y contraseña son requeridos' });
    }

    const usuario = await queryOne(
      `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.identificador_sso,
              u.activo, u.clave_hash, r.nombre AS rol, r.id_rol
       FROM usuario u
       JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.correo = @correo`,
      { correo }
    );

    if (!usuario) {
      return res.status(401).json({ ok: false, error: 'Credenciales incorrectas' });
    }
    if (!usuario.activo) {
      return res.status(403).json({ ok: false, error: 'Usuario inactivo. Contacte al administrador.' });
    }
    if (!usuario.clave_hash || !verifyPassword(contrasena, usuario.clave_hash)) {
      return res.status(401).json({ ok: false, error: 'Credenciales incorrectas' });
    }

    // Buscar id_estudiante si el rol es Estudiante
    let id_estudiante = null;
    if (usuario.rol === 'Estudiante') {
      const est = await queryOne(
        'SELECT id_estudiante FROM estudiante WHERE id_usuario = @uid',
        { uid: { type: sql.Int, value: usuario.id_usuario } }
      );
      id_estudiante = est ? est.id_estudiante : null;
      if (!id_estudiante) {
        return res.status(403).json({
          ok: false,
          error: 'Perfil de estudiante incompleto. Contacte al administrador para finalizar su registro.'
        });
      }
    }

    // Cargar permisos del rol
    const permisosRol = await query(
      `SELECT p.nombre FROM rol_permiso rp
       INNER JOIN permiso p ON p.id_permiso = rp.id_permiso
       WHERE rp.id_rol = @rol`,
      { rol: { type: sql.Int, value: usuario.id_rol } }
    ).catch(() => []);
    const permisos = permisosRol.map(p => p.nombre);

    // Crear sesión
    req.session.user = {
      id_usuario    : usuario.id_usuario,
      nombre        : usuario.nombre,
      apellido      : usuario.apellido,
      correo        : usuario.correo,
      id_rol        : usuario.id_rol,
      rol           : usuario.rol,
      id_estudiante : id_estudiante,
      identificador_sso: usuario.identificador_sso,
      permisos      : permisos
    };

    // Registrar en bitácora
    await query(
      `INSERT INTO bitacora_auditoria(id_usuario, entidad, accion, descripcion, ip_origen)
       VALUES(@uid, 'Sesion', 'LOGIN', @desc, @ip)`,
      {
        uid : { type: sql.Int, value: usuario.id_usuario },
        desc: `Inicio de sesion — ${usuario.nombre} ${usuario.apellido} (${usuario.rol})`,
        ip  : req.ip || req.connection.remoteAddress || null
      }
    );

    // Determinar ruta de destino según rol
    const destinos = {
      'Administrador': '/admin',
      'Finanzas'     : '/billing/facturas',
      'Docente'      : '/academic/cursos',
      'Estudiante'   : '/students'
    };

    return res.json({
      ok      : true,
      redirect: destinos[usuario.rol] || '/auth/login',
      user    : req.session.user
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

/* ── POST /api/auth/logout ──────────────────────────────────────────────── */
router.post('/logout', (req, res) => {
  const id = req.session?.user?.id_usuario;
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

/* ── GET /api/auth/me ───────────────────────────────────────────────────── */
/* POST /api/auth/cambiar-contrasena */
router.post('/cambiar-contrasena', async (req, res) => {
  try {
    const idUsuario = req.session?.user?.id_usuario;
    if (!idUsuario) return res.status(401).json({ ok: false, error: 'No autenticado' });

    const { contrasena_actual, contrasena_nueva, contrasena_confirmacion } = req.body || {};
    const actual = String(contrasena_actual || '');
    const nueva = String(contrasena_nueva || '');
    const confirmacion = String(contrasena_confirmacion || '');

    if (!actual || !nueva || !confirmacion) {
      return res.status(400).json({ ok: false, error: 'Todos los campos son obligatorios' });
    }
    if (nueva.length < 6) {
      return res.status(400).json({ ok: false, error: 'La nueva contrasena debe tener al menos 6 caracteres' });
    }
    if (nueva !== confirmacion) {
      return res.status(400).json({ ok: false, error: 'Las contrasenas nuevas no coinciden' });
    }
    if (actual === nueva) {
      return res.status(400).json({ ok: false, error: 'La nueva contrasena debe ser diferente a la actual' });
    }

    const usuario = await queryOne(
      `SELECT id_usuario, clave_hash FROM usuario WHERE id_usuario = @id`,
      { id: { type: sql.Int, value: idUsuario } }
    );
    if (!usuario || !usuario.clave_hash) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }
    if (!verifyPassword(actual, usuario.clave_hash)) {
      return res.status(400).json({ ok: false, error: 'La contrasena actual es incorrecta' });
    }

    const nuevoHash = hashPassword(nueva);
    await query(
      `UPDATE usuario SET clave_hash = @hash WHERE id_usuario = @id`,
      {
        hash: { type: sql.VarChar, value: nuevoHash },
        id: { type: sql.Int, value: idUsuario }
      }
    );

    return res.json({ ok: true, mensaje: 'Contrasena actualizada' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ ok: false, error: 'No autenticado' });
  }
  return res.json({ ok: true, user: req.session.user });
});

module.exports = router;


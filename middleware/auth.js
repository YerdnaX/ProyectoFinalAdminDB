/**
 * middleware/auth.js
 * Guards de autenticación y autorización para rutas Express
 */

/**
 * Verifica que el usuario esté autenticado (sesión activa).
 * Si no hay sesión, redirige al login (vistas) o devuelve 401 (API).
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  const isApi = req.originalUrl.startsWith('/api/');
  if (isApi) {
    return res.status(401).json({ ok: false, error: 'No autenticado' });
  }
  return res.redirect('/auth/login');
}

/**
 * Verifica que el usuario tenga alguno de los roles indicados.
 * @param {...string} roles  - nombres de rol permitidos (ej: 'Administrador', 'Finanzas')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      const isApi = req.originalUrl.startsWith('/api/');
      return isApi
        ? res.status(401).json({ ok: false, error: 'No autenticado' })
        : res.redirect('/auth/login');
    }
    if (roles.includes(req.session.user.rol)) {
      return next();
    }
    const isApi = req.originalUrl.startsWith('/api/');
    if (isApi) {
      return res.status(403).json({ ok: false, error: 'Sin permisos suficientes' });
    }
    return res.status(403).render('error', {
      message: 'Acceso denegado',
      error: { status: 403, stack: `Tu rol (${req.session.user.rol}) no tiene acceso a esta sección.` }
    });
  };
}

module.exports = { requireAuth, requireRole };

require('dotenv').config();

var createError   = require('http-errors');
var express       = require('express');
var path          = require('path');
var cookieParser  = require('cookie-parser');
var logger        = require('morgan');
var session       = require('express-session');
var hbs           = require('hbs');

// Routers — vistas
var indexRouter      = require('./routes/index');
var authRouter       = require('./routes/auth');
var adminRouter      = require('./routes/admin');
var academicRouter   = require('./routes/academic');
var studentsRouter   = require('./routes/students');
var enrollmentRouter = require('./routes/enrollment');
var billingRouter    = require('./routes/billing');
var notifRouter      = require('./routes/notifications');
var reportsRouter    = require('./routes/reports');
var auditRouter      = require('./routes/audit');

// Router — API REST
var apiRouter = require('./routes/api/index');

var app = express();

// ── Motor de plantillas ────────────────────────────────────────────────────
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Registrar directorio de partials HBS
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Helper HBS: igualdad
hbs.registerHelper('eq', (a, b) => a === b);

// ── Middleware global ──────────────────────────────────────────────────────
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'matricula_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }   // 8 horas
}));

// ── Inyectar usuario de sesión en todas las plantillas ─────────────────────
app.use((req, res, next) => {
  const u = req.session && req.session.user;
  res.locals.user         = u || null;
  res.locals.isAdmin      = u ? u.rol === 'Administrador' : false;
  res.locals.isDocente    = u ? u.rol === 'Docente'       : false;
  res.locals.isEstudiante = u ? u.rol === 'Estudiante'    : false;
  res.locals.isFinanzas   = u ? u.rol === 'Finanzas'      : false;
  next();
});

// ── Archivos estáticos ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));

// ── API REST ───────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Rutas de vistas ────────────────────────────────────────────────────────
app.use('/',              indexRouter);
app.use('/auth',          authRouter);
app.use('/admin',         adminRouter);
app.use('/academic',      academicRouter);
app.use('/students',      studentsRouter);
app.use('/enrollment',    enrollmentRouter);
app.use('/billing',       billingRouter);
app.use('/notifications', notifRouter);
app.use('/reports',       reportsRouter);
app.use('/audit',         auditRouter);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use(function (req, res, next) {
  next(createError(404));
});

// ── Manejador de errores ───────────────────────────────────────────────────
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error   = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

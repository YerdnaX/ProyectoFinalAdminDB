/**
 * config/db.js
 * Conexion a SQL Server via TCP con autenticacion SQL Server.
 * Compatible con Linux (Render) y Windows (local).
 * NO usa ODBC ni msnodesqlv8.
 */
require('dotenv').config();
const sql = require('mssql');

const config = {
  server:   process.env.DB_SERVER   || 'localhost',
  database: process.env.DB_DATABASE || 'SistemaMatriculaUniversitaria',
  port:     parseInt(process.env.DB_PORT || '1433', 10),
  user:     process.env.DB_USER     || '',
  password: process.env.DB_PASSWORD || '',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt:                /^(1|true|yes)$/i.test(process.env.DB_ENCRYPT            || 'yes'),
    trustServerCertificate: /^(1|true|yes)$/i.test(process.env.DB_TRUST_SERVER_CERT || 'yes'),
    enableArithAbort: true,
    requestTimeout:  15000,
    connectTimeout:  15000
  }
};

let poolPromise = null;

function getPoolPromise() {
  if (!poolPromise) {
    if (!config.user || !config.password) {
      return Promise.reject(new Error(
        'DB_USER o DB_PASSWORD no estan configurados. Revisa las variables de entorno.'
      ));
    }
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log(`[DB] Conectado a SQL Server: ${config.server} / ${config.database}`);
        return pool;
      })
      .catch(err => {
        poolPromise = null;
        console.error('[DB] Error de conexion:', err.message);
        throw err;
      });
  }
  return poolPromise;
}

async function getPool() {
  return getPoolPromise();
}

async function query(queryStr, params = {}) {
  const pool = await getPool();
  const request = pool.request();
  for (const [key, val] of Object.entries(params)) {
    if (val && typeof val === 'object' && val.type) {
      request.input(key, val.type, val.value);
    } else {
      request.input(key, val);
    }
  }
  const result = await request.query(queryStr);
  return result.recordset;
}

async function queryOne(queryStr, params = {}) {
  const rows = await query(queryStr, params);
  return rows[0] || null;
}

module.exports = {
  sql,
  get poolPromise() { return getPoolPromise(); },
  getPool,
  query,
  queryOne
};

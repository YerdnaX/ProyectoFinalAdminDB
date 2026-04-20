/**
 * config/db.js
 * Conexion a SQL Server usando mssql/msnodesqlv8 + ODBC.
 * Soporta autenticacion integrada (Trusted_Connection) y SQL Auth por .env.
 */
require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_DATABASE = process.env.DB_DATABASE || 'SistemaMatriculaUniversitaria';
const DB_PORT = process.env.DB_PORT || '1433';
const DB_AUTH_TYPE = String(process.env.DB_AUTH_TYPE || 'trusted').toLowerCase();
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_ENCRYPT = String(process.env.DB_ENCRYPT || 'yes').toLowerCase();
const DB_TRUST_SERVER_CERT = String(process.env.DB_TRUST_SERVER_CERT || 'yes').toLowerCase();

const useSqlAuth = DB_AUTH_TYPE === 'sql';
const authPart = useSqlAuth
  ? `Uid=${DB_USER};Pwd=${DB_PASSWORD};`
  : 'Trusted_Connection=yes;';

const config = {
  connectionString:
    `Driver={ODBC Driver 17 for SQL Server};Server=${DB_SERVER},${DB_PORT};Database=${DB_DATABASE};${authPart}Encrypt=${DB_ENCRYPT};TrustServerCertificate=${DB_TRUST_SERVER_CERT};`
};

// Pool compartido — mismo patron del proyecto funcional
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log(`✅ Conectado a SQL Server — BD: ${DB_DATABASE}`);
    return pool;
  })
  .catch(err => {
    console.error('❌ Error al conectar a SQL Server:', err.message);
    throw err;
  });

/**
 * Obtiene el pool activo
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getPool() {
  return await poolPromise;
}

/**
 * Ejecuta una consulta SQL parametrizada
 * @param {string} queryStr
 * @param {Object} params  - { nombre: { type, value } } o { nombre: valor }
 * @returns {Promise<Array>}
 */
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

/**
 * Ejecuta una consulta y devuelve solo el primer registro
 * @returns {Promise<Object|null>}
 */
async function queryOne(queryStr, params = {}) {
  const rows = await query(queryStr, params);
  return rows[0] || null;
}

module.exports = { sql, poolPromise, getPool, query, queryOne };

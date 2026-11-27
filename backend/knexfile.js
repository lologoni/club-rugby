require('dotenv').config();
const path = require('path');

// Postgres usa UTC por defecto: sin esto, CURRENT_DATE pasa al día siguiente a las 21 h
// de Argentina y las cuotas que vencen ese día figuran vencidas tres horas antes.
const pool = {
  afterCreate: (conn, done) =>
    conn.query("SET TIME ZONE 'America/Argentina/Buenos_Aires'", (err) => done(err, conn)),
};

const base = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool,
  migrations: { directory: path.join(__dirname, '../database/migrations') },
  seeds: { directory: path.join(__dirname, '../database/seeds') },
};

module.exports = {
  development: base,
  test: base,
  production: {
    ...base,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: { ...pool, min: 0, max: 10 },
  },
};

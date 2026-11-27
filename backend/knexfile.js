require('dotenv').config();
const path = require('path');

const base = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
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
    pool: { min: 0, max: 10 },
  },
};

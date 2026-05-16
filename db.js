require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id            SERIAL PRIMARY KEY,
      autor         VARCHAR(100) DEFAULT 'Anónimo',
      texto         TEXT,
      foto_url      TEXT,
      fecha_recuerdo DATE NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Base de datos lista');
}

module.exports = { pool, initDB };

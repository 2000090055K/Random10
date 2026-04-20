require('dotenv').config();
const Database = require('better-sqlite3');

const db = new Database(process.env.DATABASE_FILE || './db/random10.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    city       TEXT,
    source     TEXT DEFAULT 'landing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_session_id TEXT NOT NULL UNIQUE,
    customer_email    TEXT,
    customer_name     TEXT,
    amount_total      INTEGER,
    currency          TEXT,
    status            TEXT DEFAULT 'complete',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Database ready.');
db.close();
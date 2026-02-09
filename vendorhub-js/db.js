const Database = require('better-sqlite3')
const db = new Database("database.db")

db.prepare(`
    CREATE TABLE IF NOT EXISTS users  (id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
    )
`).run();

try {
  db.prepare(`
    ALTER TABLE users
    ADD COLUMN role TEXT NOT NULL DEFAULT 'client'
  `).run();
} catch (err) {
  // Ignore error if column already exists
}

module.exports = db;
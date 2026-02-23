import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'cmc-manager.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS cmcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_cmcs_name ON cmcs(name);
  CREATE INDEX IF NOT EXISTS idx_cmcs_created_at ON cmcs(created_at);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'guest')),
    created_at INTEGER NOT NULL,
    last_login INTEGER,
    created_by TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`);

// Create default admin and guest users if they don't exist
const initUsers = async () => {
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  const guestExists = db.prepare('SELECT id FROM users WHERE username = ?').get('guest');

  if (!adminExists) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, role, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', 'admin', adminPassword, 'admin', Date.now(), 'system');
    console.log('✅ Default admin user created (username: admin, password: admin123)');
  }

  if (!guestExists) {
    const guestPassword = await bcrypt.hash('guest123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, role, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('guest', 'guest', guestPassword, 'guest', Date.now(), 'system');
    console.log('✅ Default guest user created (username: guest, password: guest123)');
  }
};

// Initialize default users
initUsers().catch(console.error);

// Prepared statements for CMCs
export const statements = {
  // CMC statements
  getAllCmcs: db.prepare('SELECT * FROM cmcs ORDER BY name ASC'),
  
  getCmcById: db.prepare('SELECT * FROM cmcs WHERE id = ?'),
  
  createCmc: db.prepare(`
    INSERT INTO cmcs (id, name, address, username, password, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  updateCmc: db.prepare(`
    UPDATE cmcs 
    SET name = ?, address = ?, username = ?, password = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `),
  
  deleteCmc: db.prepare('DELETE FROM cmcs WHERE id = ?'),
  
  searchCmcs: db.prepare(`
    SELECT * FROM cmcs 
    WHERE name LIKE ? OR address LIKE ? OR notes LIKE ?
    ORDER BY name ASC
  `),

  // User statements
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  
  getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  
  getAllUsers: db.prepare('SELECT id, username, role, created_at, last_login FROM users ORDER BY username ASC'),
  
  createUser: db.prepare(`
    INSERT INTO users (id, username, password, role, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  updateLastLogin: db.prepare('UPDATE users SET last_login = ? WHERE id = ?'),
  
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
};

export default db;
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
`);

// Prepared statements for better performance
export const statements = {
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
  `)
};

export default db;
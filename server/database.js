const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'note-cute.db');
let db = null;
let SQL = null;

async function initDatabase() {
  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'Nueva Nota',
      content TEXT DEFAULT '',
      style TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      web_background TEXT DEFAULT '#f0f2f5',
      web_background_image TEXT DEFAULT '',
      default_note_color TEXT DEFAULT '#ffffff',
      default_note_border_color TEXT DEFAULT '#e0e0e0',
      default_note_border_radius TEXT DEFAULT '12px',
      default_note_width TEXT DEFAULT '600px',
      default_note_font_family TEXT DEFAULT 'Poppins',
      default_note_font_size TEXT DEFAULT '14px',
      default_note_border TEXT DEFAULT '1px',
      default_note_shadow INTEGER DEFAULT 1,
      default_note_opacity INTEGER DEFAULT 100,
      default_note_clip_path TEXT DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  saveDatabase();
  console.log('Database initialized');
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDatabase() {
  return {
    prepare: (sql) => ({
      run: (...params) => {
        try {
          if (params.length > 0) {
            db.run(sql, params);
          } else {
            db.run(sql);
          }
          const result = db.exec("SELECT changes(), last_insert_rowid()");
          let changes = 0;
          let lastInsertRowid = 0;
          if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
            changes = result[0].values[0][0];
            lastInsertRowid = result[0].values[0][1];
          }
          saveDatabase();
          return { changes, lastInsertRowid };
        } catch (e) {
          console.error('SQL run error:', e);
          throw e;
        }
      },
      get: (...params) => {
        try {
          const stmt = db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        } catch (e) {
          console.error('SQL get error:', e, sql);
          return undefined;
        }
      },
      all: (...params) => {
        try {
          const results = [];
          const stmt = db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (e) {
          console.error('SQL all error:', e);
          return [];
        }
      }
    })
  };
}

module.exports = { initDatabase, getDatabase };

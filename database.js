const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'website.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'General',
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL UNIQUE,
    mime_type TEXT,
    size_bytes INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    photo_name TEXT,
    photo_original_name TEXT,
    published_at TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('documents', 'news')),
    name TEXT NOT NULL COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(type, name)
  );

  CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
  CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
  CREATE INDEX IF NOT EXISTS idx_news_title ON news(title);
  CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
  CREATE INDEX IF NOT EXISTS idx_news_date ON news(published_at);
`);

// Seed the built-in categories and preserve categories already used by existing records.
const seedCategories = {
  documents: ['General', 'Networking', 'Academic', 'Reports', 'Presentations', 'Images'],
  news: ['General', 'Announcement', 'Technology', 'Education', 'Networking', 'Events']
};
const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (type, name) VALUES (?, ?)');
const seedTransaction = db.transaction(() => {
  for (const [type, names] of Object.entries(seedCategories)) {
    for (const name of names) insertCategory.run(type, name);
  }
  for (const row of db.prepare('SELECT DISTINCT category FROM documents').all()) {
    if (row.category) insertCategory.run('documents', row.category);
  }
  for (const row of db.prepare('SELECT DISTINCT category FROM news').all()) {
    if (row.category) insertCategory.run('news', row.category);
  }
});
seedTransaction();

module.exports = db;

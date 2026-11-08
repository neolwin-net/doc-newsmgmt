const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mime = require('mime-types');
const db = require('./database');

const app = express();
const PORT = Number(process.env.PORT || 80);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
const uploadRoot = path.join(__dirname, 'uploads');
const documentDir = path.join(uploadRoot, 'documents');
const newsDir = path.join(uploadRoot, 'news');
for (const dir of [documentDir, newsDir]) fs.mkdirSync(dir, { recursive: true });

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

function makeStorage(destination) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').slice(0, 20).replace(/[^.a-zA-Z0-9_-]/g, '');
      cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`);
    }
  });
}
const documentUpload = multer({
  storage: makeStorage(documentDir),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 }
});
const newsUpload = multer({
  storage: makeStorage(newsDir),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowed = ['.png', '.jpg', '.jpeg'];
    if (allowed.includes(ext) && /^image\/(png|jpeg)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('News photos must be PNG, JPG, or JPEG images.'));
  }
});

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
function removeStoredFile(folder, filename) {
  if (!filename) return;
  const safeName = path.basename(filename);
  const fullPath = path.join(folder, safeName);
  try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (err) {
    console.error('Could not remove stored file:', err.message);
  }
}
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}
function likeTerm(value) { return `%${String(value || '').trim().replace(/[\\%_]/g, '\\$&')}%`; }

app.get('/api/health', (_req, res) => res.json({ ok: true, maxUploadBytes: MAX_FILE_SIZE }));

// Categories are stored separately for documents and news.
app.get('/api/categories', (req, res) => {
  const type = String(req.query.type || '');
  if (!['documents', 'news'].includes(type)) {
    return res.status(400).json({ error: 'Category type must be documents or news.' });
  }
  const rows = db.prepare('SELECT name FROM categories WHERE type = ? ORDER BY name COLLATE NOCASE').all(type);
  res.json(rows.map(row => row.name));
});

app.post('/api/categories', (req, res) => {
  const type = String(req.body.type || '');
  const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
  if (!['documents', 'news'].includes(type)) {
    return res.status(400).json({ error: 'Category type must be documents or news.' });
  }
  if (!name || name.length > 40) {
    return res.status(400).json({ error: 'Category name must contain 1–40 characters.' });
  }
  if (/[<>\r\n]/.test(name)) {
    return res.status(400).json({ error: 'Please use a simple category name without HTML characters.' });
  }
  try {
    db.prepare('INSERT INTO categories (type, name) VALUES (?, ?)').run(type, name);
    res.status(201).json({ message: 'Category added.', name });
  } catch (err) {
    if (String(err.code || '').startsWith('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'That category already exists.' });
    }
    throw err;
  }
});

app.delete('/api/categories', (req, res) => {
  const type = String(req.body.type || '');
  const name = String(req.body.name || '').trim();
  if (!['documents', 'news'].includes(type)) {
    return res.status(400).json({ error: 'Category type must be documents or news.' });
  }
  if (!name) return res.status(400).json({ error: 'Choose a category to delete.' });
  const builtIn = {
    documents: ['General', 'Networking', 'Academic', 'Reports', 'Presentations', 'Images'],
    news: ['General', 'Announcement', 'Technology', 'Education', 'Networking', 'Events']
  };
  if (builtIn[type].some(item => item.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: 'Built-in categories cannot be deleted.' });
  }
  const result = db.prepare('DELETE FROM categories WHERE type = ? AND name = ?').run(type, name);
  if (!result.changes) return res.status(404).json({ error: 'Category not found.' });
  res.json({ message: 'Category deleted.' });
});


// Documents
app.get('/api/documents', (req, res) => {
  const { q = '', category = '', date = '' } = req.query;
  let sql = `SELECT id, title, description, category, original_name, mime_type, size_bytes, uploaded_at
             FROM documents WHERE 1=1`;
  const params = {};
  if (q) { sql += ` AND (title LIKE @q ESCAPE '\\' OR original_name LIKE @q ESCAPE '\\' OR description LIKE @q ESCAPE '\\')`; params.q = likeTerm(q); }
  if (category) { sql += ' AND category = @category'; params.category = category; }
  if (date) { sql += " AND date(uploaded_at) = @date"; params.date = date; }
  sql += ' ORDER BY uploaded_at DESC, id DESC';
  res.json(db.prepare(sql).all(params));
});

app.post('/api/documents', documentUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please choose a file to upload.' });
  const title = String(req.body.title || '').trim();
  const category = String(req.body.category || 'General').trim() || 'General';
  const description = String(req.body.description || '').trim();
  if (!title) {
    removeStoredFile(documentDir, req.file.filename);
    return res.status(400).json({ error: 'Document title is required.' });
  }
  const result = db.prepare(`INSERT INTO documents
    (title, description, category, original_name, stored_name, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(title, description, category, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);
  res.status(201).json({ message: 'Document uploaded successfully.', id: result.lastInsertRowid });
});

app.get('/api/documents/:id/file', (req, res) => {
  const item = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Document not found.' });
  const fullPath = path.join(documentDir, path.basename(item.stored_name));
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'The stored file is missing from the server.' });
  const contentType = item.mime_type || mime.lookup(item.original_name) || 'application/octet-stream';
  const previewable = /^(application\/pdf|image\/(png|jpeg|gif|webp)|text\/plain)$/.test(contentType);
  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${previewable ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(item.original_name)}`);
  res.sendFile(fullPath);
});

app.get('/api/documents/:id/download', (req, res) => {
  const item = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Document not found.' });
  const fullPath = path.join(documentDir, path.basename(item.stored_name));
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'The stored file is missing from the server.' });
  res.download(fullPath, item.original_name);
});

app.delete('/api/documents/:id', (req, res) => {
  const item = db.prepare('SELECT stored_name FROM documents WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Document not found.' });
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  removeStoredFile(documentDir, item.stored_name);
  res.json({ message: 'Document deleted.' });
});

// News
app.get('/api/news', (req, res) => {
  const { q = '', category = '', date = '' } = req.query;
  let sql = `SELECT id, title, category, published_at, substr(content, 1, 240) AS preview,
             photo_name, created_at FROM news WHERE 1=1`;
  const params = {};
  if (q) { sql += ` AND (title LIKE @q ESCAPE '\\' OR content LIKE @q ESCAPE '\\')`; params.q = likeTerm(q); }
  if (category) { sql += ' AND category = @category'; params.category = category; }
  if (date) { sql += ' AND published_at = @date'; params.date = date; }
  sql += ' ORDER BY published_at DESC, id DESC';
  res.json(db.prepare(sql).all(params));
});

app.post('/api/news', newsUpload.single('photo'), (req, res) => {
  const title = String(req.body.title || '').trim();
  const category = String(req.body.category || 'General').trim() || 'General';
  const publishedAt = String(req.body.date || '').trim();
  const content = String(req.body.content || '').trim();
  if (!title || !publishedAt || !content || !req.file) {
    if (req.file) removeStoredFile(newsDir, req.file.filename);
    return res.status(400).json({ error: 'Title, category, photo, date, and news content are required.' });
  }
  if (!validDate(publishedAt)) {
    removeStoredFile(newsDir, req.file.filename);
    return res.status(400).json({ error: 'Please provide a valid publication date.' });
  }
  const result = db.prepare(`INSERT INTO news
    (title, category, photo_name, photo_original_name, published_at, content)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(title, category, req.file.filename, req.file.originalname, publishedAt, content);
  res.status(201).json({ message: 'News published successfully.', id: result.lastInsertRowid });
});

app.get('/api/news/:id', (req, res) => {
  const item = db.prepare(`SELECT id, title, category, photo_name, published_at, content, created_at
                           FROM news WHERE id = ?`).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'News article not found.' });
  res.json(item);
});

app.get('/api/news/:id/photo', (req, res) => {
  const item = db.prepare('SELECT photo_name, photo_original_name FROM news WHERE id = ?').get(req.params.id);
  if (!item || !item.photo_name) return res.status(404).end();
  const fullPath = path.join(newsDir, path.basename(item.photo_name));
  if (!fs.existsSync(fullPath)) return res.status(404).end();
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(fullPath);
});

app.delete('/api/news/:id', (req, res) => {
  const item = db.prepare('SELECT photo_name FROM news WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'News article not found.' });
  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  removeStoredFile(newsDir, item.photo_name);
  res.json({ message: 'News article deleted.' });
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'The selected file exceeds the configured upload limit of 2048 MB.'
      : err.message;
    return res.status(400).json({ error: message });
  }
  res.status(400).json({ error: err.message || 'An unexpected server error occurred.' });
});

app.listen(PORT, HOST, () => {
  console.log(`Document & News Management System running at http://localhost:${PORT}`);
  console.log(`LAN access: http://<this-PC-LAN-IP>:${PORT}`);
  console.log('No login is enabled. Only run on a trusted network.');
});

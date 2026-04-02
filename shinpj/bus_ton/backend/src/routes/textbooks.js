import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer configuration for MP3 uploads
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter(_req, file, cb) {
    const allowed = ['.mp3', '.MP3'];
    const ext = path.extname(file.originalname);
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('MP3 파일만 업로드할 수 있습니다.'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
});

const router = Router();

// ── Prepared statements ──────────────────────────────────────────────
const stmtListAll = db.prepare(`
  SELECT t.id, t.title, t.language, t.publisher, t.created_at, t.updated_at,
         (SELECT COUNT(*) FROM mp3_files WHERE textbook_id = t.id) AS mp3_count
  FROM textbooks t ORDER BY t.created_at DESC
`);

const stmtSearch = db.prepare(`
  SELECT t.id, t.title, t.language, t.publisher, t.created_at, t.updated_at,
         (SELECT COUNT(*) FROM mp3_files WHERE textbook_id = t.id) AS mp3_count
  FROM textbooks t WHERE t.title LIKE ? ORDER BY t.created_at DESC
`);

const stmtGetById = db.prepare(`
  SELECT id, title, language, publisher, created_at, updated_at
  FROM textbooks WHERE id = ?
`);

const stmtGetFiles = db.prepare(`
  SELECT id, filename, filepath, file_size, created_at
  FROM mp3_files WHERE textbook_id = ? ORDER BY filename
`);

const stmtInsertTextbook = db.prepare(`
  INSERT INTO textbooks (title, language, publisher) VALUES (?, ?, ?)
`);

const stmtInsertFile = db.prepare(`
  INSERT INTO mp3_files (textbook_id, filename, filepath, file_size) VALUES (?, ?, ?, ?)
`);

const stmtUpdateTextbook = db.prepare(`
  UPDATE textbooks SET title = ?, language = ?, publisher = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const stmtDeleteTextbook = db.prepare('DELETE FROM textbooks WHERE id = ?');

const stmtDeleteFiles = db.prepare('DELETE FROM mp3_files WHERE textbook_id = ?');

// ── GET /api/textbooks ───────────────────────────────────────────────
router.get('/', (req, res) => {
  const { q } = req.query;

  if (q && q.length >= 2) {
    const rows = stmtSearch.all(`%${q}%`);
    return res.json(rows);
  }

  const rows = stmtListAll.all();
  res.json(rows);
});

// ── GET /api/textbooks/:id ───────────────────────────────────────────
router.get('/:id', (req, res) => {
  const textbook = stmtGetById.get(req.params.id);
  if (!textbook) {
    return res.status(404).json({ error: '교재를 찾을 수 없습니다.' });
  }

  const mp3_files = stmtGetFiles.all(textbook.id);
  res.json({ ...textbook, mp3_files });
});

// ── POST /api/textbooks ─────────────────────────────────────────────
router.post('/', upload.array('files'), (req, res) => {
  const { title, language, publisher } = req.body;

  if (!title || !language) {
    return res.status(400).json({ error: 'title과 language는 필수입니다.' });
  }

  if (!['japanese', 'chinese'].includes(language)) {
    return res.status(400).json({ error: "language는 'japanese' 또는 'chinese'여야 합니다." });
  }

  const insertTextbookAndFiles = db.transaction(() => {
    const result = stmtInsertTextbook.run(title, language, publisher || null);
    const textbookId = result.lastInsertRowid;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        stmtInsertFile.run(textbookId, file.originalname, file.filename, file.size);
      }
    }

    return textbookId;
  });

  try {
    const textbookId = insertTextbookAndFiles();
    const textbook = stmtGetById.get(textbookId);
    const mp3_files = stmtGetFiles.all(textbookId);
    res.status(201).json({ ...textbook, mp3_files });
  } catch (err) {
    res.status(500).json({ error: '교재 생성 중 오류가 발생했습니다.', detail: err.message });
  }
});

// ── PUT /api/textbooks/:id ──────────────────────────────────────────
router.put('/:id', (req, res) => {
  const existing = stmtGetById.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '교재를 찾을 수 없습니다.' });
  }

  const { title, language, publisher } = req.body;

  if (language && !['japanese', 'chinese'].includes(language)) {
    return res.status(400).json({ error: "language는 'japanese' 또는 'chinese'여야 합니다." });
  }

  try {
    stmtUpdateTextbook.run(
      title || existing.title,
      language || existing.language,
      publisher !== undefined ? publisher : existing.publisher,
      req.params.id,
    );

    const textbook = stmtGetById.get(req.params.id);
    const mp3_files = stmtGetFiles.all(textbook.id);
    res.json({ ...textbook, mp3_files });
  } catch (err) {
    res.status(500).json({ error: '교재 수정 중 오류가 발생했습니다.', detail: err.message });
  }
});

// ── DELETE /api/textbooks/:id ───────────────────────────────────────
router.delete('/:id', (req, res) => {
  const existing = stmtGetById.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '교재를 찾을 수 없습니다.' });
  }

  // Delete physical MP3 files from disk
  const files = stmtGetFiles.all(req.params.id);
  for (const file of files) {
    const fullPath = path.join(UPLOADS_DIR, file.filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  // CASCADE will handle mp3_files rows
  stmtDeleteTextbook.run(req.params.id);
  res.json({ message: '교재가 삭제되었습니다.', id: Number(req.params.id) });
});

export default router;

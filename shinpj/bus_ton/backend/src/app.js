import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import textbooksRouter from './routes/textbooks.js';
import mailRouter from './routes/mail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded MP3 files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ───────────────────────────────────────────────────────────
app.use('/api/textbooks', textbooksRouter);
app.use('/api/send', mailRouter);

// ── Health check ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handling ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || '서버 내부 오류가 발생했습니다.',
  });
});

export default app;

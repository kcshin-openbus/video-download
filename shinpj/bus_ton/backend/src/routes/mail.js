import { Router } from 'express';
import db from '../db.js';
import { sendMp3Email } from '../services/mailer.js';

const router = Router();

// ── Prepared statements ──────────────────────────────────────────────
const stmtLogs = db.prepare(`
  SELECT sl.*, t.title AS textbook_title
  FROM send_logs sl
  LEFT JOIN textbooks t ON t.id = sl.textbook_id
  ORDER BY sl.created_at DESC
`);

const stmtLogsByStatus = db.prepare(`
  SELECT sl.*, t.title AS textbook_title
  FROM send_logs sl
  LEFT JOIN textbooks t ON t.id = sl.textbook_id
  WHERE sl.status = ?
  ORDER BY sl.created_at DESC
`);

const stmtLogsByDate = db.prepare(`
  SELECT sl.*, t.title AS textbook_title
  FROM send_logs sl
  LEFT JOIN textbooks t ON t.id = sl.textbook_id
  WHERE date(sl.created_at) = ?
  ORDER BY sl.created_at DESC
`);

const stmtLogsByDateAndStatus = db.prepare(`
  SELECT sl.*, t.title AS textbook_title
  FROM send_logs sl
  LEFT JOIN textbooks t ON t.id = sl.textbook_id
  WHERE date(sl.created_at) = ? AND sl.status = ?
  ORDER BY sl.created_at DESC
`);

const stmtDailyStats = db.prepare(`
  SELECT
    date(created_at) AS date,
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
  FROM send_logs
  GROUP BY date(created_at)
  ORDER BY date DESC
  LIMIT 30
`);

// ── POST /api/send ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { textbook_id, email } = req.body;

  if (!textbook_id || !email) {
    return res.status(400).json({ error: 'textbook_id와 email은 필수입니다.' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '유효한 이메일 주소를 입력해주세요.' });
  }

  try {
    const result = await sendMp3Email(textbook_id, email);

    if (result.success) {
      res.json({ message: '메일이 성공적으로 발송되었습니다.', logId: result.logId });
    } else {
      res.status(500).json({
        error: '메일 발송에 실패했습니다.',
        detail: result.error,
        logId: result.logId,
      });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── GET /api/send-logs ──────────────────────────────────────────────
router.get('/logs', (req, res) => {
  const { date, status } = req.query;

  let rows;

  if (date && status) {
    rows = stmtLogsByDateAndStatus.all(date, status);
  } else if (date) {
    rows = stmtLogsByDate.all(date);
  } else if (status) {
    rows = stmtLogsByStatus.all(status);
  } else {
    rows = stmtLogs.all();
  }

  res.json(rows);
});

// ── GET /api/send-logs/stats ────────────────────────────────────────
router.get('/logs/stats', (_req, res) => {
  const rows = stmtDailyStats.all();
  res.json(rows);
});

export default router;

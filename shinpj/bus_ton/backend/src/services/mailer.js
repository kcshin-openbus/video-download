import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// ── Prepared statements ──────────────────────────────────────────────
const stmtInsertLog = db.prepare(`
  INSERT INTO send_logs (textbook_id, recipient_email, status, error_message, sent_at)
  VALUES (?, ?, ?, ?, ?)
`);

const stmtGetTextbook = db.prepare('SELECT * FROM textbooks WHERE id = ?');

const stmtGetFiles = db.prepare('SELECT * FROM mp3_files WHERE textbook_id = ?');

// ── Create transporter ──────────────────────────────────────────────
let cachedTransporter = null;

async function createTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // If SMTP credentials are configured, use them
  if (process.env.SMTP_USER && process.env.SMTP_PASS &&
      process.env.SMTP_USER !== 'your-email@gmail.com') {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  // Fallback: use Ethereal test account (emails viewable at ethereal.email)
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log('[Mailer] Ethereal 테스트 계정 사용:', testAccount.user);
  return cachedTransporter;
}

/**
 * Send MP3 files for a textbook to the given email address.
 * Logs the result to send_logs table.
 *
 * @param {number} textbookId
 * @param {string} email
 * @returns {Promise<{success: boolean, logId: number, error?: string}>}
 */
export async function sendMp3Email(textbookId, email) {
  const textbook = stmtGetTextbook.get(textbookId);
  if (!textbook) {
    throw new Error('교재를 찾을 수 없습니다.');
  }

  const files = stmtGetFiles.all(textbookId);
  if (files.length === 0) {
    throw new Error('해당 교재에 MP3 파일이 없습니다.');
  }

  const attachments = files.map((f) => ({
    filename: f.filename,
    path: path.join(UPLOADS_DIR, f.filepath),
  }));

  const languageLabel = textbook.language === 'japanese' ? '일본어' : '중국어';

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: `[MP3 배달] ${textbook.title} - ${languageLabel} 교재 음원`,
    html: `
      <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px;">
        <h2 style="color: #2563eb;">MP3 배달 서비스</h2>
        <p>안녕하세요,</p>
        <p>요청하신 <strong>${textbook.title}</strong> 교재의 MP3 파일을 첨부합니다.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr style="background: #f1f5f9;">
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>교재명</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${textbook.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>언어</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${languageLabel}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>출판사</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${textbook.publisher || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>파일 수</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${files.length}개</td>
          </tr>
        </table>
        <p style="color: #64748b; font-size: 13px;">
          본 메일은 외국어 교재 MP3 자동 배달 서비스에서 발송되었습니다.
        </p>
      </div>
    `,
    attachments,
  };

  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail(mailOptions);

    // Log Ethereal preview URL if available
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('[Mailer] 미리보기 URL:', previewUrl);
    }

    const result = stmtInsertLog.run(
      textbookId,
      email,
      'sent',
      null,
      new Date().toISOString(),
    );

    return { success: true, logId: Number(result.lastInsertRowid) };
  } catch (err) {
    const result = stmtInsertLog.run(
      textbookId,
      email,
      'failed',
      err.message,
      null,
    );

    return {
      success: false,
      logId: Number(result.lastInsertRowid),
      error: err.message,
    };
  }
}

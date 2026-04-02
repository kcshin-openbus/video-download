import db from '../src/db.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/**
 * Create a small dummy MP3 file (valid MP3 header + silence).
 * This produces a ~200-byte file that any MP3 reader will accept.
 */
function createDummyMp3(filename) {
  const filepath = path.join(UPLOADS_DIR, filename);
  // Minimal MP3 frame: MPEG1 Layer3, 128kbps, 44100Hz, stereo
  // FF FB 90 00 = sync word + valid header
  const header = Buffer.from([
    0xff, 0xfb, 0x90, 0x00,
    // Pad with zeros to make a complete frame (417 bytes for 128kbps/44100)
  ]);
  const padding = Buffer.alloc(413, 0);
  const frame = Buffer.concat([header, padding]);
  fs.writeFileSync(filepath, frame);
  return { filename, filepath: filename, size: frame.length };
}

const textbooks = [
  // Japanese textbooks
  {
    title: '민나노 니홍고 초급1',
    language: 'japanese',
    publisher: '3A Corporation',
    files: ['minna1_lesson01.mp3', 'minna1_lesson02.mp3', 'minna1_lesson03.mp3'],
  },
  {
    title: '민나노 니홍고 초급2',
    language: 'japanese',
    publisher: '3A Corporation',
    files: ['minna2_lesson01.mp3', 'minna2_lesson02.mp3'],
  },
  {
    title: '겐키 일본어 1',
    language: 'japanese',
    publisher: 'Japan Times',
    files: ['genki1_ch01.mp3', 'genki1_ch02.mp3', 'genki1_ch03.mp3'],
  },
  {
    title: '겐키 일본어 2',
    language: 'japanese',
    publisher: 'Japan Times',
    files: ['genki2_ch01.mp3', 'genki2_ch02.mp3'],
  },
  {
    title: '뉴스로 배우는 일본어',
    language: 'japanese',
    publisher: '다락원',
    files: ['news_jp_unit01.mp3'],
  },

  // Chinese textbooks
  {
    title: '신공략 중국어 초급',
    language: 'chinese',
    publisher: '북경어언대학출판사',
    files: ['xingongluee_beginner_01.mp3', 'xingongluee_beginner_02.mp3'],
  },
  {
    title: '신공략 중국어 중급',
    language: 'chinese',
    publisher: '북경어언대학출판사',
    files: ['xingongluee_inter_01.mp3', 'xingongluee_inter_02.mp3', 'xingongluee_inter_03.mp3'],
  },
  {
    title: 'HSK 표준교재 4급',
    language: 'chinese',
    publisher: '인민교육출판사',
    files: ['hsk4_lesson01.mp3', 'hsk4_lesson02.mp3'],
  },
  {
    title: 'HSK 표준교재 5급',
    language: 'chinese',
    publisher: '인민교육출판사',
    files: ['hsk5_lesson01.mp3', 'hsk5_lesson02.mp3', 'hsk5_lesson03.mp3'],
  },
  {
    title: '맛있는 중국어 Level 1',
    language: 'chinese',
    publisher: '맛있는북스',
    files: ['tasty_cn_unit01.mp3'],
  },
];

export function runSeed() {
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM textbooks').get();
  if (count.cnt > 0) {
    console.log('[Seed] 데이터가 이미 존재합니다. 시드를 건너뜁니다.');
    return;
  }

  console.log('[Seed] 시드 데이터를 삽입합니다...');

  const insertTextbook = db.prepare(
    'INSERT INTO textbooks (title, language, publisher) VALUES (?, ?, ?)',
  );
  const insertFile = db.prepare(
    'INSERT INTO mp3_files (textbook_id, filename, filepath, file_size) VALUES (?, ?, ?, ?)',
  );

  const seedAll = db.transaction(() => {
    for (const tb of textbooks) {
      const result = insertTextbook.run(tb.title, tb.language, tb.publisher);
      const textbookId = result.lastInsertRowid;

      for (const filename of tb.files) {
        const { size } = createDummyMp3(filename);
        insertFile.run(textbookId, filename, filename, size);
      }
    }
  });

  seedAll();

  console.log(`[Seed] ${textbooks.length}개 교재, ${textbooks.reduce((s, t) => s + t.files.length, 0)}개 MP3 파일 생성 완료.`);
}

// Allow running directly: node seeds/seed.js
if (process.argv[1]?.includes('seed.js')) {
  runSeed();
}

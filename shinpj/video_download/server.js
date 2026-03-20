const express = require('express');
const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

const YTDLP = process.platform === 'win32' ? 'yt-dlp' : './yt-dlp';
const COOKIES = path.join(__dirname, 'cookies.txt');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

// URL 정규화 (Douyin jingxuan 형식 변환)
function normalizeUrl(url) {
  const m = url.match(/douyin\.com\/.*[?&]modal_id=(\d+)/);
  if (m) return `https://www.douyin.com/video/${m[1]}`;
  return url;
}

// yt-dlp 인수 구성
function buildArgs(url) {
  const args = ['--dump-json', '--no-playlist', '--no-warnings'];
  if (fs.existsSync(COOKIES)) args.push('--cookies', COOKIES);
  args.push(url);
  return args;
}

// 포맷 파싱
function parseFormats(info) {
  const combinedFormats = {};
  let bestAudio = null;
  const dashVideo = {};

  for (const f of (info.formats || [])) {
    if (!f.url || f.ext === 'mhtml') continue;
    const hasV = f.vcodec && f.vcodec !== 'none';
    const hasA = f.acodec && f.acodec !== 'none';
    if (!hasV && !hasA) continue;

    const height = f.height ? parseInt(f.height) : 0;
    const tbr = f.tbr ? parseFloat(f.tbr) : 0;

    if (hasV && hasA) {
      const label = height ? `${height}p` : (f.format_note || f.format_id);
      if (!combinedFormats[label]) {
        combinedFormats[label] = { quality: label, url: f.url, ext: f.ext || 'mp4', needs_merge: false, format_id: '' };
      }
    } else if (hasV && !hasA && height > 0) {
      if (!dashVideo[height] || tbr > (dashVideo[height].tbr || 0)) {
        dashVideo[height] = { height, url: f.url, ext: f.ext || 'mp4', format_id: f.format_id, tbr };
      }
    } else if (!hasV && hasA) {
      const abr = f.abr ? parseFloat(f.abr) : 0;
      if (!bestAudio || abr > parseFloat(bestAudio.abr || 0)) bestAudio = f;
    }
  }

  let formats = Object.values(combinedFormats);
  const maxCombined = formats.reduce((m, f) => Math.max(m, parseInt(f.quality) || 0), 0);

  // DASH 고화질 (로컬에서는 머지 지원)
  for (const [h, f] of Object.entries(dashVideo).sort((a, b) => b[0] - a[0])) {
    if (parseInt(h) > maxCombined) {
      formats.push({ quality: `${h}p`, url: f.url, ext: 'mp4', needs_merge: true, format_id: f.format_id });
    }
  }

  // 통합 포맷 없으면 DASH 단독 표시
  if (Object.keys(combinedFormats).length === 0) {
    for (const [h, f] of Object.entries(dashVideo)) {
      formats.push({ quality: `${h}p`, url: f.url, ext: f.ext, needs_merge: false, format_id: '' });
    }
    if (bestAudio) {
      formats.push({ quality: `오디오 ${Math.round(bestAudio.abr || 0)}kbps`, url: bestAudio.url, ext: bestAudio.ext || 'm4a', needs_merge: false, format_id: '' });
    }
  }

  if (formats.length === 0 && info.url) {
    formats.push({ quality: '기본', url: info.url, ext: info.ext || 'mp4', needs_merge: false, format_id: '' });
  }

  return formats.sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0));
}

// 영상 정보 API
app.post('/api/info', (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL을 입력해주세요.' });

  url = normalizeUrl(url.trim());
  const args = buildArgs(url);

  const proc = spawn(YTDLP, args, { timeout: 30000 });
  let stdout = '', stderr = '';
  proc.stdout.on('data', d => stdout += d);
  proc.stderr.on('data', d => stderr += d);

  proc.on('close', code => {
    const lines = stdout.trim().split('\n');
    let jsonLine = '';
    for (const line of lines.reverse()) {
      if (line.trim().startsWith('{')) { jsonLine = line; break; }
    }

    const info = jsonLine ? JSON.parse(jsonLine) : null;
    if (!info) {
      const msg = stderr.includes('cookies') || stderr.includes('login')
        ? 'cookies.txt 설정이 필요합니다.'
        : '영상 정보를 가져오지 못했습니다. URL을 확인해주세요.';
      return res.status(500).json({ error: msg });
    }

    res.json({
      title: info.title || '제목 없음',
      thumbnail: info.thumbnail || '',
      orig_url: url,
      formats: parseFormats(info)
    });
  });
});

// 다운로드 API (모든 포맷 서버 경유 - 오디오 보장)
app.get('/api/download', (req, res) => {
  const { orig_url, format_id, filename } = req.query;
  if (!orig_url) return res.status(400).send('파라미터 오류');

  const dlName = (filename || 'video').replace(/[^\w가-힣.\-]/g, '_') + '.mp4';
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(dlName)}`);
  res.setHeader('Content-Type', 'video/mp4');

  const fmt = format_id ? `${format_id}+bestaudio/best[ext=mp4]/best` : 'bestvideo+bestaudio/best[ext=mp4]/best';
  const args = ['--merge-output-format', 'mp4', '-f', fmt, '-o', '-', '--no-warnings'];
  if (fs.existsSync(COOKIES)) args.push('--cookies', COOKIES);
  args.push(orig_url);

  const proc = spawn(YTDLP, args);
  proc.stdout.pipe(res);
  proc.stderr.on('data', () => {});
  req.on('close', () => proc.kill());
});

app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));

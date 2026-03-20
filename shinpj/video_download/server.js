const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

function handleInfo(req, res) {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL을 입력해주세요.' });
  }

  let safeUrl = url.replace(/"/g, '');

  // Douyin jingxuan URL 자동 변환: ?modal_id=숫자 → /video/숫자
  const modalMatch = safeUrl.match(/[?&]modal_id=(\d+)/);
  if (modalMatch) {
    safeUrl = `https://www.douyin.com/video/${modalMatch[1]}`;
  }

  exec(`yt-dlp --dump-json "${safeUrl}"`, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
      console.error('yt-dlp 오류:', stderr);
      const msg = stderr.includes('cookies') ? 'cookies.txt 설정이 필요합니다. Douyin 탭의 안내를 따라 설정해주세요. (로그인 불필요)' : '영상 정보를 가져오지 못했습니다. URL을 확인해주세요.';
      return res.status(500).json({ error: msg });
    }

    let info;
    try {
      info = JSON.parse(stdout);
    } catch (e) {
      return res.status(500).json({ error: '응답 파싱 오류가 발생했습니다.' });
    }

    const formats = [];
    const seen = new Set();

    if (info.formats) {
      info.formats
        .filter(f => f.url && (f.vcodec !== 'none' || f.acodec !== 'none') && f.ext !== 'mhtml')
        .forEach(f => {
          const hasVideo = f.vcodec && f.vcodec !== 'none';
          const hasAudio = f.acodec && f.acodec !== 'none';
          const resolution = f.height ? `${f.height}p` : (f.format_note || '');
          let label = resolution || f.format_id;
          if (hasVideo && !hasAudio) label += ' (영상만)';
          else if (!hasVideo && hasAudio) label = '오디오 ' + (f.abr ? `${Math.round(f.abr)}kbps` : label);
          if (!seen.has(label)) {
            seen.add(label);
            formats.push({ quality: label, url: f.url, ext: f.ext || 'mp4' });
          }
        });
    }

    if (formats.length === 0 && info.url) {
      formats.push({ quality: '기본', url: info.url, ext: info.ext || 'mp4' });
    }

    formats.sort((a, b) => {
      const aNum = parseInt(a.quality) || 0;
      const bNum = parseInt(b.quality) || 0;
      return bNum - aNum;
    });

    res.json({
      title: info.title || '제목 없음',
      thumbnail: info.thumbnail || '',
      formats
    });
  });
}

function handleDownload(req, res) {
  const { url, filename } = req.query;
  if (!url) return res.status(400).send('URL이 없습니다.');

  const parsedUrl = new URL(url);
  const proto = parsedUrl.protocol === 'https:' ? https : http;
  const name = filename || 'video.mp4';

  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
  res.setHeader('Content-Type', 'video/mp4');

  const request = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': parsedUrl.origin } }, (stream) => {
    if (stream.statusCode === 302 || stream.statusCode === 301) {
      res.redirect('/api/download?url=' + encodeURIComponent(stream.headers.location) + '&filename=' + encodeURIComponent(name));
      return;
    }
    if (stream.headers['content-length']) res.setHeader('Content-Length', stream.headers['content-length']);
    stream.pipe(res);
  });

  request.on('error', () => res.status(500).send('다운로드 오류'));
}

// 로컬 Node.js 와 닷홈 PHP 경로 모두 지원
app.post('/api/info', handleInfo);
app.post('/api/info.php', handleInfo);
app.get('/api/download', handleDownload);
app.get('/api/download.php', handleDownload);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

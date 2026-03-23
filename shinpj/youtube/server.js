require('dotenv').config();
const express = require('express');
const path = require('path');
const { translateContent } = require('./src/translate');
const { getAuthUrl, handleCallback, isAuthorized, getVideoInfo, applyLocalizations } = require('./src/youtube');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'static')));

// ── 인증 상태 확인 ──────────────────────────────────────
app.get('/api/auth/status', (req, res) => {
  res.json({ authorized: isAuthorized() });
});

// ── YouTube OAuth2 시작 ──────────────────────────────────
app.get('/api/auth/login', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(400).json({ error: '.env에 GOOGLE_CLIENT_ID가 설정되지 않았습니다.' });
  }
  res.redirect(getAuthUrl());
});

// ── OAuth2 콜백 ──────────────────────────────────────────
app.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect('/?auth=fail');
  try {
    await handleCallback(code);
    res.redirect('/?auth=success');
  } catch (err) {
    res.redirect('/?auth=fail&msg=' + encodeURIComponent(err.message));
  }
});

// ── 번역 ─────────────────────────────────────────────────
app.post('/api/translate', async (req, res) => {
  const { title, description, target_langs } = req.body;
  if (!description || !target_langs?.length) {
    return res.status(400).json({ error: '설명글과 번역 언어를 선택해주세요.' });
  }
  try {
    const result = await translateContent(title || '', description, target_langs);
    res.json(result);
  } catch (err) {
    console.error('[번역 오류]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 영상 정보 조회 ────────────────────────────────────────
app.get('/api/video/:id', async (req, res) => {
  if (!isAuthorized()) return res.status(401).json({ error: 'YouTube 인증이 필요합니다.', needAuth: true });
  try {
    const info = await getVideoInfo(req.params.id);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 다국어 설명 적용 ──────────────────────────────────────
app.post('/api/apply', async (req, res) => {
  const { video_id, localizations } = req.body;
  if (!video_id || !localizations) {
    return res.status(400).json({ error: '영상 ID와 번역 데이터가 필요합니다.' });
  }
  if (!isAuthorized()) {
    return res.status(401).json({ error: 'YouTube 인증이 필요합니다.', needAuth: true });
  }
  try {
    await applyLocalizations(video_id, localizations);
    res.json({ success: true, applied: Object.keys(localizations) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n서버 실행 중: http://localhost:${PORT}`);
  console.log('.env 파일에 API 키를 설정하세요. (.env.example 참고)\n');
});

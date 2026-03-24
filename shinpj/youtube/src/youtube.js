const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '..', 'credentials', 'token.json');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback'
  );
}

function getAuthUrl() {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    prompt: 'consent'
  });
}

async function handleCallback(code) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

function isAuthorized() {
  return fs.existsSync(TOKEN_PATH);
}

function getAuthorizedClient() {
  if (!isAuthorized()) throw new Error('YouTube 인증이 필요합니다.');
  const oauth2 = getOAuth2Client();
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oauth2.setCredentials(tokens);
  oauth2.on('tokens', (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged));
  });
  return oauth2;
}

// 영상 현재 정보 조회 (제목, 설명, 기존 localizations)
async function getVideoInfo(videoId) {
  const auth = getAuthorizedClient();
  const youtube = google.youtube({ version: 'v3', auth });
  const res = await youtube.videos.list({
    part: ['snippet', 'localizations'],
    id: [videoId]
  });
  const item = res.data.items?.[0];
  if (!item) throw new Error(`영상 ID "${videoId}"를 찾을 수 없습니다.`);
  return {
    title: item.snippet.title,
    description: item.snippet.description,
    defaultLanguage: item.snippet.defaultLanguage || 'ko',
    categoryId: item.snippet.categoryId || '22',
    localizations: item.localizations || {}
  };
}

// 다국어 제목/설명 localizations 적용
async function applyLocalizations(videoId, localizations) {
  const auth = getAuthorizedClient();
  const youtube = google.youtube({ version: 'v3', auth });

  // 기존 localizations 조회 후 병합
  const existing = await getVideoInfo(videoId);
  const merged = { ...existing.localizations };

  for (const [lang, data] of Object.entries(localizations)) {
    merged[lang] = {
      title: data.title || existing.title,
      description: data.description || ''
    };
  }

  const res = await youtube.videos.update({
    part: ['snippet', 'localizations'],
    requestBody: {
      id: videoId,
      snippet: {
        title: existing.title,
        description: existing.description,
        defaultLanguage: existing.defaultLanguage || 'ko',
        categoryId: existing.categoryId || '22'
      },
      localizations: merged
    }
  });

  return res.data;
}

module.exports = { getAuthUrl, handleCallback, isAuthorized, getVideoInfo, applyLocalizations };

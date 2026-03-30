require('dotenv').config();
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const cache = new NodeCache();
const API_KEY = process.env.YOUTUBE_API_KEY;
const PORT = process.env.PORT || 3000;

// 기간별 캐시 TTL (초)
const CACHE_TTL = {
  all:     3600,   // 전체: 1시간
  daily:   1800,   // 일간: 30분
  weekly:  10800,  // 주간: 3시간
  monthly: 21600,  // 월간: 6시간
  yearly:  43200,  // 연간: 12시간
};

// API 요청 속도 제한: 1분에 최대 20회
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.static('public'));
app.use('/api', apiLimiter);

const CATEGORIES = [
  { id: '10', name: '음악',       keyword: '음악' },
  { id: '20', name: '게임',       keyword: '게임' },
  { id: '17', name: '스포츠',     keyword: '스포츠' },
  { id: '28', name: '과학/기술',  keyword: '기술' },
  { id: '26', name: '교육/노하우', keyword: '교육' },
  { id: '24', name: '엔터테인먼트', keyword: '예능' },
  { id: '25', name: '뉴스/정치',  keyword: '뉴스' },
  { id: '22', name: '사람/블로그', keyword: '브이로그' },
];

// 기간 → publishedAfter 날짜 계산
const PERIOD_DAYS = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };

function getPublishedAfter(period) {
  if (!PERIOD_DAYS[period]) return null;
  const d = new Date();
  d.setDate(d.getDate() - PERIOD_DAYS[period]);
  return d.toISOString();
}

// ISO 8601 duration → 초 변환
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 3600) + (parseInt(match[2] || 0) * 60) + parseInt(match[3] || 0);
}

// 기간 없음 — videos.list (chart=mostPopular)
async function fetchVideos(categoryId, maxResults = 10, pageToken = '') {
  const params = {
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    videoCategoryId: categoryId,
    regionCode: 'KR',
    maxResults,
    key: API_KEY,
  };
  if (pageToken) params.pageToken = pageToken;
  const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', { params });
  return res.data;
}

// search.list → videos.list (통계 포함) 공통 헬퍼
async function searchAndFetchVideos(searchParams) {
  const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', { params: searchParams });
  const items = searchRes.data.items || [];
  const nextPageToken = searchRes.data.nextPageToken || null;
  if (items.length === 0) return { items: [], nextPageToken };

  const ids = items.map(i => i.id.videoId).join(',');
  const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: { part: 'snippet,statistics,contentDetails', id: ids, key: API_KEY },
  });
  return { items: videoRes.data.items || [], nextPageToken };
}

// 기간 있음 — search.list → videos.list (통계 포함)
async function fetchVideosByPeriod(categoryId, maxResults = 10, publishedAfter, pageToken = '', keyword = '', videoDuration = null, order = 'viewCount') {
  // 1단계: search.list로 영상 ID 목록 획득
  const searchParams = {
    part: 'snippet',
    type: 'video',
    relevanceLanguage: 'ko',
    order,
    publishedAfter,
    maxResults,
    key: API_KEY,
  };
  if (keyword) searchParams.q = keyword;
  if (categoryId) searchParams.videoCategoryId = categoryId;
  if (pageToken) searchParams.pageToken = pageToken;
  if (videoDuration) searchParams.videoDuration = videoDuration;

  const result = await searchAndFetchVideos(searchParams);

  // 카테고리 필터로 결과가 없으면 키워드만으로 재시도
  if (result.items.length === 0 && categoryId && keyword) {
    const fallbackParams = { ...searchParams };
    delete fallbackParams.videoCategoryId;
    const fallback = await searchAndFetchVideos(fallbackParams);
    return fallback;
  }

  return result;
}

// 쇼츠 전용 검색 (videoDuration=short, search.list 사용)
async function fetchShorts(categoryId, maxResults = 25, pageToken = '', keyword = '', publishedAfter = null, order = 'viewCount') {
  const searchParams = {
    part: 'snippet',
    type: 'video',
    relevanceLanguage: 'ko',
    order,
    videoDuration: 'short',
    maxResults,
    key: API_KEY,
  };
  if (keyword) searchParams.q = keyword;
  if (categoryId) searchParams.videoCategoryId = categoryId;
  if (pageToken) searchParams.pageToken = pageToken;
  if (publishedAfter) searchParams.publishedAfter = publishedAfter;

  const result = await searchAndFetchVideos(searchParams);

  // 카테고리로 결과 없으면 키워드만으로 재시도
  if (result.items.length === 0 && categoryId && keyword) {
    const fallbackParams = { ...searchParams };
    delete fallbackParams.videoCategoryId;
    return await searchAndFetchVideos(fallbackParams);
  }

  return result;
}

// 채널 구독자 수 조회
async function fetchSubscriberCount(channelId) {
  const cacheKey = `channel:${channelId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
    params: { part: 'statistics', id: channelId, key: API_KEY },
  });
  const count = parseInt(res.data.items?.[0]?.statistics?.subscriberCount || 0);
  cache.set(cacheKey, count, 3600);
  return count;
}

// 영상 데이터 정규화
async function normalizeVideo(item) {
  const s = item.statistics || {};
  const subscriberCount = await fetchSubscriberCount(item.snippet.channelId);
  const durationSeconds = parseDuration(item.contentDetails?.duration || 'PT0S');

  return {
    id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    publishedAt: item.snippet.publishedAt,
    viewCount: parseInt(s.viewCount || 0),
    likeCount: parseInt(s.likeCount || 0),
    commentCount: parseInt(s.commentCount || 0),
    subscriberCount,
    durationSeconds,
  };
}

// GET /api/categories
app.get('/api/categories', (_req, res) => {
  res.json(CATEGORIES);
});

// GET /api/trending?period=daily|weekly|monthly|yearly
app.get('/api/trending', async (req, res) => {
  const period = req.query.period || 'all';
  const cacheKey = `trending:${period}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  const publishedAfter = getPublishedAfter(period);

  try {
    const results = await Promise.all(
      CATEGORIES.map(async (cat) => {
        try {
          let items;
          if (publishedAfter) {
            const data = await fetchVideosByPeriod(cat.id, 3, publishedAfter, '', cat.keyword);
            items = data.items;
          } else {
            const data = await fetchVideos(cat.id, 3);
            items = data.items || [];
          }
          const videos = await Promise.all(items.map(normalizeVideo));
          return { ...cat, videos };
        } catch (err) {
          console.error(`카테고리 ${cat.name}(${cat.id}) 실패:`, JSON.stringify(err.response?.data || err.message));
          return { ...cat, videos: [] };
        }
      })
    );
    cache.set(cacheKey, results, CACHE_TTL[period] || 3600);
    res.json(results);
  } catch (err) {
    console.error(JSON.stringify(err.response?.data || err.message));
    res.status(500).json({ error: 'YouTube API 호출 실패' });
  }
});

// videoType 필터 적용 (all | shorts | long)
function applyVideoTypeFilter(videos, videoType) {
  if (videoType === 'shorts') return videos.filter(v => v.durationSeconds <= 60);
  if (videoType === 'long')   return videos.filter(v => v.durationSeconds > 60);
  return videos;
}

// 정규화된 영상 배열을 order에 따라 정렬
function sortVideos(videos, order) {
  if (order === 'date') return [...videos].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  if (order === 'rating') return [...videos].sort((a, b) => b.likeCount - a.likeCount);
  return [...videos].sort((a, b) => b.viewCount - a.viewCount); // viewCount (기본)
}

// GET /api/category/:id?period=...&order=...&videoType=all|shorts|long
app.get('/api/category/:id', async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const pageToken = req.query.pageToken || '';
  const period = req.query.period || 'all';
  const videoType = req.query.videoType || 'all';
  const order = ['viewCount', 'rating', 'date'].includes(req.query.order) ? req.query.order : 'viewCount';

  const cacheKey = `category:${id}:${period}:${videoType}:${order}:${limit}:${pageToken}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  const publishedAfter = getPublishedAfter(period);

  try {
    let items, nextPageToken;
    const category = CATEGORIES.find((c) => c.id === id);

    if (videoType === 'shorts') {
      // 쇼츠: videoDuration=short로 검색 후 60초 이하 필터
      const fetchCount = Math.min(limit * 3, 50);
      const data = await fetchShorts(id, fetchCount, pageToken, category?.keyword, publishedAfter, order);
      items = data.items;
      nextPageToken = data.nextPageToken;
    } else if (publishedAfter) {
      const data = await fetchVideosByPeriod(id, limit, publishedAfter, pageToken, category?.keyword, null, order);
      items = data.items;
      nextPageToken = data.nextPageToken;
    } else {
      // chart=mostPopular은 자체 정렬 불가 → 정규화 후 서버 정렬
      const data = await fetchVideos(id, limit, pageToken);
      items = data.items || [];
      nextPageToken = data.nextPageToken || null;
    }

    const all = await Promise.all(items.map(normalizeVideo));
    const filtered = applyVideoTypeFilter(all, videoType);
    const videos = sortVideos(filtered, order);

    const result = { categoryId: id, categoryName: category?.name || id, videos, nextPageToken };
    cache.set(cacheKey, result, CACHE_TTL[period] || 3600);
    res.json(result);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'YouTube API 호출 실패' });
  }
});

// GET /api/video/:id
app.get('/api/video/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `video:${id}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'snippet,statistics,contentDetails', id, key: API_KEY },
    });
    const item = videoRes.data.items?.[0];
    if (!item) return res.status(404).json({ error: '영상을 찾을 수 없습니다' });

    const video = await normalizeVideo(item);
    const daysSincePublish = Math.max(1, Math.floor(
      (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    ));
    const likeRate = video.viewCount > 0 ? ((video.likeCount / video.viewCount) * 100).toFixed(2) : 0;
    // 업로드 후 경과 분 기준 평균 분당 조회수
    const minutesSincePublish = daysSincePublish * 24 * 60;
    const viewsPerMinute = Math.round(video.viewCount / minutesSincePublish);
    // 하루 평균 조회수
    const dailyViews = Math.round(video.viewCount / daysSincePublish);
    const result = { ...video, daysSincePublish, likeRate: parseFloat(likeRate), viewsPerMinute, dailyViews };
    cache.set(cacheKey, result, 1800);
    res.json(result);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'YouTube API 호출 실패' });
  }
});

// GET /api/video/:id/comments — 좋아요 많은 댓글 TOP 10
app.get('/api/video/:id/comments', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `comments:${id}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const commentsRes = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
      params: {
        part: 'snippet',
        videoId: id,
        order: 'relevance',
        maxResults: 50,
        key: API_KEY,
      },
    });

    const items = commentsRes.data.items || [];
    const comments = items
      .map(item => {
        const c = item.snippet.topLevelComment.snippet;
        return {
          author: c.authorDisplayName,
          authorPhoto: c.authorProfileImageUrl,
          text: c.textDisplay,
          likeCount: c.likeCount || 0,
          publishedAt: c.publishedAt,
        };
      })
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 10);

    cache.set(cacheKey, comments, 3600);
    res.json(comments);
  } catch (err) {
    // 댓글 비활성화된 영상 등 처리
    if (err.response?.data?.error?.code === 403) {
      return res.json([]);
    }
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: '댓글 조회 실패' });
  }
});

// 트렌딩 영상 제목에서 키워드 추출 (최대 maxItems개 영상, 불용어 제거)
const KO_STOPWORDS = new Set(['이', '그', '저', '것', '수', '등', '및', '또', '의', '을', '를', '이', '가', '은', '는', '에', '에서', '로', '으로', '와', '과', '하', '한', '하는', '있는', '없는', 'for', 'the', 'a', 'an', 'in', 'of', 'at', 'by', 'to']);

// categoryId 없으면 전체 트렌딩, 있으면 해당 카테고리 영상에서 추출
async function extractTrendingKeywords(limit = 50, categoryId = null) {
  const params = { part: 'snippet', chart: 'mostPopular', regionCode: 'KR', maxResults: 50, key: API_KEY };
  if (categoryId) params.videoCategoryId = categoryId;

  const trendRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', { params });
  const items = trendRes.data.items || [];
  const texts = items.map(i => i.snippet.title + ' ' + (i.snippet.tags || []).join(' ')).join(' ');
  const words = texts.split(/[\s,\[\]()\-_|#!?]+/)
    .map(w => w.replace(/[^\w가-힣]/g, ''))
    .filter(w => w.length >= 2 && !KO_STOPWORDS.has(w));
  const freq = words.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {});
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

// GET /api/keywords?limit=20|50|100&categoryId=10
app.get('/api/keywords', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const categoryId = req.query.categoryId || null;
  const cacheKey = `keywords:${categoryId || 'all'}:${limit}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    let keywords = [];

    // 전체(카테고리 없음) + 20개 이하: suggest API 먼저 시도
    if (!categoryId && limit <= 20) {
      try {
        const response = await axios.get('https://suggestqueries.google.com/complete/search', {
          params: { client: 'firefox', ds: 'yt', q: '', hl: 'ko', gl: 'KR' },
          headers: { 'Accept-Language': 'ko-KR,ko;q=0.9' },
          responseType: 'json',
          timeout: 5000,
        });
        const data = response.data;
        keywords = Array.isArray(data) && Array.isArray(data[1])
          ? data[1].filter(k => typeof k === 'string' && k.length > 0).slice(0, limit)
          : [];
      } catch (_) {}
    }

    // suggest 실패 or 카테고리 지정 or 50/100 요청 → 트렌딩 영상 제목에서 추출
    if (keywords.length === 0) {
      keywords = await extractTrendingKeywords(limit, categoryId);
    }

    cache.set(cacheKey, keywords, 1800);
    res.json(keywords);
  } catch (err) {
    console.error('키워드 조회 실패:', err.message);
    res.json([]);
  }
});

// GET /api/video/search?q=검색어&videoType=all|shorts|long
app.get('/api/video/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ error: '검색어를 입력해주세요' });
  const videoType = req.query.videoType || 'all';

  const cacheKey = `video_search:${q}:${videoType}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const searchParams = {
      part: 'snippet', type: 'video', q,
      maxResults: videoType === 'shorts' ? 40 : 24,
      relevanceLanguage: 'ko', regionCode: 'KR', key: API_KEY,
    };
    if (videoType === 'shorts') searchParams.videoDuration = 'short';

    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', { params: searchParams });

    const items = searchRes.data.items || [];
    if (items.length === 0) return res.json([]);

    const ids = items.map(i => i.id.videoId).join(',');
    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'snippet,statistics,contentDetails', id: ids, key: API_KEY },
    });

    const all = await Promise.all((videoRes.data.items || []).map(normalizeVideo));
    const videos = applyVideoTypeFilter(all, videoType);
    cache.set(cacheKey, videos, 1800);
    res.json(videos);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'YouTube API 호출 실패' });
  }
});

// GET /api/channel/search?q=채널명
app.get('/api/channel/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ error: '검색어를 입력해주세요' });

  const cacheKey = `channel_search:${q}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', type: 'channel', q, maxResults: 10, relevanceLanguage: 'ko', key: API_KEY },
    });

    const items = searchRes.data.items || [];
    if (items.length === 0) return res.json([]);

    // 채널 통계 일괄 조회 (type=channel 일 때 ID는 item.id.channelId)
    const ids = items.map(i => i.id.channelId).join(',');
    const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'statistics,snippet', id: ids, key: API_KEY },
    });

    const statsMap = {};
    (statsRes.data.items || []).forEach(c => { statsMap[c.id] = c; });

    const results = items
      .map(item => {
        const ch = statsMap[item.id.channelId] || {};
        const s = ch.statistics || {};
        const snippet = ch.snippet || item.snippet;
        return {
          id: item.id.channelId,
          title: snippet.title || item.snippet.title,
          description: snippet.description || item.snippet.description || '',
          thumbnail: snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.medium?.url || '',
          subscriberCount: parseInt(s.subscriberCount || 0),
          viewCount: parseInt(s.viewCount || 0),
          videoCount: parseInt(s.videoCount || 0),
        };
      })
      .sort((a, b) => b.subscriberCount - a.subscriberCount); // 구독자 많은 순 정렬

    cache.set(cacheKey, results, 1800);
    res.json(results);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'YouTube API 호출 실패' });
  }
});

// GET /api/channel/:id — 채널 상세 분석
app.get('/api/channel/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `channel_detail:${id}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    // 채널 기본 정보 + 통계
    const chRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet,statistics,brandingSettings', id, key: API_KEY },
    });
    const ch = chRes.data.items?.[0];
    if (!ch) return res.status(404).json({ error: '채널을 찾을 수 없습니다' });

    const s = ch.statistics || {};

    // 채널의 인기 영상 (최근 업로드 기준 + 조회수 정렬)
    const videoSearchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', channelId: id, type: 'video', order: 'viewCount', maxResults: 12, key: API_KEY },
    });
    const videoIds = (videoSearchRes.data.items || []).map(i => i.id.videoId).join(',');

    let videos = [];
    if (videoIds) {
      const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'snippet,statistics,contentDetails', id: videoIds, key: API_KEY },
      });
      videos = await Promise.all((videoRes.data.items || []).map(async item => {
        const vs = item.statistics || {};
        return {
          id: item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || '',
          publishedAt: item.snippet.publishedAt,
          viewCount: parseInt(vs.viewCount || 0),
          likeCount: parseInt(vs.likeCount || 0),
          commentCount: parseInt(vs.commentCount || 0),
          durationSeconds: parseDuration(item.contentDetails?.duration || 'PT0S'),
        };
      }));
    }

    const subscriberCount = parseInt(s.subscriberCount || 0);
    const totalViews = parseInt(s.viewCount || 0);
    const videoCount = parseInt(s.videoCount || 0);
    const avgViewsPerVideo = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;

    const result = {
      id: ch.id,
      title: ch.snippet.title,
      description: ch.snippet.description,
      thumbnail: ch.snippet.thumbnails?.medium?.url || '',
      banner: ch.brandingSettings?.image?.bannerExternalUrl || null,
      publishedAt: ch.snippet.publishedAt,
      subscriberCount,
      totalViews,
      videoCount,
      avgViewsPerVideo,
      videos,
    };

    cache.set(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'YouTube API 호출 실패' });
  }
});

// 언어별 메타 (relevanceLang: API 파라미터, regionCode: mostPopular 기준 국가)
// langFilter: 고유 문자 보유 언어만 설정 (제목/채널명 검증용)
const LANG_META = {
  ko: { name: '한국어',    relevanceLang: 'ko', regionCode: 'KR', q: '쇼츠',          langFilter: /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/ },
  ja: { name: '日本語',    relevanceLang: 'ja', regionCode: 'JP', q: 'ショート',        langFilter: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/ },
  hi: { name: 'हिन्दी',   relevanceLang: 'hi', regionCode: 'IN', q: 'शॉर्ट्स',        langFilter: /[\u0900-\u097F]/ },
  zh: { name: '中文',      relevanceLang: 'zh-TW', regionCode: 'TW', q: '短片',        langFilter: /[\u4E00-\u9FFF]/ },
  ar: { name: 'العربية',  relevanceLang: 'ar', regionCode: 'SA', q: 'shorts',         langFilter: /[\u0600-\u06FF]/ },
  th: { name: 'ภาษาไทย', relevanceLang: 'th', regionCode: 'TH', q: 'shorts',         langFilter: /[\u0E00-\u0E7F]/ },
  en: { name: 'English',  relevanceLang: 'en', regionCode: 'US', q: 'shorts trending' },
  fr: { name: 'Français', relevanceLang: 'fr', regionCode: 'FR', q: 'shorts tendance' },
  de: { name: 'Deutsch',  relevanceLang: 'de', regionCode: 'DE', q: 'shorts trending' },
  pt: { name: 'Português',relevanceLang: 'pt', regionCode: 'BR', q: 'shorts viral' },
  es: { name: 'Español',  relevanceLang: 'es', regionCode: 'MX', q: 'shorts viral' },
  id: { name: 'Indonesia',relevanceLang: 'id', regionCode: 'ID', q: 'shorts viral' },
};

// videos.list 아이템 → 쇼츠 객체 변환
function normalizeShortItem(item, source, region) {
  const s = item.statistics || {};
  const durationSeconds = parseDuration(item.contentDetails?.duration || 'PT0S');
  return {
    id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    publishedAt: item.snippet.publishedAt,
    viewCount: parseInt(s.viewCount || 0),
    likeCount: parseInt(s.likeCount || 0),
    commentCount: parseInt(s.commentCount || 0),
    durationSeconds,
    region,
    source, // 'trending' | 'popular'
  };
}

// search.list로 쇼츠 ID 수집 → videos.list로 상세 조회
// 403 quota 에러는 re-throw, 나머지 에러는 빈 배열 반환
async function fetchPopularShorts(params, existingIds) {
  try {
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', { params });
    const ids = (searchRes.data.items || [])
      .map(i => i.id.videoId)
      .filter(id => !existingIds.has(id));
    if (ids.length === 0) return [];

    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'snippet,statistics,contentDetails', id: ids.join(','), key: API_KEY },
    });
    return videoRes.data.items || [];
  } catch (err) {
    if (err.response?.data?.error?.code === 403) throw err; // quota 에러는 위로 전파
    return [];
  }
}

// GET /api/trending-shorts?lang=ko&categoryId=
app.get('/api/trending-shorts', async (req, res) => {
  const lang = (req.query.lang || 'ko').toLowerCase();
  const categoryId = req.query.categoryId || '';
  const MIN_RESULTS = 24;
  const MAX_RESULTS = 40;

  if (!LANG_META[lang]) return res.status(400).json({ error: '지원하지 않는 언어입니다' });

  const cacheKey = `trending_shorts:${lang}:${categoryId}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  const meta = LANG_META[lang];
  const seenIds = new Set();
  let allItems = [];

  // strict=true: langFilter 적용, strict=false: 필터 없이 채우기
  const addItems = (rawItems, source, strict = true) => {
    const normalized = rawItems
      .map(item => normalizeShortItem(item, source, lang))
      .filter(v => {
        if (v.durationSeconds <= 0 || v.durationSeconds > 180) return false;
        if (seenIds.has(v.id)) return false;
        if (strict && meta.langFilter) {
          const text = v.title + ' ' + v.channelTitle;
          if (!meta.langFilter.test(text)) return false;
        }
        return true;
      });
    const toAdd = normalized.slice(0, MAX_RESULTS - allItems.length);
    toAdd.forEach(v => seenIds.add(v.id));
    allItems.push(...toAdd);
  };

  const after30 = new Date(Date.now() -  30 * 24 * 60 * 60 * 1000).toISOString();
  const after90 = new Date(Date.now() -  90 * 24 * 60 * 60 * 1000).toISOString();
  const base = { part: 'snippet', type: 'video',
                 videoDuration: 'short', relevanceLanguage: meta.relevanceLang,
                 regionCode: meta.regionCode, order: 'viewCount', key: API_KEY };

  let quotaExhausted = false;

  try {
    // ── A: mostPopular (트렌딩, videos.list = 1 유닛) ──
    try {
      const trendParams = {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular', regionCode: meta.regionCode, maxResults: 50, key: API_KEY,
      };
      if (categoryId) trendParams.videoCategoryId = categoryId;
      const trendRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', { params: trendParams });
      addItems(trendRes.data.items || [], 'trending', true);
    } catch (err) {
      if (err.response?.data?.error?.code === 403) {
        quotaExhausted = true;
        console.warn('trending-shorts quota 소진 (A단계)');
      } else {
        throw err;
      }
    }

    // ── B: 최근 30일 + 키워드 검색 (search.list = 100 유닛) ──
    if (!quotaExhausted && allItems.length < MIN_RESULTS) {
      try {
        const p = { ...base, q: meta.q, publishedAfter: after30, maxResults: 50 };
        if (categoryId) p.videoCategoryId = categoryId;
        addItems(await fetchPopularShorts(p, seenIds), 'popular', true);
      } catch (err) {
        if (err.response?.data?.error?.code === 403) {
          quotaExhausted = true;
          console.warn('trending-shorts quota 소진 (B단계)');
        } else throw err;
      }
    }

    // ── C: 최근 90일 검색 (search.list = 100 유닛) ──
    if (!quotaExhausted && allItems.length < MIN_RESULTS) {
      try {
        const p = { ...base, q: meta.q, publishedAfter: after90, maxResults: 50 };
        if (categoryId) p.videoCategoryId = categoryId;
        addItems(await fetchPopularShorts(p, seenIds), 'popular', true);
      } catch (err) {
        if (err.response?.data?.error?.code === 403) {
          quotaExhausted = true;
          console.warn('trending-shorts quota 소진 (C단계)');
        } else throw err;
      }
    }

    // ── D: langFilter 없이 90일 보충 (strict=false, 최후 수단) ──
    if (!quotaExhausted && allItems.length < 12) {
      try {
        const p = { ...base, publishedAfter: after90, maxResults: 50 };
        addItems(await fetchPopularShorts(p, seenIds), 'popular', false);
      } catch (err) {
        if (err.response?.data?.error?.code === 403) {
          quotaExhausted = true;
          console.warn('trending-shorts quota 소진 (D단계)');
        } else throw err;
      }
    }

    const merged = allItems.sort((a, b) => b.viewCount - a.viewCount);
    const result = { items: merged, quotaExhausted };
    cache.set(cacheKey, result, 3600); // 캐시 1시간 (쿼터 절약)
    res.json(result);
  } catch (err) {
    console.error('trending-shorts 실패:', err.response?.data || err.message);
    res.status(500).json({ error: 'YouTube API 호출 실패' });
  }
});

// POST /api/translate — 텍스트 한국어 번역
app.post('/api/translate', express.json(), async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: '텍스트가 없습니다' });

  try {
    const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: 'ko',
        dt: 't',
        q: text,
      },
      timeout: 8000,
    });

    // 응답 형식: [[["번역문","원문",...],...],...]
    const data = response.data;
    const translated = Array.isArray(data[0])
      ? data[0].map(seg => seg[0]).join('')
      : '';

    if (!translated) return res.status(500).json({ error: '번역 결과 없음' });
    res.json({ translated });
  } catch (err) {
    console.error('번역 실패:', err.message);
    res.status(500).json({ error: '번역 서비스 오류' });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

// ── 테마 토글 ──
(function () {
  const saved = localStorage.getItem('theme') || 'dark';
  if (saved === 'light') document.body.classList.add('light');

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function updateBtn() {
      const isLight = document.body.classList.contains('light');
      btn.textContent = isLight ? '🌙 다크 모드' : '☀️ 라이트 모드';
    }
    updateBtn();

    btn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
      updateBtn();
    });
  });
})();

// ── 차트 공통 색상 (테마 반응) ──
function chartColors() {
  const light = document.body.classList.contains('light');
  return {
    text:    light ? '#333' : '#ccc',
    grid:    light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    accent:  '#ff4444',
    blue:    '#3a6fd8',
    green:   '#2eb872',
  };
}

// 영상 통계 바 차트
function renderBarChart(views, likes, comments) {
  const c = chartColors();
  const ctx = document.getElementById('chart-bar');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['조회수', '좋아요', '댓글'],
      datasets: [{
        data: [views, likes, comments],
        backgroundColor: [c.accent, c.blue, c.green],
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ' ' + fmt(ctx.raw) },
        },
      },
      scales: {
        x: { ticks: { color: c.text }, grid: { color: c.grid } },
        y: {
          ticks: { color: c.text, callback: v => fmt(v) },
          grid: { color: c.grid },
        },
      },
    },
  });
}

// 좋아요율 도넛 게이지
function renderGaugeChart(likeRate) {
  const c = chartColors();
  const ctx = document.getElementById('chart-gauge');
  if (!ctx) return;
  const rate = Math.min(parseFloat(likeRate), 100);
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [rate, 100 - rate],
        backgroundColor: [c.accent, c.grid],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      }],
    },
    options: {
      responsive: true,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });
  const label = document.getElementById('gauge-label');
  if (label) label.textContent = likeRate + '%';
}

// 채널 인기 영상 가로 바 차트
function renderChannelViewsChart(videos) {
  const c = chartColors();
  const ctx = document.getElementById('chart-channel-views');
  if (!ctx) return;
  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 12);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(v => v.title.length > 20 ? v.title.slice(0, 20) + '…' : v.title),
      datasets: [{
        label: '조회수',
        data: sorted.map(v => v.viewCount),
        backgroundColor: sorted.map((_, i) => i === 0 ? c.accent : c.blue),
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ' ' + fmt(ctx.raw) },
        },
      },
      scales: {
        x: {
          ticks: { color: c.text, callback: v => fmt(v) },
          grid: { color: c.grid },
        },
        y: { ticks: { color: c.text, font: { size: 11 } }, grid: { display: false } },
      },
    },
  });
}

// 숫자 포맷 (1234567 → 123.4만)
function fmt(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  return n.toLocaleString();
}

// 초 → m:ss
function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${s}초`;
}

// 날짜 포맷
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

// 기간 버튼 공통 초기화
function initPeriodButtons(onChangeFn) {
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChangeFn(btn.dataset.period);
    });
  });
}

// ────────────────────────────────────────────
// 메인 화면: 분야별 TOP 3
// ────────────────────────────────────────────
async function loadTrending(period = 'all') {
  const loading = document.getElementById('loading');
  const grid = document.getElementById('trending-grid');

  loading.style.display = 'block';
  grid.innerHTML = '';

  try {
    const res = await fetch(`/api/trending?period=${period}`);
    const categories = await res.json();

    loading.style.display = 'none';

    categories.forEach(cat => {
      if (cat.videos.length === 0) return;
      const section = document.createElement('div');
      section.className = 'category-section';
      section.innerHTML = `
        <h2>
          ${cat.name}
          <a href="/category.html?id=${cat.id}&name=${encodeURIComponent(cat.name)}&period=${period}">전체 보기 →</a>
        </h2>
        <div class="video-cards">
          ${cat.videos.map(v => videoCard(v)).join('')}
        </div>
      `;
      grid.appendChild(section);
    });

    if (grid.innerHTML === '') {
      grid.innerHTML = '<p style="color:#aaa;text-align:center;padding:40px">해당 기간에 영상이 없습니다.</p>';
    }
  } catch (e) {
    loading.textContent = '데이터를 불러오지 못했습니다.';
  }
}

function videoCard(v) {
  return `
    <a class="video-card" href="/video.html?id=${v.id}">
      <img src="${v.thumbnail}" alt="${v.title}" loading="lazy">
      <div class="card-info">
        <div class="card-title">${v.title}</div>
        <div class="card-channel">${v.channelTitle}</div>
        <div class="card-stats">
          <span>👁 ${fmt(v.viewCount)}</span>
          <span>👍 ${fmt(v.likeCount)}</span>
          <span>👥 ${fmt(v.subscriberCount)}</span>
        </div>
      </div>
    </a>
  `;
}

// 인기 검색어 로딩
let keywordState = { limit: 20, categoryId: '' };

async function loadKeywords(limit, categoryId) {
  if (limit !== undefined) keywordState.limit = limit;
  if (categoryId !== undefined) keywordState.categoryId = categoryId;

  const el = document.getElementById('keywords-list');
  el.textContent = '불러오는 중...';

  const params = new URLSearchParams({ limit: keywordState.limit });
  if (keywordState.categoryId) params.set('categoryId', keywordState.categoryId);

  try {
    const res = await fetch(`/api/keywords?${params}`);
    const keywords = await res.json();
    if (!keywords.length) {
      el.textContent = '검색어를 불러오지 못했습니다.';
      return;
    }
    el.innerHTML = keywords.map(k => `
      <button class="keyword-tag" onclick="document.getElementById('channel-search-input').value='${k.replace(/'/g, "\\'")}';">${k}</button>
    `).join('');
  } catch (e) {
    el.textContent = '검색어를 불러오지 못했습니다.';
  }
}

function initKeywordLimitBtns() {
  document.querySelectorAll('.klimit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.klimit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadKeywords(parseInt(btn.dataset.limit));
    });
  });
  document.querySelectorAll('.kcat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.kcat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadKeywords(undefined, btn.dataset.cat);
    });
  });
}

// 메인 페이지 진입점
function initMain() {
  initChannelSearch();
  initPeriodButtons((period) => loadTrending(period));
  initKeywordLimitBtns();
  loadTrending('all');
  loadKeywords(20);
}

// ────────────────────────────────────────────
// 분야 목록 페이지
// ────────────────────────────────────────────
let currentPage = { categoryId: null, nextPageToken: null, order: 'viewCount', period: 'all', videoType: 'all', total: 0 };

async function loadCategory() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const name = params.get('name') || '분야';
  const period = params.get('period') || 'all';

  document.getElementById('category-title').textContent = name + ' 인기 영상';
  document.title = name + ' 인기 영상';

  currentPage.categoryId = id;
  currentPage.period = period;

  // 기간 버튼 초기 활성화
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });

  initPeriodButtons((newPeriod) => {
    currentPage.period = newPeriod;
    currentPage.nextPageToken = null;
    currentPage.total = 0;
    document.getElementById('video-list').innerHTML = '';
    fetchCategoryPage(true);
  });

  // 영상 유형 버튼
  document.querySelectorAll('.vtype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vtype-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPage.videoType = btn.dataset.vtype;
      currentPage.nextPageToken = null;
      currentPage.total = 0;
      document.getElementById('video-list').innerHTML = '';
      fetchCategoryPage(true);
    });
  });

  // 정렬 버튼
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPage.order = btn.dataset.order;
      currentPage.nextPageToken = null;
      currentPage.total = 0;
      document.getElementById('video-list').innerHTML = '';
      fetchCategoryPage(true);
    });
  });

  document.getElementById('load-more-btn').addEventListener('click', () => {
    fetchCategoryPage(false);
  });

  fetchCategoryPage(true);
}

async function fetchCategoryPage(reset) {
  const loading = document.getElementById('loading');
  const loadMoreWrap = document.getElementById('load-more-wrap');
  const countEl = document.getElementById('video-count');

  loading.style.display = 'block';
  loadMoreWrap.style.display = 'none';

  try {
    const params = new URLSearchParams({
      limit: 10,
      order: currentPage.order,
      period: currentPage.period,
      videoType: currentPage.videoType,
    });
    if (!reset && currentPage.nextPageToken) {
      params.set('pageToken', currentPage.nextPageToken);
    }

    const res = await fetch(`/api/category/${currentPage.categoryId}?${params}`);
    const data = await res.json();

    loading.style.display = 'none';

    const list = document.getElementById('video-list');
    data.videos.forEach(v => {
      const row = document.createElement('a');
      row.className = 'video-row';
      row.href = `/video.html?id=${v.id}&back=${encodeURIComponent(location.href)}`;
      row.innerHTML = `
        <img src="${v.thumbnail}" alt="${v.title}" loading="lazy">
        <div class="row-info">
          <div class="row-title">${v.title}</div>
          <div class="row-channel">${v.channelTitle}</div>
          <div class="row-stats">
            <span>👁 조회수 ${fmt(v.viewCount)}</span>
            <span>👍 좋아요 ${fmt(v.likeCount)}</span>
            <span>👥 구독자 ${fmt(v.subscriberCount)}</span>
            <span>💬 댓글 ${fmt(v.commentCount)}</span>
          </div>
        </div>
      `;
      list.appendChild(row);
    });

    currentPage.total += data.videos.length;
    currentPage.nextPageToken = data.nextPageToken;

    if (currentPage.nextPageToken && currentPage.total < 100) {
      loadMoreWrap.style.display = 'block';
      countEl.textContent = `현재 ${currentPage.total}개 표시 중`;
    }
  } catch (e) {
    loading.textContent = '데이터를 불러오지 못했습니다.';
  }
}

// ────────────────────────────────────────────
// 채널 검색 (메인 화면)
// ────────────────────────────────────────────
// 메인 화면 검색창 — search.html로 이동
function initChannelSearch() {
  const input = document.getElementById('channel-search-input');
  const btn = document.getElementById('channel-search-btn');
  let searchType = 'channel';

  document.querySelectorAll('.search-type-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.search-type-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      searchType = b.dataset.type;
      input.placeholder = searchType === 'channel'
        ? '채널명, 키워드, URL 입력 (예: 요리, 게임, 여행 vlog...)'
        : '영상 키워드 입력 (예: 아이유 신곡, 롤 공략, 요리 레시피...)';
    });
  });

  function goSearch() {
    const q = input.value.trim();
    if (!q) return;
    // 채널 URL 직접 입력
    if (searchType === 'channel') {
      const urlMatch = q.match(/youtube\.com\/(?:channel\/|@)([\w-]+)/);
      if (urlMatch) { location.href = `/channel.html?id=${urlMatch[1]}`; return; }
    }
    location.href = `/search.html?q=${encodeURIComponent(q)}&type=${searchType}`;
  }

  btn.addEventListener('click', goSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') goSearch(); });
}

// ────────────────────────────────────────────
// 검색 결과 페이지
// ────────────────────────────────────────────
async function initSearchPage() {
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  const type = params.get('type') || 'channel';

  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  const loading = document.getElementById('loading');
  const resultsEl = document.getElementById('search-results');
  const metaEl = document.getElementById('search-meta');
  const vtypeWrap = document.getElementById('vtype-wrap');

  input.value = q;

  // 타입 버튼 초기화
  document.querySelectorAll('.search-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });

  // 영상 유형이면 vtype 토글 표시
  if (type === 'video') vtypeWrap.style.display = 'flex';

  document.querySelectorAll('.search-type-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.search-type-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      vtypeWrap.style.display = b.dataset.type === 'video' ? 'flex' : 'none';
    });
  });

  // 검색 실행 함수
  function goSearch() {
    const newQ = input.value.trim();
    if (!newQ) return;
    const newType = document.querySelector('.search-type-btn.active')?.dataset.type || 'channel';
    if (newType === 'channel') {
      const urlMatch = newQ.match(/youtube\.com\/(?:channel\/|@)([\w-]+)/);
      if (urlMatch) { location.href = `/channel.html?id=${urlMatch[1]}`; return; }
    }
    location.href = `/search.html?q=${encodeURIComponent(newQ)}&type=${newType}`;
  }

  btn.addEventListener('click', goSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') goSearch(); });

  if (!q) return;

  document.title = `"${q}" 검색 결과`;

  async function runSearch() {
    loading.style.display = 'block';
    resultsEl.innerHTML = '';
    metaEl.style.display = 'none';

    try {
      let url;
      if (type === 'channel') {
        url = `/api/channel/search?q=${encodeURIComponent(q)}`;
      } else {
        const vtype = document.querySelector('.vtype-btn.active')?.dataset.vtype || 'all';
        url = `/api/video/search?q=${encodeURIComponent(q)}&videoType=${vtype}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      loading.style.display = 'none';
      metaEl.style.display = 'block';
      metaEl.textContent = `"${q}" ${type === 'channel' ? '채널' : '영상'} 검색 결과 ${data.length}건`;

      if (!data.length) {
        resultsEl.innerHTML = '<p class="no-result">검색 결과가 없습니다.</p>';
        return;
      }

      if (type === 'channel') {
        resultsEl.innerHTML = data.map(ch => `
          <a class="channel-card" href="/channel.html?id=${ch.id}">
            <img src="${ch.thumbnail}" alt="${ch.title}">
            <div class="channel-card-info">
              <div class="channel-card-title">${ch.title}</div>
              <div class="channel-card-stats">
                <span>👥 ${fmt(ch.subscriberCount)}</span>
                <span>👁 ${fmt(ch.viewCount)}</span>
                <span>🎬 ${ch.videoCount.toLocaleString()}개</span>
              </div>
              <div class="channel-card-desc">${(ch.description || '').slice(0, 80)}${(ch.description || '').length > 80 ? '...' : ''}</div>
            </div>
          </a>
        `).join('');
      } else {
        resultsEl.innerHTML = `<div class="video-list">${data.map(v => `
          <a class="video-row" href="/video.html?id=${v.id}&back=${encodeURIComponent(location.href)}">
            <img src="${v.thumbnail}" alt="${v.title}" loading="lazy">
            <div class="row-info">
              <div class="row-title">${v.title}</div>
              <div class="row-channel">${v.channelTitle}</div>
              <div class="row-stats">
                <span>👁 ${fmt(v.viewCount)}</span>
                <span>👍 ${fmt(v.likeCount)}</span>
                <span>💬 ${fmt(v.commentCount)}</span>
              </div>
            </div>
          </a>
        `).join('')}</div>`;
      }
    } catch (e) {
      loading.style.display = 'none';
      resultsEl.innerHTML = '<p class="no-result">검색 중 오류가 발생했습니다.</p>';
    }
  }

  // vtype 버튼 클릭 시 재검색 (영상 검색에서만)
  document.querySelectorAll('.vtype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vtype-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (type === 'video') runSearch();
    });
  });

  runSearch();
}

// ────────────────────────────────────────────
// 채널 상세 분석 페이지
// ────────────────────────────────────────────
async function loadChannelDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const loading = document.getElementById('loading');
  const detail = document.getElementById('channel-detail');

  try {
    const res = await fetch(`/api/channel/${id}`);
    const ch = await res.json();

    if (ch.error) {
      loading.textContent = ch.error;
      return;
    }

    loading.style.display = 'none';
    detail.style.display = 'block';
    document.title = ch.title + ' — 채널 분석';

    if (ch.banner) {
      document.getElementById('channel-banner').style.backgroundImage = `url(${ch.banner})`;
    }

    document.getElementById('ch-thumbnail').src = ch.thumbnail;
    document.getElementById('ch-thumbnail').alt = ch.title;
    document.getElementById('ch-title').textContent = ch.title;
    document.getElementById('ch-desc').textContent = ch.description.slice(0, 150) + (ch.description.length > 150 ? '...' : '');
    document.getElementById('ch-since').textContent = '채널 개설: ' + new Date(ch.publishedAt).toLocaleDateString('ko-KR');
    document.getElementById('ch-link').href = `https://www.youtube.com/channel/${ch.id}`;

    document.getElementById('ch-subscribers').textContent = fmt(ch.subscriberCount);
    document.getElementById('ch-views').textContent = fmt(ch.totalViews);
    document.getElementById('ch-video-count').textContent = ch.videoCount.toLocaleString() + '개';
    document.getElementById('ch-avg-views').textContent = fmt(ch.avgViewsPerVideo);

    renderChannelViewsChart(ch.videos);

    const list = document.getElementById('ch-video-list');
    ch.videos.forEach(v => {
      const row = document.createElement('a');
      row.className = 'video-row';
      row.href = `/video.html?id=${v.id}&back=${encodeURIComponent(location.href)}`;
      row.innerHTML = `
        <img src="${v.thumbnail}" alt="${v.title}" loading="lazy">
        <div class="row-info">
          <div class="row-title">${v.title}</div>
          <div class="row-channel">${new Date(v.publishedAt).toLocaleDateString('ko-KR')} 업로드</div>
          <div class="row-stats">
            <span>👁 조회수 ${fmt(v.viewCount)}</span>
            <span>👍 좋아요 ${fmt(v.likeCount)}</span>
            <span>💬 댓글 ${fmt(v.commentCount)}</span>
          </div>
        </div>
      `;
      list.appendChild(row);
    });
  } catch (e) {
    loading.textContent = '데이터를 불러오지 못했습니다.';
  }
}

// ────────────────────────────────────────────
// 영상 상세 분석 페이지
// ────────────────────────────────────────────
async function loadVideoDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const back = params.get('back');

  if (back) document.getElementById('back-btn').href = back;

  const loading = document.getElementById('loading');
  const detail = document.getElementById('video-detail');

  try {
    const res = await fetch(`/api/video/${id}`);
    const v = await res.json();

    loading.style.display = 'none';
    detail.style.display = 'block';
    loadComments(id);

    document.title = v.title;
    document.getElementById('v-thumbnail').src = v.thumbnail;
    document.getElementById('v-thumbnail').alt = v.title;
    document.getElementById('v-title').textContent = v.title;
    document.getElementById('v-channel').textContent = '📺 ' + v.channelTitle;
    document.getElementById('v-published').textContent = '업로드: ' + fmtDate(v.publishedAt);
    document.getElementById('v-link').href = `https://www.youtube.com/watch?v=${v.id}`;

    document.getElementById('v-views').textContent = fmt(v.viewCount);
    document.getElementById('v-likes').textContent = fmt(v.likeCount);
    document.getElementById('v-comments').textContent = fmt(v.commentCount);
    document.getElementById('v-like-rate').textContent = v.likeRate + '%';
    document.getElementById('v-subscribers').textContent = fmt(v.subscriberCount);
    document.getElementById('v-duration').textContent = fmtDuration(v.durationSeconds);
    document.getElementById('v-views-per-min').textContent = fmt(v.viewsPerMinute);
    document.getElementById('v-days').textContent = v.daysSincePublish + '일 전';
    document.getElementById('v-daily-views').textContent = fmt(v.dailyViews);

    renderBarChart(v.viewCount, v.likeCount, v.commentCount);
    renderGaugeChart(v.likeRate);
  } catch (e) {
    loading.textContent = '데이터를 불러오지 못했습니다.';
  }
}

async function loadComments(videoId) {
  const loadingEl = document.getElementById('comments-loading');
  const listEl = document.getElementById('comments-list');

  try {
    const res = await fetch(`/api/video/${videoId}/comments`);
    const comments = await res.json();

    loadingEl.style.display = 'none';
    listEl.style.display = 'block';

    if (!comments.length) {
      listEl.innerHTML = '<p class="no-result">댓글을 불러올 수 없습니다. (댓글 비활성화 또는 제한된 영상)</p>';
      return;
    }

    listEl.innerHTML = comments.map((c, i) => `
      <div class="comment-card" data-idx="${i}">
        <div class="comment-header">
          <img src="${c.authorPhoto}" alt="${c.author}" class="comment-avatar">
          <div class="comment-meta">
            <span class="comment-author">${c.author}</span>
            <span class="comment-date">${new Date(c.publishedAt).toLocaleDateString('ko-KR')}</span>
          </div>
          <div class="comment-likes">👍 ${c.likeCount.toLocaleString()}</div>
        </div>
        <div class="comment-text" data-original="${encodeURIComponent(c.text)}">${c.text}</div>
        <div class="comment-actions">
          <button class="translate-btn" onclick="translateComment(this)">🌐 번역</button>
        </div>
      </div>
    `).join('');

  } catch (e) {
    loadingEl.textContent = '댓글을 불러오지 못했습니다.';
  }
}

// ────────────────────────────────────────────
// 해외 급상승 쇼츠 페이지
// ────────────────────────────────────────────
function loadTrendingShorts() {
  let currentLang = 'ko';
  let currentCat = '';

  const loading = document.getElementById('loading');
  const grid = document.getElementById('shorts-grid');
  const meta = document.getElementById('shorts-meta');

  async function fetchShortsTrending() {
    loading.style.display = 'block';
    grid.innerHTML = '';
    meta.textContent = '';

    try {
      const params = new URLSearchParams({ lang: currentLang });
      if (currentCat) params.set('categoryId', currentCat);

      const res = await fetch(`/api/trending-shorts?${params}`);
      const data = await res.json();

      loading.style.display = 'none';

      const items = data.items || data; // 하위 호환

      if (data.quotaExhausted && items.length === 0) {
        grid.innerHTML = '<p style="color:#aaa;text-align:center;padding:40px">⚠️ YouTube API 할당량이 소진되었습니다.<br>한국시간 오후 4시 이후 다시 이용해주세요.</p>';
        return;
      }

      if (!items.length) {
        grid.innerHTML = '<p style="color:#aaa;text-align:center;padding:40px">해당 언어 쇼츠를 찾지 못했습니다.</p>';
        return;
      }

      const langLabel = document.querySelector('.region-btn.active')?.dataset.label || currentLang;
      meta.textContent = `${langLabel} 상승 쇼츠 ${items.length}개${data.quotaExhausted ? ' (일부 결과)' : ''}`;

      grid.innerHTML = items.map(v => `
        <a class="shorts-card" href="/video.html?id=${v.id}&back=${encodeURIComponent(location.href)}" target="_blank">
          <div class="shorts-thumb-wrap">
            <img src="${v.thumbnail}" alt="${v.title}" loading="lazy">
            <span class="shorts-duration">${v.durationSeconds}초</span>
            <span class="shorts-source-badge ${v.source === 'trending' ? 'badge-trending' : 'badge-popular'}">
              ${v.source === 'trending' ? '📈 트렌딩' : '🔥 인기'}
            </span>
          </div>
          <div class="shorts-info">
            <div class="shorts-title">${v.title}</div>
            <div class="shorts-channel">${v.channelTitle}</div>
            <div class="shorts-stats">
              <span>👁 ${fmt(v.viewCount)}</span>
              <span>👍 ${fmt(v.likeCount)}</span>
            </div>
          </div>
        </a>
      `).join('');
    } catch (e) {
      loading.style.display = 'none';
      grid.innerHTML = '<p style="color:#aaa;text-align:center;padding:40px">데이터를 불러오지 못했습니다.</p>';
    }
  }

  // 언어 탭
  document.querySelectorAll('.region-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      fetchShortsTrending();
    });
  });

  // 분야 탭
  document.querySelectorAll('.scat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      fetchShortsTrending();
    });
  });

  fetchShortsTrending();
}

// 댓글 번역
async function translateComment(btn) {
  const card = btn.closest('.comment-card');
  const textEl = card.querySelector('.comment-text');
  const original = decodeURIComponent(textEl.dataset.original);

  // 이미 번역된 상태면 원문으로 복원
  if (btn.dataset.translated === '1') {
    textEl.innerHTML = original;
    btn.textContent = '🌐 번역';
    btn.dataset.translated = '0';
    return;
  }

  btn.textContent = '번역 중...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: original }),
    });
    const data = await res.json();

    if (data.translated) {
      textEl.innerHTML = `
        <span class="translated-text">${data.translated}</span>
        <span class="original-text">${original}</span>
      `;
      btn.textContent = '🔄 원문 보기';
      btn.dataset.translated = '1';
    } else {
      btn.textContent = '🌐 번역';
    }
  } catch (e) {
    btn.textContent = '🌐 번역';
  } finally {
    btn.disabled = false;
  }
}

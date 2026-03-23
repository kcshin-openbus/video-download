# TRD - 유튜브 자막 자동 번역 업로드 도구

## 1. 기술 개요

Node.js 기반 웹 애플리케이션으로, YouTube Data API v3와 번역 API를 연동하여 자막 번역 및 업로드를 자동화한다.

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│                 Browser (UI)                 │
│  - 영상 URL 입력                              │
│  - 언어 선택 / 예외 구간 설정                  │
│  - 번역 결과 편집 및 미리보기                  │
└───────────────────┬─────────────────────────┘
                    │ HTTP REST
┌───────────────────▼─────────────────────────┐
│              Express Server                  │
│  /api/subtitle  - 자막 추출                   │
│  /api/translate - 자막 번역                   │
│  /api/upload    - 유튜브 업로드               │
└────┬──────────────────────┬─────────────────┘
     │                      │
┌────▼──────┐        ┌──────▼──────────┐
│ yt-dlp    │        │ YouTube Data    │
│ (자막 추출)│        │ API v3          │
└───────────┘        │ (OAuth2 업로드) │
                     └──────┬──────────┘
                            │
                     ┌──────▼──────────┐
                     │ Translation API │
                     │ (Google/DeepL)  │
                     └─────────────────┘
```

---

## 3. 기술 스택

| 영역 | 기술 |
|------|------|
| 런타임 | Node.js 18+ |
| 웹 프레임워크 | Express.js |
| 자막 추출 | yt-dlp (`--write-subs`, `--sub-langs`) |
| 자막 파싱 | `subtitle` npm 패키지 (SRT/VTT 파싱) |
| 번역 API | Google Cloud Translation API v2 또는 DeepL API |
| YouTube API | YouTube Data API v3 (`captions.insert`) |
| 인증 | Google OAuth 2.0 (youtube.force-ssl 스코프) |
| 프론트엔드 | Vanilla JS + HTML/CSS (정적 파일) |

---

## 4. 디렉토리 구조

```
youtube/
├── docs/
│   ├── PRD.md
│   └── TRD.md
├── static/
│   └── index.html          # 웹 UI
├── src/
│   ├── subtitle.js         # 자막 추출 및 파싱
│   ├── translate.js        # 번역 처리 모듈
│   ├── youtube.js          # YouTube API 연동
│   └── utils.js            # SRT/VTT 파싱 유틸
├── tmp/                    # 임시 자막 파일
├── credentials/
│   └── oauth2.json         # Google OAuth 인증 정보 (gitignore)
├── server.js               # Express 진입점
└── package.json
```

---

## 5. API 설계

### 5.1 `POST /api/subtitle` - 자막 추출

**Request**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "lang": "ko"
}
```

**Response**
```json
{
  "title": "영상 제목",
  "video_id": "VIDEO_ID",
  "subtitles": [
    { "index": 1, "start": "00:00:01,000", "end": "00:00:03,500", "text": "안녕하세요" },
    { "index": 2, "start": "00:00:04,000", "end": "00:00:06,000", "text": "오늘 영상에서는" }
  ]
}
```

### 5.2 `POST /api/translate` - 자막 번역

**Request**
```json
{
  "subtitles": [ "..." ],
  "target_langs": ["en", "ja", "zh-CN"],
  "exclude_ranges": [
    { "from": "00:00:10,000", "to": "00:00:15,000" }
  ]
}
```

**Response**
```json
{
  "en": [
    { "index": 1, "start": "00:00:01,000", "end": "00:00:03,500", "text": "Hello" }
  ],
  "ja": [ "..." ],
  "zh-CN": [ "..." ]
}
```

### 5.3 `POST /api/upload` - 유튜브 자막 업로드

**Request**
```json
{
  "video_id": "VIDEO_ID",
  "translations": {
    "en": [ "..." ],
    "ja": [ "..." ]
  }
}
```

**Response**
```json
{
  "success": true,
  "uploaded": ["en", "ja"],
  "failed": []
}
```

---

## 6. 핵심 구현 상세

### 6.1 자막 추출 (yt-dlp)

```bash
yt-dlp --write-subs --write-auto-subs --sub-langs ko \
       --skip-download --sub-format srt \
       -o "tmp/%(id)s" <VIDEO_URL>
```

- `--write-auto-subs`: 업로더가 자막 미등록 시 자동 생성 자막 사용
- 추출된 `.ko.srt` 파일을 파싱하여 JSON 구조로 변환

### 6.2 번역 예외 처리

```javascript
function translateWithExclusion(subtitles, excludeRanges, targetLang) {
  return subtitles.map(sub => {
    const excluded = excludeRanges.some(range =>
      timeToMs(sub.start) >= timeToMs(range.from) &&
      timeToMs(sub.end) <= timeToMs(range.to)
    );
    if (excluded) return { ...sub }; // 원문 유지
    return { ...sub, text: callTranslateAPI(sub.text, targetLang) };
  });
}
```

### 6.3 YouTube 자막 업로드 (OAuth2)

YouTube Data API `captions.insert` 엔드포인트 사용:
- `snippet.videoId`: 대상 영상 ID
- `snippet.language`: 자막 언어 코드 (BCP-47)
- `snippet.name`: 자막 트랙 이름
- `body`: SRT 형식 자막 파일 (multipart/form-data)

인증 흐름:
1. 최초 실행 시 브라우저에서 Google OAuth 동의 화면 표시
2. 토큰을 `credentials/token.json`에 저장하여 재사용

---

## 7. 환경 변수

| 변수명 | 설명 |
|--------|------|
| `PORT` | 서버 포트 (기본값: 3000) |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `TRANSLATE_API_KEY` | Google Translate 또는 DeepL API 키 |
| `TRANSLATE_PROVIDER` | `google` 또는 `deepl` |

---

## 8. 보안 고려사항

- API 키 및 OAuth 토큰은 `.env` 파일 관리, `.gitignore`에 반드시 포함
- YouTube OAuth 스코프 최소 권한 원칙: `https://www.googleapis.com/auth/youtube.force-ssl`
- 번역 API 호출 시 자막 텍스트 외 개인정보 전송 금지

---

## 9. 구현 단계

| 단계 | 내용 |
|------|------|
| 1단계 | yt-dlp 자막 추출 및 SRT 파싱 구현 |
| 2단계 | 번역 API 연동 및 예외 처리 로직 구현 |
| 3단계 | 웹 UI 구현 (자막 편집 / 미리보기) |
| 4단계 | YouTube OAuth2 인증 및 자막 업로드 구현 |
| 5단계 | 통합 테스트 및 에러 핸들링 보완 |

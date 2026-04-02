# TRD: 외국어 교재 MP3 자동 배달 서비스

## 1. 기술 아키텍처 개요

```
┌─────────────────────────────────────────────┐
│              Frontend (SPA)                  │
│         React + Tailwind CSS                 │
├──────────────┬──────────────────────────────┤
│  User Page   │      Admin Dashboard         │
└──────┬───────┴──────────┬───────────────────┘
       │                  │
       │     REST API     │
       ▼                  ▼
┌─────────────────────────────────────────────┐
│           Backend (Node.js + Express)        │
├─────────────┬───────────┬───────────────────┤
│ Search API  │ CRUD API  │   Mail Module     │
└──────┬──────┴─────┬─────┴────────┬──────────┘
       │            │              │
       ▼            ▼              ▼
┌───────────┐ ┌──────────┐ ┌─────────────────┐
│  SQLite   │ │ File     │ │ SMTP / Email    │
│  Database │ │ Storage  │ │ Service         │
└───────────┘ └──────────┘ └─────────────────┘
```

## 2. 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|-----------|
| Frontend | React 18 + Vite | 빠른 개발, HMR 지원 |
| Styling | Tailwind CSS 4 | 유틸리티 기반 빠른 UI 구축 |
| Backend | Node.js + Express | 경량, 빠른 프로토타이핑 |
| Database | SQLite (better-sqlite3) | 설치 불필요, 파일 기반, 24시간 해커톤에 적합 |
| Email | Nodemailer | Node.js 표준 이메일 라이브러리, SMTP/Gmail 지원 |
| File Storage | 로컬 파일 시스템 | 단순성, 별도 스토리지 서비스 불필요 |

## 3. 프로젝트 디렉토리 구조

```
bus_ton/
├── docs/                    # 문서
│   ├── PRD.md
│   └── TRD.md
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # 재사용 컴포넌트
│   │   ├── pages/
│   │   │   ├── UserPage.jsx       # 학습자 페이지
│   │   │   └── AdminPage.jsx      # 관리자 대시보드
│   │   ├── api/             # API 호출 함수
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/                 # Express 서버
│   ├── src/
│   │   ├── routes/
│   │   │   ├── textbooks.js       # 교재 CRUD + 검색 API
│   │   │   └── mail.js            # 메일 발송 API
│   │   ├── models/
│   │   │   ├── textbook.js        # 교재 모델
│   │   │   └── sendlog.js         # 발송 이력 모델
│   │   ├── services/
│   │   │   └── mailer.js          # Nodemailer 발송 로직
│   │   ├── db.js                  # SQLite 초기화
│   │   └── app.js                 # Express 앱 설정
│   ├── seeds/
│   │   └── seed.js                # 더미 데이터 셋팅
│   ├── uploads/                   # MP3 파일 저장소
│   └── package.json
├── .env.example
└── README.md
```

## 4. 데이터베이스 스키마

### textbooks 테이블

```sql
CREATE TABLE textbooks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  language    TEXT NOT NULL CHECK(language IN ('japanese', 'chinese')),
  publisher   TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### mp3_files 테이블

```sql
CREATE TABLE mp3_files (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  textbook_id  INTEGER NOT NULL REFERENCES textbooks(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  filepath     TEXT NOT NULL,
  file_size    INTEGER,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### send_logs 테이블

```sql
CREATE TABLE send_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  textbook_id     INTEGER NOT NULL REFERENCES textbooks(id),
  recipient_email TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
  error_message   TEXT,
  sent_at         DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 5. API 설계

### 5.1 교재 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/textbooks?q={keyword}` | 교재 검색 (2글자 이상, 실시간 필터) |
| GET | `/api/textbooks` | 전체 교재 목록 (Admin) |
| GET | `/api/textbooks/:id` | 교재 상세 조회 |
| POST | `/api/textbooks` | 교재 등록 (Admin, multipart/form-data) |
| PUT | `/api/textbooks/:id` | 교재 수정 (Admin) |
| DELETE | `/api/textbooks/:id` | 교재 삭제 (Admin) |

### 5.2 메일 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/send` | MP3 이메일 발송 요청 |
| GET | `/api/send-logs` | 발송 이력 조회 (Admin) |
| GET | `/api/send-logs/stats` | 발송 통계 (Admin) |

### 5.3 요청/응답 예시

**POST /api/send**
```json
// Request
{
  "textbook_id": 1,
  "email": "learner@example.com"
}

// Response (200)
{
  "success": true,
  "message": "MP3 파일이 learner@example.com으로 발송되었습니다.",
  "log_id": 42
}
```

## 6. 메일 발송 모듈 상세

### Nodemailer 설정

```javascript
// .env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=app-specific-password
MAIL_FROM="MP3 배달 서비스 <your-email@gmail.com>"
```

### 발송 플로우

1. 클라이언트에서 `POST /api/send` 요청
2. DB에서 교재 및 MP3 파일 정보 조회
3. `send_logs`에 status='pending' 레코드 생성
4. Nodemailer로 MP3 첨부 이메일 발송
5. 성공 시 status='sent', 실패 시 status='failed' + error_message 업데이트
6. 클라이언트에 결과 응답

### 첨부 파일 처리

- MP3 파일은 `backend/uploads/` 디렉토리에 저장
- 교재당 다수 MP3 가능 → 다중 첨부 또는 ZIP 압축 후 첨부
- 첨부 용량 제한: 25MB (Gmail 기준)

## 7. Seed 데이터

### 일본어 교재 (5개)

| 제목 | 출판사 |
|------|--------|
| 민나노 니홍고 초급1 | 3A Corporation |
| 민나노 니홍고 초급2 | 3A Corporation |
| 겐키 일본어 1 | Japan Times |
| 겐키 일본어 2 | Japan Times |
| 뉴스로 배우는 일본어 | 다락원 |

### 중국어 교재 (5개)

| 제목 | 출판사 |
|------|--------|
| 신공략 중국어 초급 | 북경어언대학출판사 |
| 신공략 중국어 중급 | 북경어언대학출판사 |
| HSK 표준교재 4급 | 인민교육출판사 |
| HSK 표준교재 5급 | 인민교육출판사 |
| 맛있는 중국어 Level 1 | 맛있는북스 |

각 교재당 더미 MP3 파일 1~3개 생성 (무음 파일로 테스트용).

## 8. 프론트엔드 화면 구성

### User Page
- **헤더**: 서비스 로고 + 타이틀
- **검색 영역**: 검색 입력창 (debounce 300ms) + 언어 필터 탭
- **결과 목록**: 카드 형태 교재 리스트 (제목, 언어, 출판사, MP3 수)
- **이메일 모달/섹션**: 교재 선택 시 이메일 입력 + 발송 버튼
- **상태 토스트**: 발송 진행/완료/실패 알림

### Admin Dashboard
- **사이드바**: 교재 관리 / 발송 이력 / 통계 네비게이션
- **교재 관리**: 테이블 + CRUD 모달
- **발송 이력**: 필터링 가능한 테이블
- **통계**: 일별 발송 차트

## 9. 개발 순서 (권장)

1. **백엔드 기초**: Express 서버 + SQLite 셋업 + DB 스키마 생성
2. **Seed 데이터**: 더미 교재/MP3 데이터 투입
3. **교재 API**: 검색 + CRUD 엔드포인트 구현
4. **메일 모듈**: Nodemailer 설정 + 발송 API 구현
5. **User Page**: 검색 UI + 이메일 입력 + 발송 플로우
6. **Admin Dashboard**: 교재 관리 + 발송 이력 화면
7. **통합 테스트 및 마무리**

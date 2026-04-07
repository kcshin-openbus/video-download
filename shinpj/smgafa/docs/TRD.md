# TRD (Technical Requirements Document)
# 시민재가노인지원서비스센터 홈페이지

---

## 1. 기술 스택

| 구분 | 기술 | 사유 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | SSG 지원, SEO 최적화, 빠른 로딩 |
| UI 라이브러리 | React 19 | 컴포넌트 기반 개발 |
| 스타일링 | Tailwind CSS v4 | 유틸리티 퍼스트, 반응형 용이 |
| 언어 | TypeScript | 타입 안전성 |
| 지도 | 카카오맵 API (iframe 임베드) | 국내 서비스 최적화 |
| 배포 | Vercel 또는 정적 호스팅 | 무료/저비용 운영 |
| CMS | Markdown 파일 기반 | 공지사항/소식 관리 |

---

## 2. 프로젝트 구조

```
smgafa/
├── public/
│   └── images/                      # 이미지 리소스
├── src/
│   ├── app/
│   │   ├── layout.tsx               # 공통 레이아웃 (헤더/푸터)
│   │   ├── page.tsx                 # 메인페이지
│   │   ├── about/
│   │   │   ├── greeting/page.tsx    # 센터장 인사말
│   │   │   ├── mission/page.tsx     # 미션/비전
│   │   │   ├── history/page.tsx     # 연혁
│   │   │   ├── organization/page.tsx # 조직도
│   │   │   └── location/page.tsx    # 찾아오시는 길
│   │   ├── services/
│   │   │   └── page.tsx             # 재가노인지원서비스사업 (단일 페이지)
│   │   ├── support/
│   │   │   ├── donation/page.tsx    # 후원 안내
│   │   │   └── volunteer/page.tsx   # 자원봉사
│   │   └── community/
│   │       ├── notices/page.tsx     # 공지사항
│   │       └── news/page.tsx        # 센터 소식
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx           # 네비게이션 헤더
│   │   │   ├── Footer.tsx           # 푸터
│   │   │   └── Sidebar.tsx          # 서브메뉴 사이드바
│   │   ├── home/
│   │   │   ├── HeroBanner.tsx       # 메인 배너
│   │   │   ├── ServiceCards.tsx     # 서비스 바로가기
│   │   │   └── NoticePreview.tsx    # 공지사항 미리보기
│   │   ├── common/
│   │   │   ├── PageTitle.tsx        # 페이지 제목 컴포넌트
│   │   │   ├── Timeline.tsx         # 연혁 타임라인
│   │   │   ├── OrgChart.tsx         # 조직도
│   │   │   ├── ProcessStep.tsx      # 신청절차 스텝퍼
│   │   │   └── Map.tsx              # 지도 컴포넌트
│   │   └── ui/                      # 공통 UI (버튼, 카드 등)
│   ├── data/
│   │   ├── history.ts               # 연혁 데이터
│   │   ├── services.ts              # 서비스 데이터
│   │   └── navigation.ts            # 메뉴 구조 데이터
│   └── styles/
│       └── globals.css              # 글로벌 스타일
├── content/
│   ├── notices/                     # 공지사항 마크다운
│   └── news/                        # 센터소식 마크다운
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. 핵심 컴포넌트 설계

| 컴포넌트 | 역할 | 비고 |
|----------|------|------|
| Header | GNB(글로벌 네비게이션), 로고, 모바일 햄버거 메뉴 | 스크롤 시 고정 |
| Footer | 센터 정보, 연락처, 후원계좌, 저작권 | 모든 페이지 공통 |
| HeroBanner | 메인 슬라이드 배너 | 자동 전환 |
| ServiceCards | 4개 주요 서비스 카드형 바로가기 | 아이콘 + 텍스트 |
| Timeline | 연혁 타임라인 | 세로 타임라인 |
| OrgChart | 조직도 트리 | CSS 기반 |
| ProcessStep | 신청절차 6단계 | 수평 스텝퍼 |
| Map | 카카오맵 임베드 | iframe |

---

## 4. 반응형 브레이크포인트

| 구분 | 크기 | 설명 |
|------|------|------|
| Mobile | < 768px | 1컬럼, 햄버거 메뉴 |
| Tablet | 768px~1024px | 2컬럼 |
| Desktop | > 1024px | 사이드바 + 콘텐츠 |

---

## 5. 접근성 가이드라인

- 최소 폰트 크기: 본문 16px, 제목 20px 이상
- 명도대비 4.5:1 이상 (WCAG AA)
- 키보드 네비게이션 지원
- alt 텍스트 필수
- 글씨 크기 조절 버튼 (선택)
- 시맨틱 HTML 태그 사용 (header, nav, main, section, footer)

---

## 6. SEO 최적화

- 메타 태그 (title, description, og:image)
- 시맨틱 HTML
- sitemap.xml, robots.txt
- 구조화 데이터 (LocalBusiness schema)
- Next.js 정적 생성(SSG)으로 크롤링 최적화

---

## 7. 디자인 시스템

### 색상 팔레트 (따뜻한 그린/베이지)
```
Primary Green:    #4A7C59 (메인 액센트)
Primary Light:    #6B9F7B (호버/활성)
Warm Beige:       #F5F0E8 (배경)
Light Cream:      #FAF8F4 (카드 배경)
Dark Text:        #2D3436 (본문 텍스트)
Gray Text:        #636E72 (보조 텍스트)
Warm Brown:       #8B6914 (강조/CTA)
White:            #FFFFFF
Border:           #E0D8CC
```

### 폰트
- 제목: Pretendard Bold / SemiBold
- 본문: Pretendard Regular (16px 기준)

---

## 8. 구현 순서

### Phase 1: 프로젝트 세팅 & 레이아웃
- Next.js 프로젝트 초기화
- Tailwind CSS 설정
- 공통 레이아웃 (Header, Footer, 네비게이션)
- 메인페이지 기본 구조

### Phase 2: 센터소개 페이지들
- 센터장 인사말, 미션/비전, 연혁, 조직도, 찾아오시는 길

### Phase 3: 재가노인지원서비스사업
- 단일 페이지 (사업소개 + 서비스내용 + 신청절차 + 신청서류)

### Phase 4: 후원·자원봉사
- 후원 안내, 자원봉사자 모집

### Phase 5: 커뮤니티
- 공지사항 (게시판), 센터 소식 (갤러리)

### Phase 6: 마무리
- 반응형 점검, 접근성 점검, SEO 최적화, 배포

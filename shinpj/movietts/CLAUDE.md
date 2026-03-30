# MovieTTS

영상의 음성을 분석하여 타임스탬프 기반 자막을 자동 생성하는 웹 애플리케이션

## 팀 구성

- **디자이너** (`designer` 에이전트): UI/UX 설계, 화면 구성, 컴포넌트 디자인
- **개발자** (`developer` 에이전트): 백엔드/프론트엔드 구현, API 개발, 엔진 연동

## 기술 스택

- Backend: Python 3.10+, FastAPI, Whisper, FFmpeg
- Frontend: React 18, Vite, Tailwind CSS
- 인프라: Docker, Redis, Celery

## 프로젝트 구조

- `docs/` - 기획서, PRD, TRD, 개발 문서
- `backend/` - FastAPI 서버
- `frontend/` - React 클라이언트
- `.claude/agents/` - 에이전트 정의 (designer, developer)

## 작업 규칙

- UI/UX 관련 작업 → `designer` 에이전트 활용
- 코드 구현 작업 → `developer` 에이전트 활용
- 양쪽에 걸친 작업 → 디자이너 먼저 설계 후 개발자가 구현
- 문서는 `docs/` 폴더에서 관리

## 빌드 & 실행

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

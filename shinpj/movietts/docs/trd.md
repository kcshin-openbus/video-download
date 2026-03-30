# MovieTTS - TRD (Technical Requirements Document)

## 1. 시스템 개요

영상 파일을 입력받아 음성을 추출하고, STT(Speech-to-Text) 엔진을 통해 타임스탬프 기반 자막을 생성하는 웹 애플리케이션의 기술 요구사항을 정의한다.

## 2. 기술 스택

### Backend
| 항목 | 기술 | 버전 | 선정 사유 |
|------|------|------|----------|
| 언어 | Python | 3.10+ | Whisper 호환, AI/ML 생태계 |
| 프레임워크 | FastAPI | 0.100+ | 비동기 처리, 자동 API 문서화 |
| STT 엔진 | OpenAI Whisper | latest | 높은 정확도, 다국어 지원, 타임스탬프 내장 |
| 미디어 처리 | FFmpeg | 6.0+ | 영상/오디오 변환 표준 도구 |
| 작업 큐 | Celery + Redis | - | 비동기 작업 처리, 진행률 추적 |

### Frontend
| 항목 | 기술 | 선정 사유 |
|------|------|----------|
| 프레임워크 | React 18 | 컴포넌트 기반, 생태계 |
| 빌드 도구 | Vite | 빠른 HMR, 번들링 |
| 스타일링 | Tailwind CSS | 유틸리티 기반, 빠른 UI 개발 |
| 영상 플레이어 | Video.js | 자막 트랙 지원, 커스터마이징 |
| HTTP 클라이언트 | Axios | 업로드 진행률 콜백 지원 |

### 인프라
| 항목 | 기술 | 용도 |
|------|------|------|
| 컨테이너 | Docker | 환경 일관성, FFmpeg/Whisper 의존성 관리 |
| 파일 저장 | 로컬 디스크 (MVP) / S3 (확장) | 영상 및 자막 파일 저장 |
| 캐시/큐 | Redis | Celery 브로커, 작업 상태 저장 |

## 3. 시스템 아키텍처

```
                          ┌─────────────┐
                          │  Frontend   │
                          │  (React)    │
                          └──────┬──────┘
                                 │ HTTP/REST
                          ┌──────▼──────┐
                          │  API Server │
                          │  (FastAPI)  │
                          └──────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
             ┌──────▼──────┐ ┌──▼───┐ ┌──────▼──────┐
             │ Task Queue  │ │Redis │ │ File Store  │
             │ (Celery)    │ │      │ │ (Disk/S3)   │
             └──────┬──────┘ └──────┘ └─────────────┘
                    │
           ┌───────┼───────┐
           │               │
    ┌──────▼──────┐ ┌──────▼──────┐
    │   FFmpeg    │ │   Whisper   │
    │ 음성 추출    │ │  STT 변환    │
    └─────────────┘ └─────────────┘
```

## 4. API 설계

### 4.1 영상 업로드
```
POST /api/upload
Content-Type: multipart/form-data

Request:
  - file: binary (영상 파일)
  - language: string (optional, 기본값: "auto")

Response: 201 Created
{
  "task_id": "uuid",
  "status": "queued",
  "created_at": "2026-03-30T12:00:00Z"
}
```

### 4.2 처리 상태 조회
```
GET /api/status/{task_id}

Response: 200 OK
{
  "task_id": "uuid",
  "status": "processing",    // queued | extracting | transcribing | completed | failed
  "progress": 65,            // 0~100
  "stage": "transcribing",
  "estimated_remaining": 45  // 초
}
```

### 4.3 자막 다운로드
```
GET /api/subtitle/{task_id}?format=srt

Query Params:
  - format: "srt" | "vtt" | "ass" (기본값: "srt")

Response: 200 OK
Content-Type: application/x-subrip
Content-Disposition: attachment; filename="subtitle.srt"
```

### 4.4 자막 수정
```
PUT /api/subtitle/{task_id}

Request:
{
  "segments": [
    {
      "index": 1,
      "start": "00:00:01.000",
      "end": "00:00:04.500",
      "text": "수정된 자막 텍스트"
    }
  ]
}

Response: 200 OK
```

## 5. 데이터 모델

### Task
```python
class Task:
    id: UUID
    status: Enum["queued", "extracting", "transcribing", "completed", "failed"]
    progress: int              # 0~100
    original_filename: str
    file_path: str             # 저장된 영상 경로
    audio_path: str | None     # 추출된 오디오 경로
    language: str              # 감지된 언어 코드
    segments: list[Segment]    # 자막 세그먼트
    created_at: datetime
    completed_at: datetime | None
    error_message: str | None
```

### Segment
```python
class Segment:
    index: int
    start: float       # 초 단위 (예: 1.000)
    end: float         # 초 단위 (예: 4.500)
    text: str
```

## 6. 처리 파이프라인

### 6.1 단계별 처리 흐름

```
1. 파일 수신 및 검증
   - 파일 크기 확인 (≤ 500MB)
   - MIME 타입 검증
   - 디스크에 저장

2. 음성 추출 (FFmpeg)
   - 입력: 영상 파일
   - 출력: WAV (16kHz, mono, PCM 16-bit)
   - 명령: ffmpeg -i input -vn -acodec pcm_s16le -ar 16000 -ac 1 output.wav

3. 음성→텍스트 변환 (Whisper)
   - 모델: whisper-base (MVP) → whisper-large-v3 (확장)
   - 옵션: word_timestamps=True
   - 출력: 세그먼트 리스트 (start, end, text)

4. 자막 파일 생성
   - 세그먼트를 SRT/VTT/ASS 포맷으로 변환
   - 파일 저장 및 다운로드 준비

5. 완료 통지
   - 상태 업데이트: completed
   - (향후) WebSocket 또는 SSE로 실시간 알림
```

### 6.2 에러 처리

| 단계 | 에러 유형 | 처리 방법 |
|------|----------|----------|
| 업로드 | 지원하지 않는 포맷 | 400 Bad Request 반환 |
| 업로드 | 파일 크기 초과 | 413 Payload Too Large 반환 |
| 음성 추출 | FFmpeg 실패 | 재시도 1회, 실패 시 상태를 failed로 변경 |
| STT 변환 | Whisper 오류 | 재시도 1회, 실패 시 상태를 failed로 변경 |
| STT 변환 | 음성 없음 | "음성이 감지되지 않았습니다" 메시지 반환 |

## 7. 비기능 요구사항 기술 명세

### 7.1 성능
| 항목 | 요구사항 | 구현 방안 |
|------|----------|----------|
| 처리 시간 | 10분 영상 → 3분 이내 | GPU 가속 (CUDA), Whisper FP16 |
| 동시 처리 | 10건 동시 작업 | Celery worker 스케일링 |
| 업로드 속도 | 대용량 파일 안정 업로드 | 청크 업로드, 진행률 표시 |

### 7.2 보안
| 항목 | 구현 방안 |
|------|----------|
| 파일 검증 | MIME 타입 + 확장자 이중 검증 |
| 저장 경로 | UUID 기반 파일명으로 경로 탐색 방지 |
| 파일 정리 | 완료 후 24시간 뒤 자동 삭제 (cron) |
| 입력 검증 | Pydantic 모델로 모든 입력 검증 |

### 7.3 확장성
| 단계 | 방안 |
|------|------|
| MVP | 단일 서버, 로컬 파일 저장 |
| v1.0 | Docker Compose, Redis 분리 |
| v2.0 | Kubernetes, S3 저장소, GPU 노드 오토스케일링 |

## 8. 개발 환경 요구사항

### 필수 의존성
```
# System
- Python 3.10+
- Node.js 18+
- FFmpeg 6.0+
- Redis 7.0+

# Python 패키지
fastapi>=0.100
uvicorn[standard]
openai-whisper
celery[redis]
python-multipart
pydantic>=2.0

# Node 패키지
react, react-dom
vite
tailwindcss
video.js
axios
```

### GPU 요구사항 (권장)
| 항목 | 최소 | 권장 |
|------|------|------|
| GPU | NVIDIA GTX 1060 (6GB) | NVIDIA RTX 3060 (12GB) |
| VRAM | 4GB | 8GB+ |
| CUDA | 11.7+ | 12.0+ |

> GPU가 없는 경우 CPU 모드로 동작 가능 (처리 시간 5~10배 증가)

## 9. 테스트 전략

| 유형 | 대상 | 도구 |
|------|------|------|
| 단위 테스트 | 자막 포맷 변환, 데이터 모델 | pytest |
| 통합 테스트 | API 엔드포인트, 파이프라인 | pytest + httpx |
| E2E 테스트 | 업로드→자막 생성 전체 흐름 | Playwright |
| 성능 테스트 | 동시 처리, 대용량 파일 | locust |

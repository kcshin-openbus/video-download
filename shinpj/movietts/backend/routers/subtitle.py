import logging
import os
import shutil
from datetime import datetime

import aiofiles
from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse

from pydantic import BaseModel as _BaseModel

from backend.models.task import (
    Segment,
    SegmentsResponse,
    SubtitleEditRequest,
    Task,
    TaskResponse,
    TaskStatus,
    TaskStatusResponse,
    TranslateRequest,
    UrlUploadRequest,
)
from backend.services.audio import extract_audio
from backend.services.downloader import download_video, get_proxy, set_proxy
from backend.services.stt import transcribe
from backend.services.subtitle import generate_subtitle
from backend.services.translator import translate_segments

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["subtitle"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"))
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mkv", ".mov", ".webm"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

# 인메모리 태스크 저장소 (MVP)
tasks: dict[str, Task] = {}


def _validate_file(filename: str) -> None:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 지원: {', '.join(ALLOWED_EXTENSIONS)}",
        )


async def _process_video(task_id: str) -> None:
    """백그라운드에서 영상을 처리한다: (다운로드) → 음성 추출 → STT → 자막 생성"""
    task = tasks[task_id]
    task_dir = os.path.join(UPLOAD_DIR, task.id)

    try:
        # 0단계: URL인 경우 다운로드
        if task.source_url:
            task.status = TaskStatus.DOWNLOADING
            task.progress = 5
            os.makedirs(task_dir, exist_ok=True)
            file_path, title = await download_video(task.source_url, task_dir)
            task.file_path = file_path
            task.original_filename = title
            task.progress = 15

        # 1단계: 음성 추출
        task.status = TaskStatus.EXTRACTING
        task.progress = 20
        audio_path = await extract_audio(task.file_path, task_dir)
        task.audio_path = audio_path
        task.progress = 40

        # 2단계: STT 변환
        task.status = TaskStatus.TRANSCRIBING
        task.progress = 50
        segments, language = await transcribe(audio_path, task.language)
        task.segments = segments
        task.language = language
        task.progress = 90

        # 3단계: 완료
        task.status = TaskStatus.COMPLETED
        task.progress = 100
        task.completed_at = datetime.now()

    except Exception as e:
        logger.exception("작업 실패 (task_id=%s, progress=%s): %s", task_id, task.progress, e)
        task.status = TaskStatus.FAILED
        task.error_message = str(e)


@router.post("/upload", response_model=TaskResponse, status_code=201)
async def upload_video(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    language: str = "auto",
):
    """영상 파일을 업로드하고 자막 생성 작업을 시작한다."""
    _validate_file(file.filename)

    task = Task(original_filename=file.filename, language=language)
    task_dir = os.path.join(UPLOAD_DIR, task.id)
    os.makedirs(task_dir, exist_ok=True)

    file_path = os.path.join(task_dir, file.filename)

    # 파일 저장 (청크 단위)
    size = 0
    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                shutil.rmtree(task_dir, ignore_errors=True)
                raise HTTPException(status_code=413, detail="파일 크기가 500MB를 초과합니다.")
            await f.write(chunk)

    task.file_path = file_path
    tasks[task.id] = task

    background_tasks.add_task(_process_video, task.id)

    return TaskResponse(
        task_id=task.id,
        status=task.status,
        created_at=task.created_at,
    )


@router.post("/upload-url", response_model=TaskResponse, status_code=201)
async def upload_url(
    body: UrlUploadRequest,
    background_tasks: BackgroundTasks,
):
    """URL에서 영상을 다운로드하고 자막 생성 작업을 시작한다."""
    task = Task(
        original_filename=body.url,
        source_url=body.url,
        language=body.language,
    )
    tasks[task.id] = task

    background_tasks.add_task(_process_video, task.id)

    return TaskResponse(
        task_id=task.id,
        status=task.status,
        created_at=task.created_at,
    )


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_status(task_id: str):
    """작업 처리 상태를 조회한다."""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    return TaskStatusResponse(
        task_id=task.id,
        status=task.status,
        progress=task.progress,
        stage=task.status.value,
        error_message=task.error_message,
    )


@router.get("/subtitle/{task_id}")
async def download_subtitle(task_id: str, format: str = "srt"):
    """생성된 자막 파일을 다운로드한다."""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail=f"작업이 아직 완료되지 않았습니다. 현재 상태: {task.status.value}")

    if not task.segments:
        raise HTTPException(status_code=400, detail="생성된 자막이 없습니다.")

    try:
        content = generate_subtitle(task.segments, format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    content_types = {
        "srt": "application/x-subrip",
        "vtt": "text/vtt",
        "ass": "text/x-ssa",
    }

    return PlainTextResponse(
        content=content,
        media_type=content_types.get(format, "text/plain"),
        headers={
            "Content-Disposition": f'attachment; filename="subtitle.{format}"',
        },
    )


@router.put("/subtitle/{task_id}")
async def edit_subtitle(task_id: str, body: SubtitleEditRequest):
    """자막 세그먼트를 수정한다."""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="완료된 작업만 수정할 수 있습니다.")

    task.segments = body.segments
    return {"message": "자막이 수정되었습니다.", "task_id": task_id}


@router.get("/segments/{task_id}", response_model=SegmentsResponse)
async def get_segments(task_id: str):
    """STT 완료된 원본 세그먼트(텍스트+타임스탬프)를 반환한다."""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"작업이 아직 완료되지 않았습니다. 현재 상태: {task.status.value}",
        )

    if not task.segments:
        raise HTTPException(status_code=400, detail="생성된 세그먼트가 없습니다.")

    return SegmentsResponse(
        segments=task.segments,
        detected_language=task.language,
    )


@router.post("/translate/{task_id}")
async def translate_subtitle(task_id: str, body: TranslateRequest):
    """기존 세그먼트를 선택한 언어로 번역하여 반환한다."""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"작업이 아직 완료되지 않았습니다. 현재 상태: {task.status.value}",
        )

    if not task.segments:
        raise HTTPException(status_code=400, detail="번역할 세그먼트가 없습니다.")

    try:
        translated = await translate_segments(
            segments=task.segments,
            target_lang=body.target_lang,
            source_lang=task.language if task.language != "auto" else "auto",
        )
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "task_id": task_id,
        "target_language": body.target_lang,
        "segments": [seg.model_dump() for seg in translated],
    }


@router.get("/tasks")
async def list_tasks():
    """모든 작업 목록을 조회한다."""
    return [
        TaskStatusResponse(
            task_id=t.id,
            status=t.status,
            progress=t.progress,
            stage=t.status.value,
        )
        for t in tasks.values()
    ]


# ---------------------------------------------------------------------------
# 설정 API (프록시 등)
# ---------------------------------------------------------------------------

class _ProxyRequest(_BaseModel):
    proxy_url: str = ""


def _mask_proxy_url(url: str) -> str:
    """프록시 URL을 마스킹한다. (예: socks5://127.***:1080)"""
    if not url:
        return ""
    try:
        from urllib.parse import urlparse

        parsed = urlparse(url)
        host = parsed.hostname or ""
        # 호스트의 중간 부분을 *** 으로 마스킹
        if len(host) > 4:
            masked_host = host[:3] + "***" + host[-2:]
        else:
            masked_host = "***"
        port_part = f":{parsed.port}" if parsed.port else ""
        return f"{parsed.scheme}://{masked_host}{port_part}"
    except Exception:
        return "***"


@router.get("/settings")
async def get_settings():
    """현재 설정 상태를 반환한다."""
    proxy = get_proxy()
    return {
        "proxy": {
            "configured": bool(proxy),
            "url": _mask_proxy_url(proxy),
        },
    }


@router.put("/settings/proxy")
async def update_proxy(body: _ProxyRequest):
    """프록시 URL을 설정하거나 해제한다."""
    set_proxy(body.proxy_url)
    proxy = get_proxy()
    logger.info("프록시 설정 변경: %s", _mask_proxy_url(proxy) if proxy else "(해제)")
    return {
        "message": "프록시 설정이 변경되었습니다." if proxy else "프록시 설정이 해제되었습니다.",
        "proxy": {
            "configured": bool(proxy),
            "url": _mask_proxy_url(proxy),
        },
    }

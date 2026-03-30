import asyncio
import logging
import os
import subprocess
import uuid
from functools import partial

logger = logging.getLogger(__name__)


def _extract_sync(video_path: str, audio_path: str) -> None:
    """FFmpeg로 음성을 추출한다. (동기)"""
    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        "-y",
        audio_path,
    ]

    result = subprocess.run(cmd, capture_output=True)

    if result.returncode != 0:
        error_msg = result.stderr.decode(errors="replace")
        logger.error("FFmpeg 실패 (code=%d): %s", result.returncode, error_msg)
        raise RuntimeError(f"FFmpeg 오류 (code={result.returncode}): {error_msg}")


async def extract_audio(video_path: str, output_dir: str) -> str:
    """영상 파일에서 오디오를 추출하여 WAV 파일로 변환한다.

    Args:
        video_path: 영상 파일 경로
        output_dir: 출력 디렉토리

    Returns:
        추출된 WAV 파일 경로

    Raises:
        FileNotFoundError: 영상 파일이 존재하지 않을 때
        RuntimeError: FFmpeg 실행 실패 시
    """
    # 절대 경로로 정규화
    video_path = os.path.abspath(video_path)

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"영상 파일을 찾을 수 없습니다: {video_path}")

    safe_name = uuid.uuid4().hex[:12]
    audio_path = os.path.abspath(os.path.join(output_dir, f"{safe_name}.wav"))

    logger.info("음성 추출 시작: %s -> %s", video_path, audio_path)

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(_extract_sync, video_path, audio_path))

    if not os.path.exists(audio_path):
        raise RuntimeError(f"FFmpeg 완료되었으나 출력 파일이 없습니다: {audio_path}")

    logger.info("음성 추출 완료: %s", audio_path)
    return audio_path

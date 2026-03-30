import asyncio
from functools import partial

import whisper

from backend.models.task import Segment

_model = None


def _get_model(model_name: str = "base") -> whisper.Whisper:
    global _model
    if _model is None:
        _model = whisper.load_model(model_name)
    return _model


def _transcribe_sync(audio_path: str, language: str | None = None) -> dict:
    model = _get_model()
    options = {"word_timestamps": True}
    if language and language != "auto":
        options["language"] = language
    return model.transcribe(audio_path, **options)


async def transcribe(audio_path: str, language: str = "auto") -> tuple[list[Segment], str]:
    """오디오 파일을 텍스트로 변환한다.

    Args:
        audio_path: WAV 오디오 파일 경로
        language: 언어 코드 ("auto"면 자동 감지)

    Returns:
        (세그먼트 리스트, 감지된 언어 코드)
    """
    lang = None if language == "auto" else language

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, partial(_transcribe_sync, audio_path, lang))

    detected_language = result.get("language", "unknown")

    segments = []
    for i, seg in enumerate(result.get("segments", [])):
        segments.append(
            Segment(
                index=i + 1,
                start=round(seg["start"], 3),
                end=round(seg["end"], 3),
                text=seg["text"].strip(),
            )
        )

    return segments, detected_language

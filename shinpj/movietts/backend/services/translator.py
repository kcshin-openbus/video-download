"""번역 서비스 – Google Gemini를 사용하여 자막 세그먼트를 문맥 기반으로 번역한다."""

from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from typing import TYPE_CHECKING

from google import genai

if TYPE_CHECKING:
    from backend.models.task import Segment

logger = logging.getLogger(__name__)

# 지원 언어 매핑 (내부 코드 → 표시 언어명)
SUPPORTED_LANGUAGES: dict[str, str] = {
    "ko": "한국어",
    "en": "English",
    "ja": "日本語",
}

# Gemini 클라이언트 (모듈 레벨에서 한 번만 생성)
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Gemini 클라이언트를 반환한다. 최초 호출 시 생성."""
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. "
                ".env 파일 또는 환경변수에 Gemini API 키를 설정해주세요."
            )
        _client = genai.Client(api_key=api_key)
    return _client


def _build_prompt(texts: dict[int, str], target_language: str) -> str:
    """번역 요청 프롬프트를 생성한다."""
    lines = [
        "당신은 영상 자막 번역 전문가입니다.",
        f"다음 자막을 {target_language}로 자연스럽게 번역해주세요.",
        "구어체와 슬랭은 해당 언어의 자연스러운 표현으로 번역하세요.",
        '각 줄의 번호를 유지하고, "번호: 번역된 텍스트" 형식으로 반환하세요.',
        "번역된 텍스트만 반환하고 다른 설명은 하지 마세요.",
        "",
    ]
    for idx, text in texts.items():
        lines.append(f"{idx}: {text}")
    return "\n".join(lines)


def _parse_response(response_text: str, expected_indices: list[int]) -> dict[int, str]:
    """Gemini 응답을 파싱하여 {번호: 번역된 텍스트} 딕셔너리를 반환한다."""
    result: dict[int, str] = {}
    for line in response_text.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        match = re.match(r"^(\d+)\s*[:：]\s*(.+)$", line)
        if match:
            idx = int(match.group(1))
            text = match.group(2).strip()
            result[idx] = text
    # 누락된 인덱스가 있으면 경고
    missing = set(expected_indices) - set(result.keys())
    if missing:
        logger.warning("Gemini 응답에서 누락된 세그먼트 인덱스: %s", sorted(missing))
    return result


_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]


def _call_gemini(texts: dict[int, str], target_language: str) -> dict[int, str]:
    """Gemini API를 동기 호출하여 번역 결과를 반환한다. 할당량 초과 시 다른 모델로 재시도."""
    client = _get_client()
    prompt = _build_prompt(texts, target_language)

    last_error = None
    for model in _MODELS:
        for attempt in range(2):
            try:
                logger.info("Gemini 번역 시도: model=%s, attempt=%d", model, attempt + 1)
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                )
                reply = response.text or ""
                return _parse_response(reply, list(texts.keys()))
            except Exception as e:
                last_error = e
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    logger.warning("할당량 초과 (model=%s): %s, 대기 후 재시도", model, e)
                    time.sleep(5)
                    continue
                raise

    raise RuntimeError(f"모든 Gemini 모델에서 번역 실패: {last_error}")


async def translate_segments(
    segments: list[Segment],
    target_lang: str,
    source_lang: str = "auto",
) -> list[Segment]:
    """세그먼트 리스트를 대상 언어로 번역하여 새 리스트를 반환한다.

    Parameters
    ----------
    segments:
        원본 세그먼트 리스트 (타임스탬프 + 텍스트).
    target_lang:
        번역 대상 언어 코드 (ko, en, ja).
    source_lang:
        원본 언어 코드. 현재는 Gemini가 자동 감지하므로 무시됨.

    Returns
    -------
    list[Segment]
        타임스탬프는 그대로 유지하고 텍스트만 번역된 새 세그먼트 리스트.
    """
    if target_lang not in SUPPORTED_LANGUAGES:
        raise ValueError(
            f"지원하지 않는 언어입니다: {target_lang}. "
            f"지원 언어: {', '.join(SUPPORTED_LANGUAGES.keys())}"
        )

    target_language = SUPPORTED_LANGUAGES[target_lang]

    from backend.models.task import Segment as SegmentModel

    # 번역할 텍스트를 수집 (빈 텍스트 제외)
    texts_to_translate: dict[int, str] = {}
    for seg in segments:
        text = seg.text.strip()
        if text:
            texts_to_translate[seg.index] = text

    if not texts_to_translate:
        return [seg.model_copy() for seg in segments]

    # 동기 Gemini 호출을 executor에서 비동기 실행
    loop = asyncio.get_event_loop()
    try:
        translated_map = await loop.run_in_executor(
            None, _call_gemini, texts_to_translate, target_language
        )
    except Exception as e:
        logger.exception("Gemini 번역 호출 실패")
        raise RuntimeError(f"번역 실패: {e}") from e

    # 결과 매핑
    result: list[Segment] = []
    for seg in segments:
        text = seg.text.strip()
        if not text or seg.index not in translated_map:
            # 빈 텍스트이거나 번역 결과가 없으면 원본 유지
            result.append(seg.model_copy())
        else:
            result.append(
                SegmentModel(
                    index=seg.index,
                    start=seg.start,
                    end=seg.end,
                    text=translated_map[seg.index],
                )
            )

    return result

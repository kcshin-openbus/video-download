import asyncio
import logging
import os
import re
import uuid
from functools import partial
from urllib.parse import parse_qs, urlparse

import yt_dlp

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 프록시 설정 (런타임 변경 가능, 환경변수 PROXY_URL로 초기값 설정)
# ---------------------------------------------------------------------------
_proxy_url: str = os.environ.get("PROXY_URL", "")


def set_proxy(url: str) -> None:
    """런타임에 프록시 URL을 변경한다."""
    global _proxy_url
    _proxy_url = url


def get_proxy() -> str:
    """현재 설정된 프록시 URL을 반환한다."""
    return _proxy_url


_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

_DOUYIN_MOBILE_UA = "com.ss.android.ugc.aweme/110.0 (Linux; Android 12; Pixel 6)"

# 플랫폼별 에러 안내 메시지
_PLATFORM_HINTS: dict[str, str] = {
    "instagram": "Instagram 다운로드 실패 — 비공개 계정이거나 로그인이 필요할 수 있습니다.",
    "facebook": "Facebook 다운로드 실패 — 비공개 영상이거나 로그인이 필요할 수 있습니다.",
    "douyin": "Douyin(抖音) 다운로드 실패 — 한국에서는 접근이 제한될 수 있습니다. (VPN 필요)",
    "tiktok": "TikTok 다운로드 실패",
}


def _extract_url_from_text(text: str) -> str:
    """공유 텍스트에서 URL을 추출한다. (Douyin 공유 메시지 등)"""
    match = re.search(r"https?://[^\s<>\"']+", text)
    return match.group(0) if match else text.strip()


def _normalize_url(url: str) -> str:
    """플랫폼별 URL을 yt-dlp가 인식하는 형태로 변환한다."""
    # 공유 텍스트에서 URL 추출 (Douyin 공유 메시지: "5.10 r@E.UY ... https://v.douyin.com/xxx/ ...")
    url = _extract_url_from_text(url)

    # Douyin 단축 URL (v.douyin.com) → 리다이렉트 따라가서 video ID 추출
    if "v.douyin.com" in url:
        logger.info("Douyin 단축 URL 감지, 리다이렉트 해석 시도: %s", url)
        try:
            import requests
            resp = requests.head(url, allow_redirects=True, timeout=10,
                                headers={"User-Agent": _USER_AGENT})
            final_url = resp.url
            logger.info("Douyin 리다이렉트 결과: %s", final_url)
            # 리다이렉트된 URL에서 video ID 추출
            vid_match = re.search(r"/video/(\d+)", final_url)
            if vid_match:
                normalized = f"https://www.douyin.com/video/{vid_match.group(1)}"
                logger.info("Douyin 단축 URL 변환: %s → %s", url, normalized)
                return normalized
            # iesdouyin URL이면 video ID 추출
            ies_match = re.search(r"iesdouyin\.com/share/video/(\d+)", final_url)
            if ies_match:
                normalized = f"https://www.douyin.com/video/{ies_match.group(1)}"
                logger.info("Douyin iesdouyin 변환: %s → %s", url, normalized)
                return normalized
        except Exception as e:
            logger.warning("Douyin 단축 URL 리다이렉트 해석 실패: %s", e)
        return url

    # iesdouyin.com/share/video/ID → douyin.com/video/ID
    ies_match = re.search(r"iesdouyin\.com/share/video/(\d+)", url)
    if ies_match:
        normalized = f"https://www.douyin.com/video/{ies_match.group(1)}"
        logger.info("iesdouyin URL 변환: %s → %s", url, normalized)
        return normalized

    # Douyin: /jingxuan?modal_id=ID 또는 /discover?modal_id=ID → /video/ID
    if "douyin.com" in url:
        parsed = urlparse(url)
        qs = parse_qs(parsed.query)
        # modal_id 또는 video_id 파라미터
        video_id = qs.get("modal_id", qs.get("video_id", [None]))[0]
        if video_id and re.match(r"^\d+$", video_id):
            normalized = f"https://www.douyin.com/video/{video_id}"
            logger.info("Douyin URL 변환: %s → %s", url, normalized)
            return normalized

    return url


def _detect_platform(url: str) -> str | None:
    """URL에서 플랫폼 키워드를 감지한다."""
    url_lower = url.lower()
    for platform in ("instagram", "facebook", "douyin", "tiktok"):
        if platform in url_lower:
            return platform
    return None


def _build_ydl_opts(url: str, output_dir: str, safe_name: str) -> dict:
    """URL 플랫폼에 맞는 yt-dlp 옵션을 구성한다."""
    ydl_opts = {
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": os.path.join(output_dir, f"{safe_name}.%(ext)s"),
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
        "http_headers": {"User-Agent": _USER_AGENT},
    }

    # 프록시 설정 적용
    if _proxy_url:
        ydl_opts["proxy"] = _proxy_url

    platform = _detect_platform(url)

    if platform == "instagram":
        ydl_opts["extractor_args"] = {"instagram": {"app_id": ["936619743392459"]}}
        ydl_opts["cookiesfrombrowser"] = ("chrome",)
    elif platform == "douyin":
        ydl_opts["http_headers"]["Referer"] = "https://www.douyin.com/"
        # Douyin은 브라우저 쿠키가 필수
        ydl_opts["cookiesfrombrowser"] = ("chrome",)
    elif platform == "facebook":
        ydl_opts["cookiesfrombrowser"] = ("chrome",)
    elif platform == "tiktok":
        pass

    return ydl_opts


def _extract_douyin_video_id(url: str) -> str | None:
    """Douyin URL에서 영상 ID를 추출한다."""
    m = re.search(r"/video/(\d+)", url)
    return m.group(1) if m else None


def _download_douyin_sync(url: str, output_dir: str, safe_name: str) -> tuple[str, str]:
    """Douyin 전용 다운로드 - 여러 전략을 순차적으로 시도한다."""
    outtmpl = os.path.join(output_dir, f"{safe_name}.%(ext)s")

    strategies: list[tuple[str, dict]] = [
        # 전략 1: 브라우저 쿠키 + Referer 헤더
        (
            "cookiesfrombrowser + Referer",
            {
                "http_headers": {
                    "User-Agent": _USER_AGENT,
                    "Referer": "https://www.douyin.com/",
                },
                "cookiesfrombrowser": ("chrome",),
            },
        ),
        # 전략 2: 쿠키 없이 + bypass_download_webpage
        (
            "bypass_download_webpage (쿠키 없음)",
            {
                "http_headers": {
                    "User-Agent": _USER_AGENT,
                    "Referer": "https://www.douyin.com/",
                },
                "extractor_args": {"douyin": {"bypass_download_webpage": ["1"]}},
            },
        ),
        # 전략 3: 모바일 User-Agent + 쿠키 없음
        (
            "모바일 User-Agent (쿠키 없음)",
            {
                "http_headers": {
                    "User-Agent": _DOUYIN_MOBILE_UA,
                    "Referer": "https://www.douyin.com/",
                },
            },
        ),
    ]

    # 전략 4: TikTok URL 변환 시도 (영상 ID가 있는 경우만)
    video_id = _extract_douyin_video_id(url)
    if video_id:
        strategies.append(
            (
                "TikTok URL 변환",
                {
                    "_override_url": f"https://www.tiktok.com/video/{video_id}",
                    "http_headers": {"User-Agent": _USER_AGENT},
                },
            )
        )

    last_error: Exception | None = None
    for desc, extra_opts in strategies:
        base_opts: dict = {
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "outtmpl": outtmpl,
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
        }
        # 프록시 설정 적용
        if _proxy_url:
            base_opts["proxy"] = _proxy_url
        # _override_url은 내부 제어용 키이므로 꺼내서 별도 처리
        download_url = extra_opts.pop("_override_url", None) or url
        base_opts.update(extra_opts)

        logger.info("Douyin 다운로드 시도: [%s] %s", desc, download_url)
        try:
            with yt_dlp.YoutubeDL(base_opts) as ydl:
                info = ydl.extract_info(download_url, download=True)
                title = info.get("title", "video")
                filename = ydl.prepare_filename(info)
                # merge 시 확장자가 바뀔 수 있음
                if not os.path.exists(filename):
                    base = os.path.splitext(filename)[0]
                    filename = base + ".mp4"
                if not os.path.exists(filename):
                    raise FileNotFoundError(
                        f"다운로드 후 파일을 찾을 수 없습니다: {filename}"
                    )
                logger.info(
                    "Douyin 다운로드 성공 [%s]: %s (title=%s)", desc, filename, title
                )
            return filename, title
        except Exception as e:
            logger.warning("Douyin 전략 실패 [%s]: %s", desc, e)
            last_error = e

    raise RuntimeError(
        f"Douyin 다운로드 모든 전략 실패 (총 {len(strategies)}개 시도): {last_error}"
    )


def _download_sync(url: str, output_dir: str) -> tuple[str, str]:
    """URL에서 영상을 다운로드한다. (동기)

    파일명은 UUID 기반으로 안전하게 생성하여 한글/특수문자 문제를 방지한다.
    YouTube, Instagram Reels, Facebook Reels, Douyin, TikTok 등을 지원한다.
    """
    url = _normalize_url(url)
    safe_name = uuid.uuid4().hex[:12]
    platform = _detect_platform(url)

    # Douyin은 전용 다운로드 로직 사용
    if platform == "douyin":
        try:
            return _download_douyin_sync(url, output_dir, safe_name)
        except Exception as exc:
            hint = _PLATFORM_HINTS.get("douyin", "")
            logger.error("%s (원본 오류: %s)", hint, exc)
            raise type(exc)(f"{hint}\n{exc}") from exc

    ydl_opts = _build_ydl_opts(url, output_dir, safe_name)

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title", "video")
            filename = ydl.prepare_filename(info)
            # merge 시 확장자가 바뀔 수 있음
            if not os.path.exists(filename):
                base = os.path.splitext(filename)[0]
                filename = base + ".mp4"

            if not os.path.exists(filename):
                raise FileNotFoundError(
                    f"다운로드 후 파일을 찾을 수 없습니다: {filename}"
                )

            logger.info("영상 다운로드 완료: %s (title=%s)", filename, title)

        return filename, title

    except Exception as exc:
        # 쿠키 에러 시 쿠키 없이 재시도
        if "cookie" in str(exc).lower() and "cookiesfrombrowser" in ydl_opts:
            logger.warning("브라우저 쿠키 실패, 쿠키 없이 재시도: %s", exc)
            ydl_opts.pop("cookiesfrombrowser", None)
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    title = info.get("title", "video")
                    filename = ydl.prepare_filename(info)
                    if not os.path.exists(filename):
                        base = os.path.splitext(filename)[0]
                        filename = base + ".mp4"
                    if not os.path.exists(filename):
                        raise FileNotFoundError(f"다운로드 후 파일을 찾을 수 없습니다: {filename}")
                    logger.info("영상 다운로드 완료 (쿠키 없이): %s", filename)
                return filename, title
            except Exception:
                pass  # 아래 에러 처리로 이동

        hint = _PLATFORM_HINTS.get(platform, "") if platform else ""
        if hint:
            logger.error("%s (원본 오류: %s)", hint, exc)
            raise type(exc)(f"{hint}\n{exc}") from exc
        raise


async def download_video(url: str, output_dir: str) -> tuple[str, str]:
    """URL에서 영상을 다운로드한다.

    Args:
        url: 영상 URL (YouTube, Instagram, Facebook, Douyin, TikTok 등 yt-dlp 지원 사이트)
        output_dir: 저장 디렉토리

    Returns:
        (다운로드된 파일 경로, 영상 제목)
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, partial(_download_sync, url, output_dir)
    )

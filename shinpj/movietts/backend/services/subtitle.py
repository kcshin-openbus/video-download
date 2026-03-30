from backend.models.task import Segment


def _format_time_srt(seconds: float) -> str:
    """초를 SRT 타임스탬프 형식(HH:MM:SS,mmm)으로 변환한다."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _format_time_vtt(seconds: float) -> str:
    """초를 VTT 타임스탬프 형식(HH:MM:SS.mmm)으로 변환한다."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def generate_srt(segments: list[Segment]) -> str:
    """세그먼트 리스트를 SRT 형식 문자열로 변환한다."""
    lines = []
    for seg in segments:
        lines.append(str(seg.index))
        lines.append(f"{_format_time_srt(seg.start)} --> {_format_time_srt(seg.end)}")
        lines.append(seg.text)
        lines.append("")
    return "\n".join(lines)


def generate_vtt(segments: list[Segment]) -> str:
    """세그먼트 리스트를 WebVTT 형식 문자열로 변환한다."""
    lines = ["WEBVTT", ""]
    for seg in segments:
        lines.append(str(seg.index))
        lines.append(f"{_format_time_vtt(seg.start)} --> {_format_time_vtt(seg.end)}")
        lines.append(seg.text)
        lines.append("")
    return "\n".join(lines)


def generate_ass(segments: list[Segment]) -> str:
    """세그먼트 리스트를 ASS 형식 문자열로 변환한다."""

    def fmt(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int(round((seconds - int(seconds)) * 100))
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    header = """[Script Info]
Title: MovieTTS Subtitle
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,56,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,10,10,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header.strip()]
    for seg in segments:
        lines.append(
            f"Dialogue: 0,{fmt(seg.start)},{fmt(seg.end)},Default,,0,0,0,,{seg.text}"
        )
    return "\n".join(lines) + "\n"


GENERATORS = {
    "srt": generate_srt,
    "vtt": generate_vtt,
    "ass": generate_ass,
}


def generate_subtitle(segments: list[Segment], fmt: str = "srt") -> str:
    """지정된 포맷으로 자막을 생성한다."""
    generator = GENERATORS.get(fmt)
    if generator is None:
        raise ValueError(f"지원하지 않는 포맷: {fmt}. 지원 포맷: {list(GENERATORS.keys())}")
    return generator(segments)

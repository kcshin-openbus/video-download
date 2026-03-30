from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    EXTRACTING = "extracting"
    TRANSCRIBING = "transcribing"
    COMPLETED = "completed"
    FAILED = "failed"


class Segment(BaseModel):
    index: int
    start: float
    end: float
    text: str


class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: TaskStatus = TaskStatus.QUEUED
    progress: int = 0
    original_filename: str = ""
    source_url: Optional[str] = None
    file_path: str = ""
    audio_path: Optional[str] = None
    language: str = "auto"
    segments: list[Segment] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class TaskResponse(BaseModel):
    task_id: str
    status: TaskStatus
    created_at: datetime


class TaskStatusResponse(BaseModel):
    task_id: str
    status: TaskStatus
    progress: int
    stage: str
    estimated_remaining: Optional[int] = None
    error_message: Optional[str] = None


class UrlUploadRequest(BaseModel):
    url: str
    language: str = "auto"


class SubtitleEditRequest(BaseModel):
    segments: list[Segment]


class TranslateRequest(BaseModel):
    target_lang: str = Field(
        ...,
        description="번역 대상 언어 코드 (ko, en, ja)",
        examples=["en", "ko", "ja"],
    )


class SegmentsResponse(BaseModel):
    segments: list[Segment]
    detected_language: str = Field(
        default="auto",
        description="STT가 감지한 원본 언어 코드",
    )

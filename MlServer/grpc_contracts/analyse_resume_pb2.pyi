from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class AnalyseResumeRequest(_message.Message):
    __slots__ = ("file", "file_name", "job_description")
    FILE_FIELD_NUMBER: _ClassVar[int]
    FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    JOB_DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    file: bytes
    file_name: str
    job_description: str
    def __init__(self, file: _Optional[bytes] = ..., file_name: _Optional[str] = ..., job_description: _Optional[str] = ...) -> None: ...

class AnalyseResumeResponse(_message.Message):
    __slots__ = ("status", "match_score", "feedback", "missing_keywords", "skills_analysis")
    class SkillsAnalysisEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    STATUS_FIELD_NUMBER: _ClassVar[int]
    MATCH_SCORE_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_FIELD_NUMBER: _ClassVar[int]
    MISSING_KEYWORDS_FIELD_NUMBER: _ClassVar[int]
    SKILLS_ANALYSIS_FIELD_NUMBER: _ClassVar[int]
    status: str
    match_score: float
    feedback: str
    missing_keywords: _containers.RepeatedScalarFieldContainer[str]
    skills_analysis: _containers.ScalarMap[str, str]
    def __init__(self, status: _Optional[str] = ..., match_score: _Optional[float] = ..., feedback: _Optional[str] = ..., missing_keywords: _Optional[_Iterable[str]] = ..., skills_analysis: _Optional[_Mapping[str, str]] = ...) -> None: ...

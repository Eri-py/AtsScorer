import json
import os
from dataclasses import dataclass
from typing import Any

from openai import OpenAI


@dataclass
class ResumeAnalysis:
    score: float
    feedback: str
    missing_keywords: list[str]
    skills_analysis: dict[str, str]


class GitHubModelsClient:
    def __init__(self):
        token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
        if not token:
            raise RuntimeError(
                "Missing GitHub token. Set GITHUB_TOKEN (or GH_TOKEN) for GitHub Models access."
            )

        self._model = os.getenv("GITHUB_MODEL", "gpt-4o-mini")
        self._max_resume_chars = int(os.getenv("RESUME_MAX_CHARS", "14000"))
        self._max_job_chars = int(os.getenv("JOB_MAX_CHARS", "7000"))

        self._client = OpenAI(
            base_url="https://models.inference.ai.azure.com",
            api_key=token,
        )

    def analyze_resume(self, resume_text: str, job_description: str) -> ResumeAnalysis:
        trimmed_resume = (resume_text or "")[: self._max_resume_chars]
        trimmed_job = (job_description or "")[: self._max_job_chars]

        system_prompt = (
            "You are an ATS evaluator. Compare a resume against a job description and "
            "return only valid JSON with keys: score, feedback, missing_keywords, skills_analysis.\n\n"
            "Scoring rubric (be fair and holistic — do not penalize heavily for minor keyword gaps):\n"
            "- 85–100: Strong match — most required skills and experience are present\n"
            "- 70–84: Good match — core skills present, missing some nice-to-haves\n"
            "- 50–69: Partial match — has relevant skills but gaps in key areas\n"
            "- 30–49: Weak match — few relevant qualifications\n"
            "- 0–29: Poor match — largely unrelated background\n\n"
            "Give credit for transferable skills, related experience, and equivalent qualifications. "
            "Do not require exact keyword matches — recognise synonyms and related terms."
        )

        user_prompt = (
            "Return JSON only.\n"
            "Rules:\n"
            "- score: number in range [0,100]\n"
            "- feedback: short plain-text summary\n"
            "- missing_keywords: array of strings\n"
            "- skills_analysis: object with string keys and string values\n\n"
            f"JOB DESCRIPTION:\n{trimmed_job}\n\n"
            f"RESUME:\n{trimmed_resume}"
        )

        response = self._client.chat.completions.create(
            model=self._model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)

        return ResumeAnalysis(
            score=self._safe_score(parsed.get("score")),
            feedback=str(parsed.get("feedback") or "Analysis completed."),
            missing_keywords=self._safe_keywords(parsed.get("missing_keywords")),
            skills_analysis=self._safe_skills(parsed.get("skills_analysis")),
        )

    @staticmethod
    def _safe_score(value: Any) -> float:
        try:
            numeric_score = float(value)
        except (TypeError, ValueError):
            numeric_score = 0.0

        # Backward compatibility: normalize legacy 0-1 model outputs to 0-100.
        if 0.0 <= numeric_score <= 1.0:
            numeric_score *= 100.0

        return max(0.0, min(100.0, numeric_score))

    @staticmethod
    def _safe_keywords(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    @staticmethod
    def _safe_skills(value: Any) -> dict[str, str]:
        if not isinstance(value, dict):
            return {}
        output: dict[str, str] = {}
        for key, entry in value.items():
            key_str = str(key).strip()
            value_str = str(entry).strip()
            if key_str and value_str:
                output[key_str] = value_str
        return output
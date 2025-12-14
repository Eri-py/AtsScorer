from dataclasses import dataclass
from .base_extractor import BaseExtractor

@dataclass
class Education:
    degree: str
    institution: str
    location: str
    graduation_date: str
    major: str
    minor: str
    gpa: str
    honors: list[str]
    relevant_coursework: list[str]
    thesis_title: str
    research_focus: str
    advisor: str


class EducationExtractor(BaseExtractor):
    def _create_prompt(self) -> None:
        self.prompt = f"""
        **Resume Start**
        {self.resume_text}
        **Resume End**

        Return the education history, with a new entry for each education level if applicable, as a JSON in the format below: 
        [
            {{
                "degree": "string",
                "institution": "string",
                "location": "string",
                "graduation_date": "string",
                "major": "string",
                "minor": "string",
                "gpa": "string ",
                "honors": ["string"],
                "relevant_coursework": ["string"],
                "thesis_title": "string",
                "research_focus": "string",
                "advisor": "string"
            }}
        ]

        RULES:
        - If any of the information in the schema above is missing, INCLUDE IT but with an empty string as the value.
        - Return ONLY valid JSON with no additional text.

        """
    
    def _process_response(self, response: str) -> list[Education]:
        """Process response into list of Education objects."""
        json_response = self._parse_json(response)
        if not json_response:
            return []
        
        result = []
        for entry in json_response:
            result.append(Education(
                degree=entry.get("degree", ""),
                institution=entry.get("institution", ""),
                location=entry.get("location", ""),
                graduation_date=entry.get("graduation_date", ""),
                major=entry.get("major", ""),
                minor=entry.get("minor", ""),
                gpa=entry.get("gpa", ""),
                honors=entry.get("honors", []),
                relevant_coursework=entry.get("relevant_coursework", []),
                thesis_title=entry.get("thesis_title", ""),
                research_focus=entry.get("research_focus", ""),
                advisor=entry.get("advisor", "")
            ))
        
        return result
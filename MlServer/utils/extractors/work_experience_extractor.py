from dataclasses import dataclass
from .base_extractor import BaseExtractor

@dataclass
class WorkExperience:
    company: str
    role: str
    start_date: str
    end_date: str
    details: list[str]


class WorkExperienceExtractor(BaseExtractor):
    def _create_prompt(self) -> None:
        self.prompt = f"""
        **Resume Start**
        {self.resume_text}
        **Resume End**

        Return the work experience(s) as a JSON in the format below: 
        [
            {{
                company: "string"
                role: "string"
                start_date: "string"
                end_date: "string"
                details: ["string"]

            }}
        ]

        RULES:
        - If any of the information in the schema above is missing, INCLUDE IT but with an empty string as its value.
        - Return ONLY valid JSON with no additional text.

        """
    
    def _process_response(self, response: str) -> list[WorkExperience]:
        """Process response into list of WorkExperience objects."""
        json_response = self._parse_json(response)
        if not json_response:
            return []
        
        result = []
        for entry in json_response:
            result.append(WorkExperience(
                company=entry.get("company", ""),
                role=entry.get("role", ""),
                start_date=entry.get("start_date", ""),
                end_date=entry.get("end_date", ""),
                details=entry.get("details", [])
            ))
        
        return result
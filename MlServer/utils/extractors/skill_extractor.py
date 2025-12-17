from .base_extractor import BaseExtractor


class SkillExtractor(BaseExtractor):
    def _create_prompt(self) -> None:
        self.prompt = f"""
        **Resume Start**
        {self.resume_text}
        **Resume End**    

        Your task is to extract only the skills mentioned in the resume text.

        Rules:
        - Extract ONLY from sections labeled: "Skills", "Technical Skills", "Core Competencies", or similar skill section headers.
        - DO NOT extract from: work experience, projects, education, certifications, or anywhere else.
        - Include: tools, software, platforms, frameworks, libraries, programming languages, spoken languages.
        - DO NOT extract: course names, job titles, company names, or algorithms.
        - Return ONLY a valid JSON array of strings with no additional text.

        """
    
    def _process_response(self, response: str) -> list[str]:
        """Process response into list of skills."""
        result = self._parse_json_array(response)
        return result if result else []
class CreatePrompts:
    def __init__(self, resume_text: str) -> None:
        self.resume_text = resume_text
    
    def work_experience_prompt(self) -> str:
        prompt = f"""
        **Resume Start**
        {self.resume_text}
        **Resume End**

        Return the work experience(s) as a JSON in the format below: 
        [
        {{
            company_name: "content here"
            start_date: "content here"
            end_date: "content here"
            role: "content here"
            detailed_summary: "content here"

        }}
        ]

        Return ONLY valid JSON with no additional text.

        """
        return prompt
    

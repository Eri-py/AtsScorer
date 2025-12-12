import json
import torch

from dataclasses import dataclass
from utils.model_loader import ModelLoader

@dataclass
class WorkExperience:
    company_name: str
    role: str
    start_date: str
    end_date: str
    summary: str

class WorkExperienceExtractor:
    def __init__(self, resume_text: str) -> None:
        model_loader = ModelLoader()

        self.model, self.tokenizer = model_loader.get_model()
        self.resume_text = resume_text
        self.prompt = None
    
    def _create_prompt(self):
        self.prompt = f"""
        **Resume Start**
        {self.resume_text}
        **Resume End**

        Return the work experience(s) as a JSON in the format below: 
        [
        {{
            company_name: "content here"
            role: "content here"
            start_date: "content here"
            end_date: "content here"
            summary: "content here"

        }}
        ]

        Return ONLY valid JSON with no additional text.

        """
    def _clean_and_parse_json(self, response: str) -> list[dict] | None:
        # Clean the response
        response = response.strip()
        
        # Find JSON array start and end
        start_idx = response.find('[')
        end_idx = response.rfind(']')
        
        if start_idx == -1 or end_idx == -1:
            return 
        
        # Extract just the JSON part
        json_str = response[start_idx:end_idx + 1]
        
        try:
            parsed = json.loads(json_str)

            # Validate it's a list
            if not isinstance(parsed, list):
                return 
            
            # Validate each item is a dict
            for item in parsed:
                if not isinstance(item, dict):
                    return 
            
            return parsed
            
        except json.JSONDecodeError as e:
            return 
    
    def _process_work_experience(self, response: str) -> list[WorkExperience]:
        cleaned_response = self._clean_and_parse_json(response) 
        if not cleaned_response:
            return []
        
        result = []
        for entry in cleaned_response:
            result.append(WorkExperience(
                        company_name=str(entry.get("company_name", "")),
                        role=str(entry.get("role", "")),
                        start_date=str(entry.get("start_date", "")),
                        end_date=str(entry.get("end_date", "")),
                        summary=str(entry.get("summary", ""))
                    ))

        return result
            
    def extract_work_experience(self):
        # Generate prompt
        self._create_prompt()

        messages = [
            {"role": "user", "content": self.prompt}
        ]

        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
            enable_thinking=False,
            )
            
        model_inputs = self.tokenizer([text], return_tensors="pt").to(self.model.device)

        # run inference
        with torch.no_grad():
            generated_ids = self.model.generate(
                **model_inputs,
                max_new_tokens=512,
                use_cache=True
            )

        output_ids = generated_ids[0][len(model_inputs.input_ids[0]):].tolist() 
        response = self.tokenizer.decode(output_ids, skip_special_tokens=True)

        result = self._process_work_experience(response)
        return result



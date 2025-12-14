import json
import torch

from typing import Any
from abc import ABC, abstractmethod
from utils.model_loader import ModelLoader


class BaseExtractor(ABC):
    """Base class for extracting structured data from resumes using LLM."""
    
    def __init__(self, resume_text: str) -> None:
        model_loader = ModelLoader()
        self.model, self.tokenizer = model_loader.get_model()
        self.resume_text = resume_text
        self.prompt = ""
    
    @abstractmethod
    def _create_prompt(self) -> None:
        """Create the prompt for the specific extraction task."""
        pass
    
    @abstractmethod
    def _process_response(self, response: str) -> Any:
        """Process the model response into the desired output format."""
        pass
    
    def _parse_json(self, response: str) -> list[dict] | None:
        """Extract and parse JSON array from model response."""
        start_idx = response.find('[')
        end_idx = response.rfind(']')
        
        if start_idx == -1 or end_idx == -1:
            return None
        
        json_str = response[start_idx:end_idx + 1]
        
        try:
            parsed = json.loads(json_str)
            
            if not isinstance(parsed, list):
                return None
            
            for item in parsed:
                if not isinstance(item, dict):
                    return None
            
            return parsed
            
        except json.JSONDecodeError:
            return None
    
    def _generate_response(self, max_new_tokens: int = 1024) -> str:
        """Generate model response using the prompt."""
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
        
        with torch.no_grad():
            generated_ids = self.model.generate(
                **model_inputs,
                max_new_tokens=max_new_tokens,
                use_cache=True,
                do_sample=True,
                temperature=0.7,
                top_p=0.8,
                top_k=20,
                min_p=0.0,
            )
        
        output_ids = generated_ids[0][len(model_inputs.input_ids[0]):].tolist()
        response = self.tokenizer.decode(output_ids, skip_special_tokens=True)
        
        return response
    
    def extract(self) -> Any:
        """Main extraction method"""
        self._create_prompt()
        response = self._generate_response()
        result = self._process_response(response)
        return result
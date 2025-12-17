import torch

from threading  import Lock
from typing_extensions import Self
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

class ModelLoader:
    _instance = None
    _lock = Lock()
    _model = None
    _tokenizer = None

    def __new__(cls) -> Self:
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self) -> None:
        with self._lock:
            if self._model and self._tokenizer:
                return

            model_name = "Qwen/Qwen3-4B-Instruct-2507"
            print(f"Loading {model_name}...")

            # Configuration for 4-bit quantization
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True
            )

            # Load Model
            self._model = AutoModelForCausalLM.from_pretrained(
                model_name,
                device_map="auto",
                quantization_config=quantization_config
            )

            # Load tokenizer
            self._tokenizer = AutoTokenizer.from_pretrained(model_name)

            print(f"{model_name} loaded on GPU" if "cuda" in str(self._model.device) else f"{model_name} loaded on CPU")
    
    def get_model(self):
        if not self._model or not self._tokenizer:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        return self._model, self._tokenizer


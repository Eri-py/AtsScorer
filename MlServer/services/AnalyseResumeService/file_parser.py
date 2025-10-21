import io
from pypdf import PdfReader

class FileParser:
    @staticmethod
    def __extract_text_from_pdf(pdf_bytes):
        try:
            # Create a BytesIO object from the PDF bytes
            pdf_file_object = io.BytesIO(pdf_bytes)

            # Create a PdfReader object
            reader = PdfReader(pdf_file_object)

            extracted_text = ""
            for page in reader.pages:
                extracted_text += page.extract_text() 

            return extracted_text
        except Exception as e:
            print(f"Error extracting text from PDF bytes: {e}")
            return ""
        
    @staticmethod   
    def extract_text(file_bytes: bytes, file_extention: str) -> str:
        file_extention = file_extention.lower()

        if file_extention == "pdf":
            return FileParser.__extract_text_from_pdf(file_bytes)
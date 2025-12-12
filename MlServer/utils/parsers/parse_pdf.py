from __future__ import annotations

import fitz  
import pytesseract

from PIL import Image
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pathlib import Path
    

def parse_pdf(file: Path) -> str:
    """
    Extract text from PDF using:
    1. PyMuPDF (for text-embedded PDFs)
    2. Tesseract OCR (for scanned/image-based PDFs)
    
    Args:
        file: Path to PDF file
        
    Returns:
        Extracted text from all pages
    """
    extracted_text = ""
    
    # Try PyMuPDF first (for text-embedded PDFs)
    try:
        pdf_document = fitz.open(file)
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            extracted_text += str(page.get_text())
        pdf_document.close()
        
        if extracted_text.strip():
            return extracted_text
    except Exception as e:
        print(f"  PyMuPDF failed: {e}")
    
    # Try Tesseract OCR (for scanned/image-based PDFs)
    try:
        pdf_document = fitz.open(file)
        
        ocr_text = []
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            # Convert page to image using PyMuPDF
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
            
            # Convert to PIL Image format
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples) # type: ignore
            
            # Perform OCR with Tesseract
            text = pytesseract.image_to_string(img)
            ocr_text.append(text)
                    
        pdf_document.close()
        extracted_text = "\n\n".join(ocr_text)
        
        if extracted_text.strip():
            return extracted_text
    except Exception as e:
        print(f"  Tesseract OCR failed: {e}")
    
    # If all methods fail, return empty string
    return ""
import re
from dataclasses import dataclass

@dataclass
class ContactInfo:
    name: str
    email: str
    phone: str

class ContactExtractor:
    def __init__(self, resume_text: str) -> None:
        self.email_pattern =  r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        self.phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',
        ]
        self.resume_text = resume_text
    
    def __extract_name(self) -> str:
        lines = self.resume_text.split('\n')
    
        for line in lines[:5]:
            line = line.strip()
            
            # Skip empty lines and lines with common keywords
            if not line or any(word in line.lower() for word in 
                            ['email', 'phone', 'linkedin', 'github', 'http', '@', 'resume', 'cv']):
                continue
            
            # Look for 2-4 capitalized words (typical name format)
            words = line.split()
            if 2 <= len(words) <= 4 and all(word[0].isupper() for word in words if word.isalpha()):
                return line
    
        return ""

    def __extract_email(self) -> str:
        email_match = re.search(self.email_pattern, self.resume_text)
        if email_match:
            return email_match.group()
        
        return ""
    
    def __extract_phone(self) -> str:
        for pattern in self.phone_patterns:
            phone_match = re.search(pattern, self.resume_text)
            if phone_match:
                return phone_match.group()
    
        return ""

    def extract_contact(self) -> ContactInfo:
        name = self.__extract_name()
        email = self.__extract_email()
        phone = self.__extract_phone()

        return ContactInfo(name=name, 
                           email=email, 
                           phone=phone)
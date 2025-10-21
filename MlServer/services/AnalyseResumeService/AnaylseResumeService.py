import torch
import grpc

from grpc_contracts import analyse_resume_pb2
from grpc_contracts import analyse_resume_pb2_grpc
from services.AnalyseResumeService.file_parser import FileParser
from transformers import AutoTokenizer, AutoModelForCausalLM

class AnaylseResumeServicer(analyse_resume_pb2_grpc.AnalyseResumeServicer):
    def __init__(self):
        self.model_name = "facebook/bart-large-mnli"  
        print("Loading DeepSeek model...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            dtype=torch.float16,
            device_map="auto",
            low_cpu_mem_usage=True
        )
        
    def AnalyzeResume(self, request: analyse_resume_pb2.AnalyseResumeRequest, context) ->  analyse_resume_pb2.AnalyseResumeResponse:
        try:
            file_extension = request.file_name.split('.')[1]
            resume_text = FileParser.extract_text(request.file, file_extension)
                        
            # Analyze with DeepSeek
            analysis = self.analyze_with_deepseek(resume_text, request.job_description)
            
            return analyse_resume_pb2.AnalyseResumeResponse(
                status="success",
                match_score=analysis["score"],
                feedback=analysis["feedback"],
                missing_keywords=analysis["missing_keywords"],
                skills_analysis=analysis["skills_analysis"]
            )
            
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return analyse_resume_pb2.AnalyseResumeResponse()
    
    def analyze_with_deepseek(self, resume_text, job_description):
        # Create analysis prompt
        prompt = f"""
        Analyze this resume against the job description and provide:
        1. Compatibility score (0.0 to 1.0)
        2. Missing important keywords
        3. Skills analysis
        
        Resume:
        {resume_text}
        
        Job Description:
        {job_description}
        
        Format your response as:
        SCORE: [number between 0.0-1.0]
        MISSING: [comma separated keywords]
        SKILLS: [brief skills assessment]
        """
        
        # Generate analysis
        print("Tokenizing input...")
        inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)

        print("Generating Response....")
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=500,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        print("Done analysing")
        
        # Parse the response (basic parsing - you can improve this)
        return self.parse_deepseek_response(response)
    
    def parse_deepseek_response(self, response):
        lines = response.split('\n')
        score = None
        missing = None
        skills = None
        
        for line in lines:
            if "SCORE:" in line:
                try:
                    score = float(line.split(":")[1].strip())
                except:
                    pass
            elif "MISSING:" in line:
                missing = [kw.strip() for kw in line.split(":")[1].split(",") if kw.strip()]
            elif "SKILLS:" in line:
                skills = {"assessment": line.split(":")[1].strip()}
        
        return {
            "score": min(1.0, max(0.0, score)),
            "missing_keywords": missing,
            "skills_analysis": skills,
            "feedback": f"DeepSeek analysis complete. Score: {score}"
        }
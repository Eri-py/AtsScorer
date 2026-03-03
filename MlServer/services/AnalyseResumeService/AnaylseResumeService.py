import grpc

from grpc_contracts import analyse_resume_pb2
from grpc_contracts import analyse_resume_pb2_grpc
from services.AnalyseResumeService.file_parser import FileParser
from utils.github_models_client import GitHubModelsClient

class AnaylseResumeServicer(analyse_resume_pb2_grpc.AnalyseResumeServicer):
    def __init__(self):
        self.client = GitHubModelsClient()
        print("GitHub Models client initialized")
        
    def AnalyzeResume(self, request: analyse_resume_pb2.AnalyseResumeRequest, context) ->  analyse_resume_pb2.AnalyseResumeResponse:
        try:
            file_extension = request.file_name.rsplit('.', 1)[-1]
            resume_text = FileParser.extract_text(request.file, file_extension)

            analysis = self.client.analyze_resume(resume_text, request.job_description)
            
            return analyse_resume_pb2.AnalyseResumeResponse(
                status="success",
                match_score=analysis.score,
                feedback=analysis.feedback,
                missing_keywords=analysis.missing_keywords,
                skills_analysis=analysis.skills_analysis
            )
            
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return analyse_resume_pb2.AnalyseResumeResponse()

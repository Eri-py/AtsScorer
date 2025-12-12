import grpc

from concurrent import futures
from utils.model_loader import ModelLoader
from grpc_contracts import analyse_resume_pb2_grpc
from services.AnalyseResumeService.AnaylseResumeService import AnaylseResumeServicer

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    # register services
    analyse_resume_pb2_grpc.add_AnalyseResumeServicer_to_server(AnaylseResumeServicer(), server)

    # Load model
    model_loader = ModelLoader()
    model_loader.load_model()

    # port to listen on
    server.add_insecure_port("[::]:7002")

    server.start()
    print("Server is running")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()

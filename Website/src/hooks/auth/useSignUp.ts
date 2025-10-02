import { axiosInstance } from "@/api/axiosInstance";
import { useMutation } from "@tanstack/react-query";
import { useServerError, type ServerError } from "@/hooks/shared/useServerError";

// Types for API requests
type StartSignUpRequest = {
  email: string;
};

type VerifyOtpRequest = {
  email: string;
  otp: string;
};

type CompleteSignUpRequest = {
  email: string;
  password: string;
};

type StartSignUpResponse = {
  otpExpiresAt: string;
};

// API functions
const startSignUpApi = (data: StartSignUpRequest) => {
  return axiosInstance.post<StartSignUpResponse>("sign-up/start", data);
};

const verifyOtpApi = (data: VerifyOtpRequest) => {
  return axiosInstance.post("sign-up/verify-otp", data);
};

const completeSignUpApi = (data: CompleteSignUpRequest) => {
  return axiosInstance.post("sign-up/complete", data);
};

export function useSignUp() {
  const { serverError, continueDisabled, handleServerError, clearServerError } = useServerError();

  const startSignUpMutation = useMutation({
    mutationFn: (data: StartSignUpRequest) => startSignUpApi(data),
    onError: (error: ServerError) => handleServerError(error),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: VerifyOtpRequest) => verifyOtpApi(data),
    onError: (error: ServerError) => handleServerError(error),
  });

  const completeSignUpMutation = useMutation({
    mutationFn: (data: CompleteSignUpRequest) => completeSignUpApi(data),
    onError: (error: ServerError) => handleServerError(error),
  });

  return {
    serverError,
    continueDisabled,
    clearServerError,

    startSignUpAsync: startSignUpMutation.mutateAsync,
    isStarting: startSignUpMutation.isPending,

    verifyOtp: verifyOtpMutation.mutate,
    isVerifying: verifyOtpMutation.isPending,

    completeSignUp: completeSignUpMutation.mutate,
    isCompleting: completeSignUpMutation.isPending,
  };
}

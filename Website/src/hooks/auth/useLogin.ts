import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useServerError, type ServerError } from "@/hooks/auth/useServerError";
import { axiosInstance } from "@/api/axiosInstance";

type LoginRequest = {
  identifier: string;
  password: string;
};

const loginApi = (data: LoginRequest) => {
  return axiosInstance.post("login", data);
};

export function useLogin() {
  const { serverErrorMessage, handleServerError, clearServerError } = useServerError();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
    onSuccess: () => navigate({ to: "/" }),
    onError: (error: ServerError) => handleServerError(error),
  });

  return {
    serverErrorMessage,
    clearServerError,

    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
  };
}

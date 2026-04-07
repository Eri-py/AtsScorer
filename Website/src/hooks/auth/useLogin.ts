import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useServerError, type ServerError } from "@/hooks/auth/useServerError";
import { axiosInstance } from "@/api/axiosInstance";
import { USER_DETAILS_QUERY_KEY } from "@/hooks/app/useAuth";

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
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_DETAILS_QUERY_KEY });
      navigate({ to: "/" });
    },
    onError: (error: ServerError) => handleServerError(error),
  });

  return {
    serverErrorMessage,
    clearServerError,

    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
  };
}

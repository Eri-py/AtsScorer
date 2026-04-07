import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@/api/axiosInstance";

export type getUserResponse = {
  isAuthenticated: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
  } | null;
};

export const getUserDetails = () => {
  return axiosInstance.get<getUserResponse>("auth/get-user-details");
};

export type AuthContextTypes = getUserResponse;
export const AuthContext = createContext<AuthContextTypes | null>(null);
export const USER_DETAILS_QUERY_KEY = ["userDetails"] as const;

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}

export function useAuthProvider() {
  const { data, isPending } = useQuery({
    queryKey: USER_DETAILS_QUERY_KEY,
    queryFn: getUserDetails,
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  const value: AuthContextTypes = useMemo(
    () => ({
      isAuthenticated: data?.data.isAuthenticated ?? false,
      user: data?.data.user ?? null,
    }),
    [data],
  );

  return { value, isPending };
}

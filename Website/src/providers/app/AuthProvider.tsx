import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { AuthContext, getUserDetails, type AuthContextTypes } from "@/hooks/app/useAuth";

type AuthProviderTypes = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderTypes) {
  const { data } = useQuery({
    queryKey: ["userDetails"],
    queryFn: getUserDetails,
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
  });

  const value: AuthContextTypes = {
    isAuthenticated: data?.data.isAuthenticated,
    user: data?.data.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

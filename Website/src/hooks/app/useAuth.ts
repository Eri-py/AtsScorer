import { createContext, useContext } from "react";

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
  return axiosInstance.get("auth/get-user-details");
};

export type AuthContextTypes = getUserResponse;
export const AuthContext = createContext<AuthContextTypes | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}

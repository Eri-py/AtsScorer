import type { ReactNode } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { AuthContext, useAuthProvider } from "@/hooks/app/useAuth";

type AuthProviderTypes = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderTypes) {
  const { value, isPending } = useAuthProvider();

  if (isPending) {
    return (
      <Stack height="100dvh" alignItems="center" justifyContent="center">
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

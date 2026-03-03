import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";

import { useAuth } from "@/hooks/app/useAuth";
import { useThemeToggle } from "@/hooks/shared/useThemeToggle";
import { axiosInstance } from "@/api/axiosInstance";
import { ThemeSwitch } from "./ThemeSwitch";

const AuthButton = styled(Button)({
  fontSize: "1rem",
  fontWeight: 200,
});

export function RightButtonGroup() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeToggle();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => axiosInstance.post("auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      navigate({ to: "/login" });
    },
  });

  return (
    <Stack direction="row" alignItems="center" gap={1.5}>
      <FormControlLabel
        control={<ThemeSwitch sx={{ m: 1 }} checked={mode === "dark"} onChange={toggleTheme} />}
        label=""
        slotProps={{ typography: { sx: { fontWeight: 300 } } }}
      />

      {!isAuthenticated && (
        <AuthButton onClick={() => navigate({ to: "/login" })} variant="text">
          Login
        </AuthButton>
      )}
      {!isAuthenticated && (
        <AuthButton onClick={() => navigate({ to: "/sign-up" })} variant="outlined">
          Sign up
        </AuthButton>
      )}
      {isAuthenticated && (
        <AuthButton
          onClick={() => logoutMutation.mutate()}
          variant="outlined"
          disabled={logoutMutation.isPending}
        >
          Logout
        </AuthButton>
      )}
    </Stack>
  );
}

import { useNavigate } from "@tanstack/react-router";

import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";

import { useAuth } from "@/hooks/app/useAuth";
import { useThemeToggle } from "@/hooks/shared/useThemeToggle";
import { ThemeSwitch } from "./ThemeSwitch";

const AuthButton = styled(Button)({
  fontSize: "1rem",
  fontWeight: 200,
});

export function RightButtonGroup() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeToggle();

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
    </Stack>
  );
}

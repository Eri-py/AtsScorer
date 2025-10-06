import { useNavigate } from "@tanstack/react-router";

import Badge, { badgeClasses } from "@mui/material/Badge";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { useAuth } from "@/hooks/app/useAuth";

const CustomBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -0.5rem;
    right: 0rem;
  }
`;

const AuthButton = styled(Button)({
  borderRadius: "2rem",
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  fontWeight: 400,
});

export function RightButtonGroup() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Stack direction="row" alignItems="center">
        <IconButton onClick={() => console.log("user clicked on their profile")}>
          <AccountCircleIcon style={{ fontSize: "2rem" }} />
          <CustomBadge badgeContent={10} color="primary" overlap="circular" />
        </IconButton>
      </Stack>
    );
  }
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <AuthButton onClick={() => navigate({ to: "/login" })} variant="text">
        Login
      </AuthButton>
      <AuthButton onClick={() => navigate({ to: "/sign-up" })} variant="contained">
        Sign up
      </AuthButton>
    </Stack>
  );
}

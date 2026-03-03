import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import Button from "@mui/material/Button";

import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { FormContainer } from "@/components/auth/FormContainer";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();

  return (
    <FormContainer>
      {isDesktop && (
        <Button
          variant="text"
          disableRipple
          sx={{
            fontSize: "1.1rem",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              background: "none",
            },
            position: "absolute",
            top: "2rem",
            left: "3rem",
          }}
          onClick={() => navigate({ to: "/" })}
        >
          ATS Scorer
        </Button>
      )}
      <Outlet />
    </FormContainer>
  );
}

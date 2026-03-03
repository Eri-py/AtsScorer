import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import { useNavigate } from "@tanstack/react-router";

import { NavbarContainer } from "../NavbarContainer";
import { RightButtonGroup } from "./RightButtonGroup";

export function DesktopNavbar() {
  const navigate = useNavigate();

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "1rem !important",
          paddingBlock: "0.5rem",
        }}
      >
        <Button
          variant="text"
          disableRipple
          onClick={() => navigate({ to: "/" })}
          sx={{
            fontSize: "1.1rem",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              background: "none",
            },
          }}
        >
          ATS Scorer
        </Button>

        <RightButtonGroup />
      </Toolbar>
    </NavbarContainer>
  );
}

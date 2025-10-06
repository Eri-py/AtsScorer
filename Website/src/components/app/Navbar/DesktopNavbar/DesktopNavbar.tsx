import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";

import { NavbarContainer } from "../NavbarContainer";
import { RightButtonGroup } from "./RightButtonGroup";

export function DesktopNavbar() {
  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "1.35rem !important",
          paddingBlock: "0.5rem",
        }}
      >
        <Button
          variant="text"
          disableRipple
          sx={{
            "&:hover": {
              background: "none",
            },
          }}
        >
          Project icon
        </Button>

        <RightButtonGroup />
      </Toolbar>
    </NavbarContainer>
  );
}

import Toolbar from "@mui/material/Toolbar";

import { NavbarContainer } from "./NavbarContainer";

export function MobileNavbar() {
  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "0.25rem !important",
        }}
      ></Toolbar>
    </NavbarContainer>
  );
}

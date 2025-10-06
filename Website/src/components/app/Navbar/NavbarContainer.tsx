import Box from "@mui/material/Box";
import type { ReactNode } from "react";

export function NavbarContainer({ children }: { children: ReactNode }) {
  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: 1100,
        backgroundColor: "background.default",
        height: "fit-content",
      }}
    >
      {children}
    </Box>
  );
}

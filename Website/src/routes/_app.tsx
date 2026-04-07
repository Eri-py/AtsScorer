import { createFileRoute, Outlet } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return (
      <Stack height="100dvh">
        <Outlet />
      </Stack>
    );
  }

  return (
    <Stack>
      <MobileNavbar />

      {/* Main content area */}
      <Stack direction="column" height={{ xs: "calc(100dvh - 2.75rem - 3rem)", md: "100dvh" }}>
        <Outlet />
      </Stack>
    </Stack>
  );
}

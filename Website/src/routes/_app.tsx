import { createFileRoute, Outlet } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { DesktopNavbar } from "@/components/app/Navbar/DesktopNavbar/DesktopNavbar";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";
import { AuthProvider } from "@/providers/app/AuthProvider";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isDesktop } = useBreakpoint();

  return (
    <AuthProvider>
      <Stack>
        {/* Header */}
        {isDesktop ? <DesktopNavbar /> : <MobileNavbar />}

        {/* Main content area */}
        <Stack
          direction="column"
          height={{ xs: "calc(100dvh - 2.75rem - 3rem)", md: "calc(100dvh - 3.75rem)" }}
        >
          <Stack
            direction={isDesktop ? "row" : "column"}
            flex={1}
            overflow="hidden"
            gap={isDesktop ? 2 : 0}
          >
            <Outlet />
          </Stack>
        </Stack>
      </Stack>
    </AuthProvider>
  );
}

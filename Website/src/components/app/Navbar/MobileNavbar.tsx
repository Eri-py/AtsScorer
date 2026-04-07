import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { NavbarContainer } from "./NavbarContainer";
import { useAuth, USER_DETAILS_QUERY_KEY } from "@/hooks/app/useAuth";
import { useThemeToggle } from "@/hooks/shared/useThemeToggle";
import { axiosInstance } from "@/api/axiosInstance";

export function MobileNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeToggle();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => axiosInstance.post("auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DETAILS_QUERY_KEY });
      setDrawerOpen(false);
      navigate({ to: "/login" });
    },
  });

  const handleNavigate = (to: string) => {
    setDrawerOpen(false);
    navigate({ to });
  };

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "0.25rem !important",
        }}
      >
        <Typography variant="body1" fontWeight={500} sx={{ paddingLeft: 1 }}>
          ATS Scorer
        </Typography>

        <IconButton onClick={() => setDrawerOpen(true)} size="small">
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5}>
            <Typography variant="h6" fontWeight={500}>
              Menu
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <List>
            <ListItemButton onClick={toggleTheme}>
              {mode === "dark" ? (
                <LightModeIcon sx={{ mr: 1.5 }} />
              ) : (
                <DarkModeIcon sx={{ mr: 1.5 }} />
              )}
              <ListItemText primary={mode === "dark" ? "Light Mode" : "Dark Mode"} />
            </ListItemButton>

            {!isAuthenticated && (
              <>
                <ListItemButton onClick={() => handleNavigate("/login")}>
                  <ListItemText primary="Login" />
                </ListItemButton>
                <ListItemButton onClick={() => handleNavigate("/sign-up")}>
                  <ListItemText primary="Sign Up" />
                </ListItemButton>
              </>
            )}

            {isAuthenticated && (
              <ListItemButton onClick={() => handleNavigate("/saved-files")}>
                <ListItemText primary="My Files" />
              </ListItemButton>
            )}

            {isAuthenticated && (
              <ListItemButton
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <ListItemText primary="Logout" />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>
    </NavbarContainer>
  );
}

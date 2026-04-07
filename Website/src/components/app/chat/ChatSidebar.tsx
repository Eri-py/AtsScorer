import { formatDistanceToNow } from "date-fns";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";

import type { SavedFileItem } from "@/hooks/app/useSavedFiles";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";

type ChatSidebarProps = {
  isAuthenticated: boolean;
  userEmail: string;
  mode: "light" | "dark";
  onModeChange: (mode: "light" | "dark") => void;
  history: SavedFileItem[];
  isHistoryLoading: boolean;
  selectedHistoryId: string | null;
  onSelectHistory: (historyId: string) => void;
  onNewAnalysis: () => void;
  onLogout: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  isLoggingOut: boolean;
  isCollapsed: boolean;
};

export function ChatSidebar({
  isAuthenticated,
  userEmail,
  mode,
  onModeChange,
  history,
  isHistoryLoading,
  selectedHistoryId,
  onSelectHistory,
  onNewAnalysis,
  onLogout,
  onLogin,
  onSignUp,
  isLoggingOut,
  isCollapsed,
}: ChatSidebarProps) {
  const { isDesktop } = useBreakpoint();

  if (isDesktop && isCollapsed) {
    return (
      <Stack
        width={{ md: 0 }}
        minWidth={{ md: 0 }}
        borderRight={0}
        sx={{ transition: "width 180ms ease" }}
      />
    );
  }

  return (
    <Stack
      width={{ xs: "100%", md: 360 }}
      minWidth={{ md: 360 }}
      borderRight={{ xs: "none", md: 1 }}
      borderBottom={{ xs: 1, md: "none" }}
      borderColor="divider"
      sx={{ backgroundColor: "background.paper" }}
      padding={2}
      gap={1.5}
    >
      <Typography variant="h6" fontWeight={700}>
        ATS Chat
      </Typography>

      <Button variant="contained" onClick={onNewAnalysis}>
        New Chat
      </Button>

      <Divider />

      <Typography variant="overline" color="text.secondary">
        History
      </Typography>

      <List dense sx={{ flex: 1, minHeight: 120, overflowY: "auto", pr: 0.5 }}>
        {isHistoryLoading && (
          <Typography variant="body2" color="text.secondary">
            Loading history...
          </Typography>
        )}

        {!isHistoryLoading && history.length === 0 && (
          <Typography variant="body2" color={isAuthenticated ? "text.secondary" : "warning.main"}>
            {isAuthenticated
              ? "Your resume chats will appear here."
              : "Sign in to save and view your conversation history."}
          </Typography>
        )}

        {history.map((entry) => (
          <ListItemButton
            key={entry.id}
            selected={selectedHistoryId === entry.id}
            onClick={() => onSelectHistory(entry.id)}
            sx={{
              borderRadius: 1.5,
              alignItems: "flex-start",
              mb: 0.5,
              border: 1,
              borderColor: "divider",
            }}
          >
            <ListItemText
              primary={entry.fileName}
              secondary={`Saved ${formatDistanceToNow(new Date(entry.uploadedAt))} ago`}
              slotProps={{
                primary: { sx: { fontSize: "0.88rem", fontWeight: 500 } },
                secondary: { sx: { fontSize: "0.75rem" } },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Paper variant="outlined" sx={{ p: 0.35 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          fullWidth
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              py: 0.35,
              px: 0.9,
              fontSize: "0.76rem",
              minHeight: 30,
            },
          }}
          onChange={(_, value: "light" | "dark" | null) => {
            if (value) {
              onModeChange(value);
            }
          }}
        >
          <ToggleButton value="light" sx={{ gap: 0.75 }}>
            <LightModeRoundedIcon sx={{ fontSize: "0.95rem" }} />
            Light
          </ToggleButton>
          <ToggleButton value="dark" sx={{ gap: 0.75 }}>
            <DarkModeRoundedIcon sx={{ fontSize: "0.95rem" }} />
            Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {isAuthenticated ? "Signed in as" : "Status"}
        </Typography>
        <Typography variant="body2" fontWeight={500} noWrap>
          {isAuthenticated ? userEmail : "Not signed in"}
        </Typography>
      </Box>

      {isAuthenticated ? (
        <Button variant="outlined" color="inherit" onClick={onLogout} disabled={isLoggingOut}>
          Logout
        </Button>
      ) : (
        <Stack direction="row" gap={1}>
          <Button variant="outlined" fullWidth onClick={onLogin}>
            Login
          </Button>
          <Button variant="contained" fullWidth onClick={onSignUp}>
            Sign up
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

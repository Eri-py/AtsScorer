import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import { alpha } from "@mui/material/styles";

import { ChatComposer } from "@/components/app/chat/ChatComposer";
import { ChatConversationPanel } from "@/components/app/chat/ChatConversationPanel";
import { ChatSidebar } from "@/components/app/chat/ChatSidebar";
import { useChatWorkspace } from "@/hooks/app/useChatWorkspace";

type ChatWorkspaceViewProps = {
  chatId: string | null;
};

export function ChatWorkspaceView({ chatId }: ChatWorkspaceViewProps) {
  const workspace = useChatWorkspace(chatId);

  return (
    <Stack direction={{ xs: "column", md: "row" }} flex={1} minHeight={0}>
      <ChatSidebar
        isAuthenticated={workspace.isAuthenticated}
        userEmail={workspace.userEmail}
        mode={workspace.mode}
        onModeChange={workspace.setThemeMode}
        history={workspace.history}
        isHistoryLoading={workspace.isHistoryLoading}
        selectedHistoryId={workspace.selectedHistoryId}
        onSelectHistory={workspace.selectHistory}
        onNewAnalysis={workspace.startNewAnalysis}
        onLogout={workspace.logout}
        onLogin={workspace.goToLogin}
        onSignUp={workspace.goToSignUp}
        isLoggingOut={workspace.isLoggingOut}
        isCollapsed={workspace.isSidebarCollapsed}
      />

      <Stack flex={1} minHeight={0}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-start"
          gap={1}
          px={{ xs: 2, md: 3 }}
          py={1.5}
          sx={(theme) => ({
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(theme.palette.background.default, 0.96)} 100%)`
                : `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
            boxShadow: `inset 0 -1px 0 ${theme.palette.divider}`,
          })}
        >
          <Tooltip title={workspace.isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}>
            <IconButton onClick={workspace.toggleSidebar} size="small" sx={{ mr: 0.5 }}>
              {workspace.isSidebarCollapsed ? (
                <ViewSidebarOutlinedIcon />
              ) : (
                <ViewSidebarRoundedIcon />
              )}
            </IconButton>
          </Tooltip>

          <Typography variant="h6" fontWeight={600}>
            AI Chat
          </Typography>
        </Stack>

        <ChatConversationPanel conversation={workspace.activeConversation} />

        <ChatComposer
          file={workspace.fileUpload.file}
          errors={workspace.fileUpload.errors}
          isDragActive={workspace.fileUpload.isDragActive}
          getRootProps={workspace.fileUpload.getRootProps}
          getInputProps={workspace.fileUpload.getInputProps}
          removeFile={workspace.fileUpload.removeFile}
          removeError={workspace.fileUpload.removeError}
          jobDescription={workspace.home.jobDescription}
          jobDescriptionError={workspace.home.jobDescriptionError}
          onJobDescriptionChange={workspace.home.handleJobDescriptionChange}
          onSubmit={(event) => {
            event.preventDefault();
            void workspace.submitCurrentAnalysis();
          }}
          onReset={workspace.startNewAnalysis}
          isSubmitting={workspace.home.isSubmitting}
        />
      </Stack>
    </Stack>
  );
}

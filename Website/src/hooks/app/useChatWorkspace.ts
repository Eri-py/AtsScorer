import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@/api/axiosInstance";
import { useAuth, USER_DETAILS_QUERY_KEY } from "@/hooks/app/useAuth";
import { useSavedFiles, type SavedFileItem } from "@/hooks/app/useSavedFiles";
import { useThemeToggle, type ThemeToggleTypes } from "@/hooks/shared/useThemeToggle";
import { useFileUpload } from "@/hooks/home/useFileUpload";
import { useHomePage } from "@/hooks/home/useHomePage";
import type { ActiveConversation } from "@/components/app/chat/types";

type ThemeMode = ThemeToggleTypes["mode"];

export function useChatWorkspace(chatId: string | null) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeToggle();
  const fileUpload = useFileUpload();
  const home = useHomePage();
  const { data: history = [], isLoading: isHistoryLoading } = useSavedFiles();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: () => axiosInstance.post("auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DETAILS_QUERY_KEY });
      navigate({ to: "/login" });
    },
  });

  const selectedHistory = useMemo(
    () => (chatId ? (history.find((entry) => entry.id === chatId) ?? null) : null),
    [history, chatId],
  );

  useEffect(() => {
    if (!chatId || isHistoryLoading) {
      return;
    }

    if (!selectedHistory) {
      navigate({ to: "/" });
    }
  }, [chatId, isHistoryLoading, navigate, selectedHistory]);

  const activeConversation = useMemo<ActiveConversation | null>(() => {
    if (selectedHistory) {
      return {
        fileName: selectedHistory.fileName,
        downloadUrl: selectedHistory.downloadUrl,
        aiResponse: selectedHistory.aiResponse,
      };
    }

    if (!home.analysisResult || !home.latestFileName) {
      return null;
    }

    return {
      fileName: home.latestFileName,
      downloadUrl: null,
      aiResponse: {
        status: home.analysisResult.status,
        matchScore: home.analysisResult.matchScore,
        feedback: home.analysisResult.feedback,
        missingKeywords: home.analysisResult.missingKeywords,
        skillsAnalysis: home.analysisResult.skillsAnalysis,
      },
    };
  }, [selectedHistory, home.analysisResult, home.latestFileName]);

  const resetCurrentDraft = () => {
    home.resetAnalysis();
    fileUpload.removeFile();
  };

  const startNewAnalysis = () => {
    navigate({ to: "/" });
    resetCurrentDraft();
  };

  const selectHistory = (historyId: string) => {
    navigate({ to: "/chat/$chatId", params: { chatId: historyId } });
    resetCurrentDraft();
  };

  const submitCurrentAnalysis = async () => {
    if (!fileUpload.file || !home.validateJobDescription(home.jobDescription)) {
      return;
    }

    navigate({ to: "/" });

    try {
      await home.submitAnalysisAsync({
        file: fileUpload.file,
        jobDescription: home.jobDescription,
      });

      if (!isAuthenticated) {
        return;
      }

      await queryClient.refetchQueries({ queryKey: ["savedFiles"] });
      const updatedHistory = queryClient.getQueryData<SavedFileItem[]>(["savedFiles"]) ?? [];
      const latestChatId = updatedHistory[0]?.id;

      if (latestChatId) {
        navigate({ to: "/chat/$chatId", params: { chatId: latestChatId } });
      }
    } catch {
      // Mutation errors are already represented by existing UI state.
    }
  };

  const setThemeMode = (nextMode: ThemeMode) => {
    if (nextMode !== mode) {
      toggleTheme();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return {
    isAuthenticated,
    userEmail: user?.email ?? "",
    mode,
    setThemeMode,
    isSidebarCollapsed,
    toggleSidebar,

    history,
    isHistoryLoading,
    selectedHistoryId: chatId,
    selectHistory,

    activeConversation,
    startNewAnalysis,
    submitCurrentAnalysis,

    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
    goToLogin: () => navigate({ to: "/login" }),
    goToSignUp: () => navigate({ to: "/sign-up" }),

    fileUpload,
    home,
  };
}

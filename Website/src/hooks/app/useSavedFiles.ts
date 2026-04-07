import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { axiosInstance, resolveApiUrl } from "@/api/axiosInstance";

type SavedFileApiItem = {
  id: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
  uploadedAt: string;
  downloadUrl: string;
  jobDescriptionDownloadUrl: string | null;
  aiResponse: {
    status: string;
    matchScore: number;
    feedback: string;
    missingKeywords: string[];
    skillsAnalysis: Record<string, string>;
  };
};

export type SavedFileItem = SavedFileApiItem & {
  chatTitle: string;
};

function createChatTitle(uploadedAt: string, id: string): string {
  const date = new Date(uploadedAt);
  const timestamp = Number.isNaN(date.getTime())
    ? "Unknown time"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);

  const shortId = id.slice(0, 6).toUpperCase();
  return `Chat ${timestamp} • ${shortId}`;
}

const getSavedFiles = async () => {
  try {
    const response = await axiosInstance.get<SavedFileApiItem[]>("saved-files");
    return response.data.map((file) => ({
      ...file,
      downloadUrl: resolveApiUrl(file.downloadUrl) ?? file.downloadUrl,
      jobDescriptionDownloadUrl: resolveApiUrl(file.jobDescriptionDownloadUrl),
      chatTitle: createChatTitle(file.uploadedAt, file.id),
    }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return [];
    }

    throw error;
  }
};

export function useSavedFiles() {
  return useQuery({
    queryKey: ["savedFiles"],
    queryFn: getSavedFiles,
  });
}

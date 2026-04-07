import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@/api/axiosInstance";

export type SavedFileItem = {
  id: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
  uploadedAt: string;
  downloadUrl: string;
  aiResponse: {
    status: string;
    matchScore: number;
    feedback: string;
    missingKeywords: string[];
    skillsAnalysis: Record<string, string>;
  };
};

const getSavedFiles = async () => {
  try {
    const response = await axiosInstance.get<SavedFileItem[]>("saved-files");
    return response.data;
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

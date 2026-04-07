import type { SavedFileItem } from "@/hooks/app/useSavedFiles";

export type ActiveConversation = {
  fileName: string;
  downloadUrl: string | null;
  jobDescriptionDownloadUrl: string | null;
  aiResponse: SavedFileItem["aiResponse"];
};

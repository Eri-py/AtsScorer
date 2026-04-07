import { useState } from "react";
import { z } from "zod";

import { axiosInstance } from "@/api/axiosInstance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnalysisResult } from "./types";

type StartResumeAnalysisRequest = {
  file: File;
  jobDescription: string;
};

const startResumeAnalysisApi = (data: FormData) =>
  axiosInstance.post<AnalysisResult>("analyse-resume", data);

const jobDescriptionSchema = z.string().min(1, "Job description is required");

export function useHomePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [jobDescriptionError, setJobDescriptionError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [latestFileName, setLatestFileName] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const startResumeAnalysisMutation = useMutation({
    mutationFn: async (data: StartResumeAnalysisRequest) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("fileName", data.file.name);
      formData.append("jobDescription", data.jobDescription);
      return startResumeAnalysisApi(formData);
    },
    onSuccess: (response, variables) => {
      setAnalysisResult(response.data);
      setLatestFileName(variables.file.name);
      queryClient.invalidateQueries({ queryKey: ["savedFiles"] });
    },
  });

  const submitAnalysis = (data: StartResumeAnalysisRequest) =>
    startResumeAnalysisMutation.mutate(data);

  const submitAnalysisAsync = (data: StartResumeAnalysisRequest) =>
    startResumeAnalysisMutation.mutateAsync(data);

  const validateJobDescription = (value: string) => {
    const result = jobDescriptionSchema.safeParse(value);
    if (!result.success) {
      setJobDescriptionError(z.prettifyError(result.error) || "Job description is required");
      return false;
    }
    setJobDescriptionError(null);
    return true;
  };

  // New function to handle both setting and validating
  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    validateJobDescription(value);
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setLatestFileName(null);
    setJobDescription("");
    setJobDescriptionError(null);
  };

  return {
    // Job Description
    jobDescription,
    setJobDescription,
    jobDescriptionError,
    validateJobDescription,
    handleJobDescriptionChange,

    submitAnalysis,
    submitAnalysisAsync,
    isSubmitting: startResumeAnalysisMutation.isPending,
    analysisResult,
    latestFileName,
    resetAnalysis,
  };
}

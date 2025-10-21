import { useState } from "react";
import { z } from "zod";

import { axiosInstance } from "@/api/axiosInstance";
import { useMutation } from "@tanstack/react-query";

type StartResumeAnalysisRequest = {
  file: File;
  jobDescription: string;
};

const startResumeAnalysisApi = (data: FormData) => {
  return axiosInstance.post("analyse-resume", data);
};

const jobDescriptionSchema = z.string().min(1, "Job description is required");

export function useHomePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [jobDescriptionError, setJobDescriptionError] = useState<string | null>(null);

  const startResumeAnalysisMutation = useMutation({
    mutationFn: (data: FormData) => startResumeAnalysisApi(data),
  });

  const submitAnalysis = (data: StartResumeAnalysisRequest) => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("fileName", data.file.name);
    formData.append("jobDescription", data.jobDescription);

    startResumeAnalysisMutation.mutate(formData);
  };

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

  return {
    // Job Description
    jobDescription,
    setJobDescription,
    jobDescriptionError,
    validateJobDescription,
    handleJobDescriptionChange,

    submitAnalysis,
    isSubmitting: startResumeAnalysisMutation.isPending,
  };
}

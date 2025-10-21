import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";
import MobileStepper from "@mui/material/MobileStepper";
import TextField from "@mui/material/TextField";

import { HomeHeader } from "@/components/home/HomeHeader";
import { UploadArea } from "@/components/home/UploadArea";
import { FilePreview } from "@/components/home/FilePreview";
import { ContinueButton } from "@/components/home/ContinueButton";
import { useFileUpload } from "@/hooks/home/useFileUpload";
import { useHomePage } from "@/hooks/home/useHomePage";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const theme = useTheme();
  const [step, setStep] = useState<number>(0);
  const { file, errors, getRootProps, getInputProps, isDragActive, removeFile, removeError } =
    useFileUpload();
  const {
    jobDescription,
    jobDescriptionError,
    validateJobDescription,
    handleJobDescriptionChange,
    submitAnalysis,
    isSubmitting,
  } = useHomePage();

  // Handlers
  const handleNext = () => {
    if (file && step === 0) {
      setStep(1);
    }
  };

  const handleRemoveFile = () => {
    removeFile();
    if (step === 1) {
      setStep(0);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !validateJobDescription(jobDescription)) {
      return;
    }

    submitAnalysis({ file: file, jobDescription: jobDescription });
  };

  return (
    <Stack flex={1} alignItems="center" gap={4}>
      <HomeHeader />

      {/* Error Messages */}
      {errors.length > 0 && (
        <Stack width={800} gap={2}>
          {errors.map((error, index) => (
            <Alert key={index} severity="error" onClose={() => removeError(index)}>
              {error}
            </Alert>
          ))}
        </Stack>
      )}

      {/* Main Form */}
      <form onSubmit={onSubmit}>
        <Stack
          width={800}
          alignItems="center"
          boxShadow={`0px 0px 2px ${theme.palette.primary.main}`}
          borderRadius={3}
          padding={2}
          gap={4}
        >
          {/* Step Indicator */}
          <MobileStepper
            variant="dots"
            steps={2}
            position="static"
            activeStep={step}
            sx={{ maxWidth: 400, flexGrow: 1 }}
            backButton={undefined}
            nextButton={undefined}
          />

          {/* Step 0: Upload Resume */}
          {step === 0 && (
            <UploadArea
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
            />
          )}

          {/* Step 1: Job Description */}
          {step === 1 && (
            <TextField
              label="Job Description"
              multiline
              rows={6}
              fullWidth
              autoFocus
              placeholder="Type the job description here..."
              variant="outlined"
              value={jobDescription}
              onChange={(e) => handleJobDescriptionChange(e.target.value)}
              error={!!jobDescriptionError}
              helperText={jobDescriptionError}
              slotProps={{
                htmlInput: {
                  sx: {
                    resize: "vertical",
                    overflow: "auto",
                    maxHeight: 500,
                  },
                },
              }}
            />
          )}

          {/* File Preview */}
          {file && <FilePreview file={file} removeFile={handleRemoveFile} />}

          {/* Continue/Submit Button */}
          {file && (
            <ContinueButton handleNext={handleNext} step={step} isSubmitting={isSubmitting} />
          )}
        </Stack>
      </form>
    </Stack>
  );
}

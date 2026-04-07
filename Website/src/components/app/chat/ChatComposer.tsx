import type { FormEvent, HTMLAttributes, InputHTMLAttributes } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";

import { FilePreview } from "@/components/home/FilePreview";

type ChatComposerProps = {
  file: File | null;
  errors: string[];
  isDragActive: boolean;
  getRootProps: () => HTMLAttributes<HTMLDivElement>;
  getInputProps: () => InputHTMLAttributes<HTMLInputElement>;
  removeFile: () => void;
  removeError: (index: number) => void;
  jobDescription: string;
  jobDescriptionError: string | null;
  onJobDescriptionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  isSubmitting: boolean;
};

export function ChatComposer({
  file,
  errors,
  isDragActive,
  getRootProps,
  getInputProps,
  removeFile,
  removeError,
  jobDescription,
  jobDescriptionError,
  onJobDescriptionChange,
  onSubmit,
  onReset,
  isSubmitting,
}: ChatComposerProps) {
  return (
    <Stack component="form" onSubmit={onSubmit} px={{ xs: 1, md: 3 }} pb={2} gap={1.5}>
      {errors.map((error, index) => (
        <Alert key={index} severity="error" onClose={() => removeError(index)}>
          {error}
        </Alert>
      ))}

      <Paper
        variant="outlined"
        sx={{ p: 2, borderRadius: 3, borderColor: "divider", backgroundColor: "background.paper" }}
      >
        <TextField
          label="Job Description"
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(event) => onJobDescriptionChange(event.target.value)}
          error={!!jobDescriptionError}
          helperText={jobDescriptionError}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={1.5}
          mt={1.5}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              {...getRootProps()}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                borderRadius: 100,
                px: 1.25,
                py: 0.6,
                cursor: "pointer",
                border: 1,
                borderColor: "divider",
              }}
            >
              <AttachFileRoundedIcon fontSize="small" />
              <Typography variant="body2">Attach</Typography>
              <input {...getInputProps()} />
            </Box>

            <Typography variant="caption" color="text.secondary">
              {isDragActive ? "Drop file to upload" : "PDF, DOC, DOCX up to 10MB"}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button variant="outlined" onClick={onReset} disabled={isSubmitting}>
              Reset
            </Button>
            <Button type="submit" variant="contained" disabled={!file || isSubmitting}>
              {isSubmitting ? "Analyzing..." : "Send"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {file && <FilePreview file={file} removeFile={removeFile} />}
    </Stack>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useHomePage } from "@/hooks/home/useHomePage";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const theme = useTheme();

  const { getRootProps, getInputProps, isDragActive } = useHomePage();

  return (
    <Stack flex={1} alignItems="center" gap={4}>
      <Stack alignItems="center">
        <Typography variant="h3" fontWeight={500}>
          Transform Your Resume
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={300}>
          Upload, analyze, and optimize in seconds
        </Typography>
      </Stack>

      <Stack
        width={800}
        alignItems="center"
        boxShadow={`0px 0px 2px ${theme.palette.primary.main}`}
        borderRadius={3}
        padding={2}
      >
        <Paper
          {...getRootProps()}
          component="button"
          sx={{
            width: "100%",
            maxWidth: 800,
            border: `2px dashed ${theme.palette.primary.main}`,
            borderRadius: 3,
            padding: 4,
            aspectRatio: 3 / 1,
            alignContent: "center",
            textAlign: "center",
            transition: "all 0.2s ease",
            "&:hover": {
              cursor: "pointer",
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadOutlinedIcon
            sx={{
              fontSize: 48,
              color: isDragActive ? theme.palette.success.main : theme.palette.primary.main,
              opacity: 0.7,
              transition: "color 0.2s ease",
            }}
          />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? "Drop your resume here" : "Upload your resume"}
          </Typography>
          {!isDragActive && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Click to browse or drag and drop
              </Typography>
              <Typography variant="body2" color="text.secondary">
                supported formats: .pdf, .doc, .docx,
              </Typography>
            </>
          )}
        </Paper>
      </Stack>
    </Stack>
  );
}

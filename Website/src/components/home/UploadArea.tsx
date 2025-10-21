import type { DropzoneInputProps, DropzoneRootProps } from "react-dropzone";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

type UploadAreaProps = {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  isDragActive: boolean;
};

export function UploadArea({ getRootProps, getInputProps, isDragActive }: UploadAreaProps) {
  const theme = useTheme();

  return (
    <Paper
      {...getRootProps()}
      component="button"
      type="button"
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
  );
}

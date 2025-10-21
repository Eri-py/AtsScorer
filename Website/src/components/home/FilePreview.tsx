import type { ReactNode } from "react";

import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type FilePreviewProps = {
  file: File;
  removeFile: () => void;
};

const getFileIcon = (fileType: string) => {
  const iconMap: Record<string, ReactNode> = {
    "application/pdf": <PictureAsPdfIcon />,
    "application/msword": <DescriptionIcon />,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": <DescriptionIcon />,
  };

  return iconMap[fileType] || <InsertDriveFileIcon color="action" />;
};

export function FilePreview({ file, removeFile }: FilePreviewProps) {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        width: "100%",
        maxWidth: 800,
      }}
      gap={2}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        boxShadow={`0px 0px 2px ${theme.palette.primary.main}`}
        borderRadius={3}
        padding={2}
        gap={2}
      >
        <Stack direction="row" gap={2} flex={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            {getFileIcon(file.type)}
            <Typography fontWeight={500}>{file.name}</Typography>
          </Stack>
          <Typography color="text.secondary">{(file.size / 1024).toFixed(2)} KB</Typography>
        </Stack>

        <IconButton size="small" onClick={removeFile} aria-label="Remove file">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
}

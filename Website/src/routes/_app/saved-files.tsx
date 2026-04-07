import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useSavedFiles } from "@/hooks/app/useSavedFiles";

export const Route = createFileRoute("/_app/saved-files")({
  component: SavedFilesPage,
});

function SavedFilesPage() {
  const { data, isLoading, isError } = useSavedFiles();

  return (
    <Stack flex={1} alignItems="center" padding={2}>
      <Paper sx={{ width: "100%", maxWidth: 900, p: 3 }} elevation={1}>
        <Stack gap={2}>
          <Typography variant="h5" fontWeight={600}>
            My Saved Files
          </Typography>

          {isLoading && (
            <Stack alignItems="center" paddingY={3}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {isError && <Alert severity="error">Could not load your saved files.</Alert>}

          {!isLoading && !isError && data && data.length === 0 && (
            <Alert severity="info">No files saved yet. Upload a resume to get started.</Alert>
          )}

          {!isLoading && !isError && data && data.length > 0 && (
            <List disablePadding>
              {data.map((file) => (
                <ListItem
                  key={file.id}
                  divider
                  secondaryAction={
                    <Link
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      underline="hover"
                    >
                      Download
                    </Link>
                  }
                >
                  <ListItemText
                    primary={file.fileName}
                    secondary={`${file.contentType} • ${Math.ceil(file.sizeInBytes / 1024)} KB • Saved ${formatDistanceToNow(new Date(file.uploadedAt))} ago`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

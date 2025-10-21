import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function HomeHeader() {
  return (
    <Stack alignItems="center">
      <Typography variant="h3" fontWeight={500}>
        Transform Your Resume
      </Typography>
      <Typography variant="h6" color="text.secondary" fontWeight={300}>
        Upload, analyze, and optimize in seconds
      </Typography>
    </Stack>
  );
}

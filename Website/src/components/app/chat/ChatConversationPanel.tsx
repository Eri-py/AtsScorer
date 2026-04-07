import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { ActiveConversation } from "./types";

type ChatConversationPanelProps = {
  conversation: ActiveConversation | null;
};

const quickActions = ["Write feedback", "Missing keywords", "Skill gaps", "Improve phrasing"];

function getAssessmentLabel(score: number): {
  label: string;
  color: "success" | "warning" | "error";
} {
  if (score >= 75) return { label: "Good", color: "success" };
  if (score >= 50) return { label: "Average", color: "warning" };
  return { label: "Needs Work", color: "error" };
}

export function ChatConversationPanel({ conversation }: ChatConversationPanelProps) {
  if (!conversation) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" gap={2} px={2}>
        <Typography variant="h3" fontWeight={700} textAlign="center">
          Welcome to ATS Chat
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Upload a resume and paste a job description to start your next chat.
        </Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1} mt={1}>
          {quickActions.map((action) => (
            <Chip key={action} label={action} variant="outlined" />
          ))}
        </Box>
      </Stack>
    );
  }

  const assessment = getAssessmentLabel(conversation.aiResponse.matchScore);

  return (
    <Stack flex={1} overflow="auto" gap={2} px={{ xs: 1, md: 3 }} py={2}>
      <Paper
        sx={{
          p: 2,
          alignSelf: "flex-end",
          maxWidth: { xs: "100%", md: "72%" },
          borderRadius: 3,
          backgroundColor: "background.paper",
        }}
        variant="outlined"
      >
        <Typography variant="caption" color="text.secondary">
          You
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          Uploaded resume: {conversation.fileName}
        </Typography>
        {conversation.downloadUrl && (
          <Link href={conversation.downloadUrl} target="_blank" rel="noreferrer">
            Download file
          </Link>
        )}
      </Paper>

      <Paper
        sx={{
          p: 2.25,
          alignSelf: "flex-start",
          maxWidth: { xs: "100%", md: "80%" },
          borderRadius: 3,
          backgroundColor: "background.paper",
        }}
        variant="outlined"
      >
        <Typography variant="caption" color="text.secondary">
          ATS Assistant
        </Typography>

        <Stack direction="row" alignItems="center" gap={1} mt={1} mb={1.5}>
          <Typography variant="body2" color="text.secondary">
            ATS assessment
          </Typography>
          <Chip label={assessment.label} color={assessment.color} size="small" />
        </Stack>

        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {conversation.aiResponse.feedback}
        </Typography>

        {conversation.aiResponse.missingKeywords.length > 0 && (
          <Stack mt={2} gap={1}>
            <Typography variant="body2" color="text.secondary">
              Missing keywords
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {conversation.aiResponse.missingKeywords.map((keyword) => (
                <Chip key={keyword} label={keyword} size="small" variant="outlined" />
              ))}
            </Box>
          </Stack>
        )}

        {Object.keys(conversation.aiResponse.skillsAnalysis).length > 0 && (
          <Stack mt={2} gap={1}>
            <Typography variant="body2" color="text.secondary">
              Skills analysis
            </Typography>
            {Object.entries(conversation.aiResponse.skillsAnalysis).map(([skill, summary]) => (
              <Typography key={skill} variant="body2">
                <strong>{skill}:</strong> {summary}
              </Typography>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}

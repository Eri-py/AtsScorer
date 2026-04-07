import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { axiosInstance } from "@/api/axiosInstance";
import type { ActiveConversation } from "./types";

type ChatConversationPanelProps = {
  conversation: ActiveConversation | null;
};

const quickActions = ["Write feedback", "Missing keywords", "Skill gaps", "Improve phrasing"];

function normalizeScore(score: number): number {
  const normalizedScore = score <= 1 ? score * 100 : score;
  return Math.max(0, Math.min(100, normalizedScore));
}

export function ChatConversationPanel({ conversation }: ChatConversationPanelProps) {
  const [jobDescriptionText, setJobDescriptionText] = useState<string | null>(null);
  const [isLoadingJobDescription, setIsLoadingJobDescription] = useState(false);

  useEffect(() => {
    const jobDescriptionUrl = conversation?.jobDescriptionDownloadUrl;

    if (!jobDescriptionUrl) {
      setJobDescriptionText(null);
      setIsLoadingJobDescription(false);
      return;
    }

    let isMounted = true;

    const loadJobDescription = async () => {
      setIsLoadingJobDescription(true);
      try {
        const response = await axiosInstance.get<string>(jobDescriptionUrl, {
          responseType: "text",
        });

        if (isMounted) {
          setJobDescriptionText(String(response.data));
        }
      } catch {
        if (isMounted) {
          setJobDescriptionText(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingJobDescription(false);
        }
      }
    };

    void loadJobDescription();

    return () => {
      isMounted = false;
    };
  }, [conversation?.jobDescriptionDownloadUrl]);

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

  const normalizedScore = normalizeScore(conversation.aiResponse.matchScore);
  const scoreOutOfTen = (normalizedScore / 10).toFixed(1);

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
        <Stack direction="row" gap={1.5} flexWrap="wrap" mt={0.75}>
          {conversation.downloadUrl && (
            <Link href={conversation.downloadUrl} target="_blank" rel="noreferrer">
              Open resume
            </Link>
          )}
        </Stack>
      </Paper>

      {(conversation.jobDescriptionDownloadUrl ||
        isLoadingJobDescription ||
        jobDescriptionText) && (
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
            Job Description
          </Typography>

          {conversation.jobDescriptionDownloadUrl && (
            <Box mt={0.5}>
              <Link href={conversation.jobDescriptionDownloadUrl} target="_blank" rel="noreferrer">
                Open .txt attachment
              </Link>
            </Box>
          )}

          {isLoadingJobDescription && (
            <Typography variant="body2" color="text.secondary" mt={1.25}>
              Loading job description...
            </Typography>
          )}

          {!isLoadingJobDescription && jobDescriptionText && (
            <Box
              mt={1.25}
              p={1.25}
              sx={{
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                backgroundColor: "background.default",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {jobDescriptionText}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

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
            ATS score
          </Typography>
          <Typography variant="body1" fontWeight={700} color="text.primary">
            {scoreOutOfTen}/10
          </Typography>
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

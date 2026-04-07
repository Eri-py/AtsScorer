import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import type { AnalysisResult } from "@/hooks/home/types";

type AnalysisResultsProps = {
  result: AnalysisResult;
  onReset: () => void;
};

function getScoreLabel(score: number): { label: string; color: "success" | "warning" | "error" } {
  if (score >= 75) return { label: "Good", color: "success" };
  if (score >= 50) return { label: "Average", color: "warning" };
  return { label: "Needs Work", color: "error" };
}

function ScoreDisplay({ score }: { score: number }) {
  const { label, color } = getScoreLabel(score);

  return (
    <Stack alignItems="center" gap={1.5}>
      <Typography variant="h6" fontWeight={400}>
        ATS Assessment
      </Typography>
      <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
        <Typography variant="h2" fontWeight={600} color={`${color}.main`}>
          {label}
        </Typography>
      </Box>
    </Stack>
  );
}

function FeedbackSection({ feedback }: { feedback: string }) {
  return (
    <Stack gap={1}>
      <Typography variant="h6" fontWeight={500}>
        Feedback
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}
      >
        {feedback}
      </Typography>
    </Stack>
  );
}

function MissingKeywords({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) return null;

  return (
    <Stack gap={1}>
      <Typography variant="h6" fontWeight={500}>
        Missing Keywords
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {keywords.map((keyword, index) => (
          <Chip key={index} label={keyword} variant="outlined" color="warning" size="small" />
        ))}
      </Box>
    </Stack>
  );
}

function SkillsAnalysis({ skills }: { skills: Record<string, string> }) {
  const entries = Object.entries(skills);
  if (entries.length === 0) return null;

  return (
    <Stack gap={1}>
      <Typography variant="h6" fontWeight={500}>
        Skills Analysis
      </Typography>
      <Stack gap={1.5}>
        {entries.map(([skill, assessment]) => (
          <Stack key={skill} direction="row" gap={1} alignItems="baseline">
            <Typography variant="body1" fontWeight={500} sx={{ minWidth: "fit-content" }}>
              {skill}:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {assessment}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

export function AnalysisResults({ result, onReset }: AnalysisResultsProps) {
  return (
    <Stack gap={3} width="100%">
      <ScoreDisplay score={result.matchScore} />

      <Divider />

      <FeedbackSection feedback={result.feedback} />

      <Divider />

      <MissingKeywords keywords={result.missingKeywords} />

      <SkillsAnalysis skills={result.skillsAnalysis} />

      <Button
        variant="outlined"
        startIcon={<RestartAltIcon />}
        onClick={onReset}
        sx={{ alignSelf: "center", borderRadius: 100, paddingInline: 4, paddingBlock: 1 }}
      >
        Analyze Another Resume
      </Button>
    </Stack>
  );
}

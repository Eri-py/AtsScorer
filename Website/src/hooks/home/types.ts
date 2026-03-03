export type AnalysisResult = {
  status: string;
  matchScore: number;
  feedback: string;
  missingKeywords: string[];
  skillsAnalysis: Record<string, string>;
};

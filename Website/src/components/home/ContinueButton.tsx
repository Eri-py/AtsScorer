import Button from "@mui/material/Button";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

type ContinueButtonTypes = {
  step: number;
  handleNext: () => void;
  isSubmitting?: boolean;
};

export function ContinueButton({ step, handleNext, isSubmitting = false }: ContinueButtonTypes) {
  switch (step) {
    case 0:
      return (
        <Button
          type="button"
          size="large"
          variant="contained"
          onClick={handleNext}
          sx={{ width: "100%", maxWidth: 200, paddingBlock: 1, borderRadius: 100, fontSize: 15 }}
        >
          Continue
        </Button>
      );
    case 1:
      return (
        <Button
          type="submit"
          size="large"
          variant="contained"
          startIcon={<AutoAwesomeIcon sx={{ color: "white" }} />}
          loading={isSubmitting}
          sx={{ width: "100%", maxWidth: 200, paddingBlock: 1, borderRadius: 100, fontSize: 15 }}
        >
          Analyze resume
        </Button>
      );
  }
}

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockIcon from "@mui/icons-material/Lock";

import { CustomFormHeader, CustomTextField } from "../CustomInputs";
import { AuthFooter } from "../AuthFooter";

type UsernameAndPasswordProps = {
  handleNext: () => void;
  isPending: boolean;
  isContinueDisabled: boolean;
};

export function UsernameAndPassword({
  handleNext,
  isPending,
  isContinueDisabled,
}: UsernameAndPasswordProps) {
  return (
    <Stack gap="0.75rem" paddingInline="1rem">
      <CustomFormHeader header="Log in" subtext="Glad to have you back!" align="center" />

      <CustomTextField
        type="email"
        label="Email"
        fieldValue="identifier"
        startIcon={<EmailOutlinedIcon />}
        autoComplete="email"
      />

      <CustomTextField
        type="password"
        label="Password"
        fieldValue="password"
        startIcon={<LockIcon />}
        autoComplete="off"
      />

      <Button
        variant="contained"
        size="large"
        type="button"
        onClick={handleNext}
        loading={isPending}
        disabled={isContinueDisabled}
      >
        Continue
      </Button>

      <AuthFooter mode="login" />
    </Stack>
  );
}

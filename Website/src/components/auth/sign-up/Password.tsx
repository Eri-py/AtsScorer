import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import LockIcon from "@mui/icons-material/Lock";

import { CustomFormHeader, CustomTextField } from "../CustomInputs";

type PasswordProps = {
  isPending: boolean;
  isContinueDisabled: boolean;
};

export function Password({ isPending, isContinueDisabled }: PasswordProps) {
  return (
    <Stack gap="0.75rem" paddingInline="1rem">
      <CustomFormHeader
        header="Create a strong password"
        subtext="We will never ask you for your password."
        align="flex-start"
      />
      <CustomTextField
        type="password"
        label="Password"
        fieldValue="password"
        startIcon={<LockIcon />}
        autoComplete="new-password"
      />

      <CustomTextField
        type="password"
        label="Confirm Password"
        fieldValue="confirmPassword"
        startIcon={<LockIcon />}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={isPending}
        disabled={isContinueDisabled}
      >
        Sign up
      </Button>
    </Stack>
  );
}

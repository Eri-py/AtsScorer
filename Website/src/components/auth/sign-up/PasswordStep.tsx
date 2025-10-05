import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import LockIcon from "@mui/icons-material/Lock";

import { CustomFormHeader, CustomTextField } from "../CustomInputs";

type PasswordStepProps = {
  isPending: boolean;
};

export function PasswordStep({ isPending }: PasswordStepProps) {
  return (
    <Stack gap="0.75rem" paddingInline="1rem">
      <CustomFormHeader
        header="Create a strong password"
        subtext="We will never ask you for your password."
        align="center"
      />

      <CustomTextField
        type="password"
        label="Password"
        fieldValue="password"
        startIcon={<LockIcon />}
        autoComplete="new-password"
        autoFocus
      />

      <CustomTextField
        type="password"
        label="Confirm Password"
        fieldValue="confirmPassword"
        startIcon={<LockIcon />}
        autoComplete="new-password"
      />

      <Button type="submit" variant="contained" size="large" loading={isPending}>
        Sign up
      </Button>
    </Stack>
  );
}

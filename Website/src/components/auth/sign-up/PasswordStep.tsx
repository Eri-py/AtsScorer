import { useFormContext } from "react-hook-form";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import LockIcon from "@mui/icons-material/Lock";

import { CustomFormHeader, CustomTextField } from "../CustomInputs";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { PasswordRequirements } from "./PasswordRequirements";

type PasswordStepProps = {
  isPending: boolean;
};

export function PasswordStep({ isPending }: PasswordStepProps) {
  const { watch } = useFormContext();
  const password: string = useDebounce(watch("password") || "");

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
      />

      <PasswordRequirements password={password} />

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

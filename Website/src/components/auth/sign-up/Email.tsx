import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { OAuthButtonGroup } from "../OAuthButtonGroup";
import { CustomFormHeader, CustomTextField } from "../CustomInputs";
import { AuthFooter } from "../AuthFooter";

type usernameAndEmailProps = {
  handleNext: () => void;
  isPending: boolean;
};

export function Email({ handleNext, isPending }: usernameAndEmailProps) {
  return (
    <Stack gap={3.5} paddingInline="1rem">
      <CustomFormHeader
        header="Sign up"
        subtext="join thousands of users already on our platform."
        align="center"
      />

      <CustomTextField
        type="email"
        label="Email"
        fieldValue="email"
        startIcon={<EmailOutlinedIcon />}
        autoComplete="email"
      />

      <Button
        variant="contained"
        size="large"
        type="button"
        onClick={handleNext}
        loading={isPending}
      >
        Continue
      </Button>

      <OAuthButtonGroup />

      <AuthFooter mode="register" />
    </Stack>
  );
}

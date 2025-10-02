import { useForm, FormProvider } from "react-hook-form";
import { string, z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

import { HorizontalLinearStepper } from "@/components/shared/HorizontalLinearStepper";
import { OtpPage } from "@/components/auth/OtpPage";
import { Password } from "@/components/auth/sign-up/Password";
import { UsernameAndEmail } from "@/components/auth/sign-up/Email";
import { emailSchema, passwordSchema } from "@/components/auth/Schemas";
import { useTheme } from "@mui/material/styles";
import { useSignUp } from "@/hooks/auth/useSignUp";

export const Route = createFileRoute("/_auth/sign-up")({
  component: SignUp,
});

const SignUpFormSchema = z.object({
  email: emailSchema,
  otp: z.string("Invalid otp").trim().length(6, "Invalid otp"),
  password: passwordSchema,
  confirmPassword: string("Invalid password").nonempty("Please enter password again"),
});
type SignUpFormSchemaTypes = z.infer<typeof SignUpFormSchema>;

const signUpSteps: Record<number, (keyof SignUpFormSchemaTypes)[]> = {
  0: ["email"],
  1: ["otp"],
  2: ["password", "confirmPassword"],
};
const signUpStepLabels: string[] = ["Email", "Verification Code", "Password"];

function SignUp() {
  const [step, setStep] = useState<number>(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const theme = useTheme();
  const {
    serverError,
    continueDisabled,
    clearServerError,
    startSignUpAsync,
    isStarting,
    verifyOtp,
    isVerifying,
    completeSignUp,
    isCompleting,
  } = useSignUp();

  const methods = useForm<SignUpFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(SignUpFormSchema),
  });

  const handleNext = async () => {
    const currentStep = signUpSteps[step];
    const isValid = await methods.trigger(currentStep);

    if (isValid) {
      clearServerError();
      switch (step) {
        case 0: {
          const email = methods.getValues("email");
          const response = await startSignUpAsync({ email });
          setOtpExpiresAt(response.data.otpExpiresAt);
          setStep(1);
          break;
        }
        case 1: {
          const email = methods.getValues("email");
          const otp = methods.getValues("otp");
          verifyOtp({ email, otp });
          setStep(2);
          break;
        }
      }
    }
  };

  const handleOtpExpiresAtUpdate = (newExpiresAt: string) => {
    setOtpExpiresAt(newExpiresAt);
  };

  const onSubmit = (formData: SignUpFormSchemaTypes) => {
    clearServerError();
    completeSignUp(formData);
  };

  return (
    <Stack
      paddingBlock={2}
      paddingInline={1}
      gap={2}
      sx={{
        width: { xs: "100%", md: "480px" },
        height: "fit-content",
      }}
    >
      <HorizontalLinearStepper
        steps={signUpStepLabels}
        activeStep={step}
        setActiveStep={(value) => setStep(value)}
      />

      {serverError !== null && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: "1rem" }}>
          {serverError}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {step === 0 && (
            <UsernameAndEmail
              handleNext={handleNext}
              isPending={isStarting}
              isContinueDisabled={continueDisabled}
            />
          )}
          {step === 1 && otpExpiresAt && (
            <OtpPage
              email={methods.getValues("email")}
              otpExpiresAt={otpExpiresAt}
              handleNext={handleNext}
              handleBack={() => setStep(0)}
              isPending={isVerifying}
              isContinueDisabled={continueDisabled}
              onOtpExpiresAtUpdate={handleOtpExpiresAtUpdate}
              mode="register"
            />
          )}
          {step === 2 && (
            <Password isPending={isCompleting} isContinueDisabled={continueDisabled} />
          )}
        </form>
      </FormProvider>
    </Stack>
  );
}

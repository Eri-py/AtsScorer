import { useForm, FormProvider } from "react-hook-form";
import { string, z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

import { HorizontalLinearStepper } from "@/components/shared/HorizontalLinearStepper";
import { OtpPage } from "@/components/auth/OtpPage";
import { Password } from "@/components/auth/sign-up/Password";
import { Email } from "@/components/auth/sign-up/Email";
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
  const theme = useTheme();
  const {
    step,
    setStep,
    otpExpiresAt,
    serverErrorMessage,
    clearServerError,
    startSignUpAsync,
    isStarting,
    verifyOtp,
    isVerifying,
    resendOtpAsync,
    isResendingOtp,
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
          await startSignUpAsync({ email });
          break;
        }
        case 1: {
          const email = methods.getValues("email");
          const otp = methods.getValues("otp");
          verifyOtp({ email, otp });
          break;
        }
      }
    }
  };

  const onSubmit = (formData: SignUpFormSchemaTypes) => {
    clearServerError();
    completeSignUp({
      email: formData.email,
      password: formData.password,
    });
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
      <HorizontalLinearStepper steps={signUpStepLabels} activeStep={step} setActiveStep={setStep} />

      {serverErrorMessage && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: "1rem" }}>
          {serverErrorMessage}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {step === 0 && <Email handleNext={handleNext} isPending={isStarting} />}
          {step === 1 && otpExpiresAt && (
            <OtpPage
              mode="register"
              email={methods.getValues("email")}
              intitialOtpExpiresAt={otpExpiresAt}
              handleNext={handleNext}
              handleBack={() => setStep(0)}
              isPending={isVerifying}
              resendOtpAsync={resendOtpAsync}
              isResending={isResendingOtp}
            />
          )}
          {step === 2 && <Password isPending={isCompleting} />}
        </form>
      </FormProvider>
    </Stack>
  );
}

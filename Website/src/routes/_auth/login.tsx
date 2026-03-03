import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

import { UsernameAndPassword } from "@/components/auth/login/EmailAndPasswordStep";
import { emailSchema } from "@/components/auth/Schemas";
import { useLogin } from "@/hooks/auth/useLogin";

export const Route = createFileRoute("/_auth/login")({
  component: Login,
});

const LoginFormSchema = z.object({
  identifier: emailSchema,
  password: z.string().nonempty("Please enter your password"),
});
type LoginFormSchemaTypes = z.infer<typeof LoginFormSchema>;

function Login() {
  const theme = useTheme();
  const { serverErrorMessage, clearServerError, login, isLoggingIn } = useLogin();

  const methods = useForm<LoginFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(LoginFormSchema),
  });

  const handleNext = () => {
    clearServerError();
    methods.handleSubmit((formData) => {
      login({
        identifier: formData.identifier,
        password: formData.password,
      });
    })();
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
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
      {serverErrorMessage && (
        <Alert severity="error" sx={{ color: theme.palette.text.primary, fontSize: "1rem" }}>
          {serverErrorMessage}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleNext)} onKeyDown={onEnter}>
          <UsernameAndPassword
            handleNext={handleNext}
            isPending={isLoggingIn}
            isContinueDisabled={!methods.formState.isValid}
          />
        </form>
      </FormProvider>
    </Stack>
  );
}

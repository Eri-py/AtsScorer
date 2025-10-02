import { useFormContext, get } from "react-hook-form";
import { useState, type ReactNode } from "react";

import { useTheme } from "@mui/material/styles";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Button from "@mui/material/Button";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type CustomTextFieldProps = TextFieldProps & {
  type: string;
  label: string;
  fieldValue: string;
  startIcon?: ReactNode;
  flex?: number;
  autoComplete?: string;
};

export function CustomTextField({
  type,
  label,
  fieldValue,
  startIcon,
  autoComplete,
  ...props
}: CustomTextFieldProps) {
  const theme = useTheme();
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const isPasswordField = type === "password";
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const passwordEndAdornment = () => {
    return (
      <Button
        disableRipple
        type="button"
        variant="text"
        onClick={() => {
          setPasswordVisible(!isPasswordVisible);
        }}
        sx={{
          padding: "0rem",
          color: theme.palette.text.primary,
          "&:hover": {
            background: "none",
          },
        }}
      >
        {isPasswordVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </Button>
    );
  };

  return (
    <TextField
      {...props}
      variant="outlined"
      type={isPasswordField ? (isPasswordVisible ? "text" : "password") : type}
      label={label}
      error={!!get(errors, fieldValue)}
      helperText={get(errors, fieldValue)?.message}
      autoComplete={autoComplete}
      slotProps={{
        input: {
          startAdornment: startIcon ?? "",
          endAdornment: isPasswordField && passwordEndAdornment(),
          sx: {
            gap: "0.5rem",
            backgroundColor: theme.palette.background.paper,
          },
        },
        htmlInput: {
          ...register(fieldValue),
        },
      }}
    />
  );
}

type CustomFormHeaderProps = {
  header: string;
  subtext: string | ReactNode;
  align: string;
};

export function CustomFormHeader({ header, subtext, align }: CustomFormHeaderProps) {
  return (
    <Stack alignItems={align}>
      <Typography fontWeight={500} fontSize="1.5rem" color="textPrimary">
        {header}
      </Typography>
      <Typography
        fontWeight={200}
        fontSize="0.95rem"
        color="textSecondary"
        sx={{ textWrap: "nowrap" }}
      >
        {subtext}
      </Typography>
    </Stack>
  );
}

import { z } from "zod/v4";

export const emailSchema = z.email("Invalid email address").max(100, "Maximum 100 characters");

export const passwordSchema = z
  .string("Password is required")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[#?!@$%^&\-._]/, "Password must contain at least one special character (#?!@$%^&-._)")
  .regex(/^[A-Za-z0-9#?!@$%^&\-._]+$/, "Password contains invalid characters")
  .min(8, "Password must be at least 8 characters long")
  .max(64, "Password must be no more than 64 characters long");

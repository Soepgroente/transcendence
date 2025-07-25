import { z } from "zod";

const userNameSchema = z
  .string()
  .min(3, "Name must be at least 3 characters long")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Name can only contain letters, numbers, and underscores"
  );

const userPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[\W_]/, "Password must contain at least one special character");

export const signUpInput = z.object({
  name: userNameSchema,
  email: z.string().email(),
  password: userPasswordSchema,
});

export const loginInput = z.object({
  email: z.string().email(),
  password: userPasswordSchema,
});

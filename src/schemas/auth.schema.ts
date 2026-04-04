import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .email("Enter a valid email");

const registerPasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password is too long");

const loginPasswordSchema = z
  .string()
  .min(1, "Enter your password")
  .max(100, "Password is too long");

export const registerBodySchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80, "Name is too long"),
  email: emailSchema,
  password: registerPasswordSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

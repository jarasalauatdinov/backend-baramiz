import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("email must be valid");

const passwordSchema = z
  .string()
  .trim()
  .min(6, "password must be at least 6 characters");

export const registerBodySchema = z.object({
  name: z.string().trim().min(2, "name is required"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1, "password is required"),
});

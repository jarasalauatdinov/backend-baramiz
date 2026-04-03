import { z } from "zod";

const emailSchema = z.string().trim().email("email must be valid");
const passwordSchema = z.string().min(6, "password must be at least 6 characters").max(100);

export const registerBodySchema = z.object({
  name: z.string().trim().min(1, "name is required").max(80, "name is too long"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

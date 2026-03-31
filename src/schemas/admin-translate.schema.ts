import { z } from "zod";

export const adminTranslateBodySchema = z.object({
  name_uz: z.string().trim().min(1, "name_uz is required"),
  description_uz: z.string().trim().min(1, "description_uz is required"),
});

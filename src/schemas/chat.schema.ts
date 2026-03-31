import { z } from "zod";
import { languageSchema } from "./common.schema";

export const chatBodySchema = z.object({
  message: z.string().trim().min(1, "message is required").max(500, "message is too long"),
  language: languageSchema,
});

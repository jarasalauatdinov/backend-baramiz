import { z } from "zod";
import { idParamSchema, languageSchema } from "./common.schema";

export const localizedContentQuerySchema = z.object({
  language: languageSchema.optional(),
});

export const destinationSlugParamsSchema = z.object({
  slug: z.string().trim().min(1, "slug is required"),
});

export const placeIdParamsSchema = idParamSchema;

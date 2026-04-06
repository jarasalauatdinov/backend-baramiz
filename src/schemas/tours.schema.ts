import { z } from "zod";
import { booleanQuerySchema, idParamSchema, languageSchema, optionalQueryStringSchema } from "./common.schema";

export const getToursQuerySchema = z.object({
  city: optionalQueryStringSchema,
  type: optionalQueryStringSchema,
  featured: booleanQuerySchema,
  language: languageSchema.optional(),
});

export const getTourByIdParamsSchema = idParamSchema;
export const getTourByIdQuerySchema = z.object({
  language: languageSchema.optional(),
});

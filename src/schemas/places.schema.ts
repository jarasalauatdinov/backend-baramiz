import { z } from "zod";
import {
  booleanQuerySchema,
  categoryIdSchema,
  idParamSchema,
  languageSchema,
  optionalQueryStringSchema,
} from "./common.schema";

export const getPlacesQuerySchema = z.object({
  city: optionalQueryStringSchema,
  category: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim().toLowerCase();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }, categoryIdSchema.optional()),
  featured: booleanQuerySchema,
  language: languageSchema.optional(),
});

export const getPlaceByIdParamsSchema = idParamSchema;
export const getPlaceByIdQuerySchema = z.object({
  language: languageSchema.optional(),
});

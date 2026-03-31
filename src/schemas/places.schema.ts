import { z } from "zod";
import { booleanQuerySchema, categoryIdSchema, idParamSchema, optionalQueryStringSchema } from "./common.schema";

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
});

export const getPlaceByIdParamsSchema = idParamSchema;

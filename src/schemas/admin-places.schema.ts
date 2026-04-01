import { z } from "zod";
import { getPlacesQuerySchema } from "./places.schema";
import { categoryIdSchema, idParamSchema } from "./common.schema";
import { coordinatesSchema } from "./tourism-data.schema";

const optionalLocalizedTextSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().min(1).optional());

export const adminPlaceBodySchema = z.object({
  name_kaa: z.string().trim().min(1, "name_kaa is required"),
  name_uz: z.string().trim().min(1, "name_uz is required"),
  name_ru: optionalLocalizedTextSchema,
  name_en: optionalLocalizedTextSchema,
  description_kaa: z.string().trim().min(1, "description_kaa is required"),
  description_uz: z.string().trim().min(1, "description_uz is required"),
  description_ru: optionalLocalizedTextSchema,
  description_en: optionalLocalizedTextSchema,
  image: z.string().trim().min(1, "image is required"),
  city: z.string().trim().min(1, "city is required"),
  region: z.string().trim().min(1, "region is required"),
  category: categoryIdSchema,
  featured: z.boolean(),
  coordinates: coordinatesSchema,
  durationMinutes: z.coerce.number().int().positive(),
  autoTranslate: z.boolean().optional().default(false),
});

export const adminPlaceParamsSchema = idParamSchema;
export const adminPlacesQuerySchema = getPlacesQuerySchema;

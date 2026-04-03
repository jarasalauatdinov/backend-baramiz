import { z } from "zod";
import { getPlacesQuerySchema } from "./places.schema";
import { categoryIdSchema, idParamSchema } from "./common.schema";
import { coordinatesSchema } from "./tourism-data.schema";

const optionalTrimmedStringSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().min(1).optional());

const optionalStringArraySchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return value;
}, z.array(z.string().trim().min(1)).optional());

export const adminPlaceBodySchema = z.object({
  name_kaa: z.string().trim().min(1, "name_kaa is required"),
  name_uz: z.string().trim().min(1, "name_uz is required"),
  name_ru: optionalTrimmedStringSchema,
  name_en: optionalTrimmedStringSchema,
  description_kaa: z.string().trim().min(1, "description_kaa is required"),
  description_uz: z.string().trim().min(1, "description_uz is required"),
  description_ru: optionalTrimmedStringSchema,
  description_en: optionalTrimmedStringSchema,
  shortDescription: optionalTrimmedStringSchema,
  image: z.preprocess((value) => {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    return undefined;
  }, z.string().trim().min(1).optional()),
  imageUrl: optionalTrimmedStringSchema,
  gallery: optionalStringArraySchema,
  city: z.string().trim().min(1, "city is required"),
  region: z.string().trim().min(1, "region is required"),
  address: optionalTrimmedStringSchema,
  category: categoryIdSchema,
  featured: z.boolean(),
  coordinates: coordinatesSchema,
  duration: z.preprocess((value) => value ?? undefined, z.coerce.number().int().positive().optional()),
  durationMinutes: z.preprocess((value) => value ?? undefined, z.coerce.number().int().positive().optional()),
  tags: optionalStringArraySchema,
  rating: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().min(0).max(5).optional()),
  workingHours: optionalTrimmedStringSchema,
  price: optionalTrimmedStringSchema,
  autoTranslate: z.boolean().optional().default(false),
}).superRefine((value, context) => {
  if (value.image === undefined && value.imageUrl === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["image"],
      message: "image is required",
    });
  }

  if (value.duration === undefined && value.durationMinutes === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["duration"],
      message: "duration is required",
    });
  }
});

export const adminPlaceParamsSchema = idParamSchema;
export const adminPlacesQuerySchema = getPlacesQuerySchema;

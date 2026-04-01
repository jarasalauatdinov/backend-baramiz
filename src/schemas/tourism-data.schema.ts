import { z } from "zod";
import { categoryIdSchema } from "./common.schema";

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const localizedPlaceFieldsSchema = z.object({
  name_kaa: z.string().trim().min(1),
  name_uz: z.string().trim().min(1),
  name_ru: z.string().trim().min(1),
  name_en: z.string().trim().min(1),
  description_kaa: z.string().trim().min(1),
  description_uz: z.string().trim().min(1),
  description_ru: z.string().trim().min(1),
  description_en: z.string().trim().min(1),
});

export const placeDataSchema = localizedPlaceFieldsSchema.extend({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  region: z.string().trim().min(1),
  category: categoryIdSchema,
  durationMinutes: z.number().int().positive(),
  description: z.string().trim().min(1),
  image: z.string().trim().min(1),
  coordinates: coordinatesSchema,
  featured: z.boolean(),
});

export const placesDataSchema = z.array(placeDataSchema);

export const categoryDataSchema = z.object({
  id: categoryIdSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

export const categoriesDataSchema = z.array(categoryDataSchema);

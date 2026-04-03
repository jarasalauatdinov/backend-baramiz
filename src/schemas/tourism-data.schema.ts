import { z } from "zod";
import { categoryIdSchema } from "./common.schema";
import { normalizeMultilingualTextInput } from "../utils/text-helpers";

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const multilingualTextSchema = z.object({
  kaa: z.string().trim().min(1),
  uz: z.string().trim().min(1),
  ru: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

const localizedTextDataSchema = z.preprocess((value) => {
  return normalizeMultilingualTextInput(value as never) ?? value;
}, multilingualTextSchema);

const optionalLocalizedTextDataSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return normalizeMultilingualTextInput(value as never) ?? value;
}, multilingualTextSchema.optional());

const optionalStringSchema = z.preprocess((value) => {
  return value === null ? undefined : value;
}, z.string().trim().min(1).optional());

const optionalNumberSchema = z.preprocess((value) => {
  return value === null ? undefined : value;
}, z.number().optional());

const optionalStringArraySchema = z.preprocess((value) => {
  return value === null ? undefined : value;
}, z.array(z.string().trim().min(1)).optional());

export const placeDataSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  city: z.string().trim().min(1),
  region: z.string().trim().min(1),
  category: categoryIdSchema,
  name: z.string().trim().min(1),
  name_kaa: z.string().trim().min(1),
  name_uz: z.string().trim().min(1),
  name_ru: z.string().trim().min(1),
  name_en: z.string().trim().min(1),
  description: z.string().trim().min(1),
  description_kaa: z.string().trim().min(1),
  description_uz: z.string().trim().min(1),
  description_ru: z.string().trim().min(1),
  description_en: z.string().trim().min(1),
  shortDescription: z.string().trim().min(1),
  address: optionalStringSchema,
  coordinates: coordinatesSchema,
  duration: z.number().int().positive(),
  image: z.string().trim().min(1),
  gallery: z.array(z.string().trim().min(1)).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  featured: z.boolean(),
  rating: z.preprocess((value) => value === null ? undefined : value, z.number().min(0).max(5).optional()),
  workingHours: optionalStringSchema,
  price: optionalStringSchema,
});

export const placesDataSchema = z.array(placeDataSchema);

export const categoryDataSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  names: multilingualTextSchema,
  icon: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});

export const categoriesDataSchema = z.array(categoryDataSchema);

export const guideDataSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  availableCities: z.array(z.string().trim().min(1)),
  languages: z.array(z.string().trim().min(1)),
  specialties: z.array(z.string().trim().min(1)),
  shortBio: z.string().trim().min(1),
  contactLabel: z.string().trim().min(1),
  contactHref: z.string().trim().min(1),
  contactMethod: z.enum(["phone", "telegram", "email"]),
  image: z.string().trim().min(1),
});

export const guidesDataSchema = z.array(guideDataSchema);

const serviceMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

export const serviceSectionDataSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  title: localizedTextDataSchema,
  shortDescription: optionalLocalizedTextDataSchema,
  description: optionalLocalizedTextDataSchema,
  image: z.string().trim().min(1),
  icon: optionalStringSchema,
  order: z.number().int().nonnegative(),
  isActive: z.boolean(),
  type: z.enum(["discovery", "utility"]),
});

export const serviceSectionsDataSchema = z.array(serviceSectionDataSchema);

export const serviceItemDataSchema = z.object({
  id: z.string().trim().min(1),
  sectionSlug: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  title: localizedTextDataSchema,
  shortDescription: optionalLocalizedTextDataSchema,
  description: optionalLocalizedTextDataSchema,
  image: optionalStringSchema,
  gallery: z.array(z.string().trim().min(1)).default([]),
  address: optionalStringSchema,
  city: optionalStringSchema,
  phoneNumbers: z.array(z.string().trim().min(1)).default([]),
  workingHours: optionalStringSchema,
  district: optionalStringSchema,
  mapLink: optionalStringSchema,
  emergencyNote: optionalStringSchema,
  serviceType: optionalStringSchema,
  coordinates: z.preprocess((value) => value === null ? undefined : value, coordinatesSchema.optional()),
  tags: z.array(z.string().trim().min(1)).default([]),
  featured: z.boolean().default(false),
  isActive: z.boolean(),
  metadata: z.record(z.string(), serviceMetadataValueSchema).default({}),
});

export const servicesDataSchema = z.array(serviceItemDataSchema);

export const authUserDataSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  passwordHash: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
});

export const authUsersDataSchema = z.array(authUserDataSchema);

export const authSessionDataSchema = z.object({
  id: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  token: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  expiresAt: z.string().trim().min(1),
});

export const authSessionsDataSchema = z.array(authSessionDataSchema);

export const eventDataSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  city: z.string().trim().min(1),
  region: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  dateLabel: z.string().trim().min(1),
  season: z.string().trim().min(1),
  venue: z.string().trim().min(1),
  category: z.string().trim().min(1),
  image: z.string().trim().min(1),
  featured: z.boolean(),
});

export const eventsDataSchema = z.array(eventDataSchema);

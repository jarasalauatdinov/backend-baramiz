import { z } from "zod";
import {
  booleanQuerySchema,
  idParamSchema,
  languageSchema,
  optionalMultilingualTextInputSchema,
  optionalQueryStringSchema,
  multilingualTextInputSchema,
} from "./common.schema";
import { coordinatesSchema } from "./tourism-data.schema";

const trimString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const optionalTrimmedStringSchema = z.preprocess(trimString, z.string().min(1).optional());
const optionalStringArraySchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value;
}, z.array(z.string().trim().min(1)).optional());

const serviceSectionTypeSchema = z.enum(["discovery", "utility"]);
const serviceMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

export const serviceSectionsQuerySchema = z.object({
  type: serviceSectionTypeSchema.optional(),
  language: languageSchema.optional(),
});

export const serviceItemsQuerySchema = z.object({
  city: optionalQueryStringSchema,
  featured: booleanQuerySchema,
  search: optionalQueryStringSchema,
  language: languageSchema.optional(),
});

export const serviceSectionDetailQuerySchema = z.object({
  language: languageSchema.optional(),
});

export const serviceItemDetailQuerySchema = z.object({
  language: languageSchema.optional(),
});

export const serviceSectionSlugParamsSchema = z.object({
  slug: z.preprocess(trimString, z.string().min(1, "slug is required")),
});

export const serviceSectionItemParamsSchema = z.object({
  slug: z.preprocess(trimString, z.string().min(1, "slug is required")),
  itemSlug: z.preprocess(trimString, z.string().min(1, "itemSlug is required")),
});

export const adminServiceSectionBodySchema = z.object({
  slug: optionalTrimmedStringSchema,
  title: multilingualTextInputSchema,
  shortDescription: optionalMultilingualTextInputSchema,
  description: optionalMultilingualTextInputSchema,
  image: z.preprocess(trimString, z.string().min(1, "image is required")),
  icon: optionalTrimmedStringSchema,
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
  type: serviceSectionTypeSchema,
});

export const adminServiceItemBodySchema = z.object({
  sectionSlug: optionalTrimmedStringSchema,
  slug: optionalTrimmedStringSchema,
  title: multilingualTextInputSchema,
  shortDescription: optionalMultilingualTextInputSchema,
  description: optionalMultilingualTextInputSchema,
  image: optionalTrimmedStringSchema,
  gallery: optionalStringArraySchema,
  address: optionalTrimmedStringSchema,
  city: optionalTrimmedStringSchema,
  phoneNumbers: optionalStringArraySchema,
  workingHours: optionalTrimmedStringSchema,
  district: optionalTrimmedStringSchema,
  mapLink: optionalTrimmedStringSchema,
  emergencyNote: optionalTrimmedStringSchema,
  serviceType: optionalTrimmedStringSchema,
  coordinates: z.preprocess((value) => value === null ? undefined : value, coordinatesSchema.optional()),
  tags: optionalStringArraySchema,
  featured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.string(), serviceMetadataValueSchema).optional(),
});

export const adminServiceSectionIdParamsSchema = idParamSchema;
export const adminServiceItemIdParamsSchema = idParamSchema;
export const adminServiceSectionSlugParamsSchema = serviceSectionSlugParamsSchema;

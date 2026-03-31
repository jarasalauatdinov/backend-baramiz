import { z } from "zod";
import { CATEGORY_IDS, LANGUAGE_CODES } from "../constants/tourism.constants";

const trimString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export const languageSchema = z.enum(LANGUAGE_CODES);
export const categoryIdSchema = z.enum(CATEGORY_IDS);

export const idParamSchema = z.object({
  id: z.preprocess(trimString, z.string().min(1, "id is required")),
});

export const optionalQueryStringSchema = z.preprocess(trimString, z.string().min(1).optional());

export const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return value;
}, z.boolean().optional());

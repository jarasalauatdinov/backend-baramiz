import { z } from "zod";
import { RECOMMENDATION_PREFERENCE_IDS } from "../constants/tourism.constants";
import { languageSchema } from "./common.schema";

export const generateRouteBodySchema = z.object({
  city: z.string().trim().min(1, "city is required"),
  preferences: z.array(z.enum(RECOMMENDATION_PREFERENCE_IDS)).min(1, "preferences are required"),
  language: languageSchema.optional(),
});

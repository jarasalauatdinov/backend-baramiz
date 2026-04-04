import { z } from "zod";
import { DEFAULT_ROUTE_DURATION, ROUTE_DURATION_MINUTES } from "../constants/tourism.constants";
import { categoryIdSchema, languageSchema } from "./common.schema";

const routeDurationKeys = Object.keys(ROUTE_DURATION_MINUTES) as [
  keyof typeof ROUTE_DURATION_MINUTES,
  ...(keyof typeof ROUTE_DURATION_MINUTES)[],
];

export const generateRouteBodySchema = z.object({
  city: z.string().trim().min(1, "city is required"),
  duration: z.enum(routeDurationKeys).optional().default(DEFAULT_ROUTE_DURATION),
  interests: z.array(categoryIdSchema).min(1, "at least one interest is required"),
  language: languageSchema.optional(),
});

import { z } from "zod";
import { languageSchema } from "./common.schema";

export const getCategoriesQuerySchema = z.object({
  language: languageSchema.optional(),
});

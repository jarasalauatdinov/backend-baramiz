import path from "node:path";
import { categoriesDataSchema } from "../schemas/tourism-data.schema";
import type { Category, Language, PublicCategory } from "../types/tourism.types";
import { readJsonFile } from "../utils/json-storage";
import { localize } from "../utils/text-helpers";

const categoriesFilePath = path.join(process.cwd(), "src", "data", "categories.json");

let categoriesCache: Category[] | null = null;

const loadCategories = (): Category[] => {
  if (categoriesCache) {
    return categoriesCache;
  }

  categoriesCache = readJsonFile(categoriesFilePath, categoriesDataSchema, []);
  return categoriesCache;
};

export const getCategories = (language: Language = "en"): PublicCategory[] => {
  return loadCategories()
    .filter((category) => category.is_active && category.type === "interest")
    .sort((left, right) => left.sort_order - right.sort_order || left.slug.localeCompare(right.slug))
    .map((category) => ({
      ...category,
      name: localize(language, category.names),
    }));
};

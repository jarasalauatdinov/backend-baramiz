import path from "node:path";
import { guidesDataSchema } from "../schemas/tourism-data.schema";
import type { Guide } from "../types/tourism.types";
import { readJsonFile } from "../utils/json-storage";
import { resolvePublicAssetUrl } from "../utils/url-helpers";

const guidesFilePath = path.join(process.cwd(), "src", "data", "guides.json");

let guidesCache: Guide[] | null = null;

const loadGuides = (): Guide[] => {
  if (guidesCache) {
    return guidesCache;
  }

  guidesCache = readJsonFile(guidesFilePath, guidesDataSchema, []).map((guide) => ({
    ...guide,
    image: resolvePublicAssetUrl(guide.image),
  }));

  return guidesCache;
};

export const getGuides = (): Guide[] => {
  return loadGuides();
};

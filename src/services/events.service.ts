import path from "node:path";
import { eventsDataSchema } from "../schemas/tourism-data.schema";
import type { EventItem } from "../types/tourism.types";
import { readJsonFile } from "../utils/json-storage";
import { resolvePublicAssetUrl } from "../utils/url-helpers";

const eventsFilePath = path.join(process.cwd(), "src", "data", "events.json");

let eventsCache: EventItem[] | null = null;

const loadEvents = (): EventItem[] => {
  if (eventsCache) {
    return eventsCache;
  }

  eventsCache = readJsonFile(eventsFilePath, eventsDataSchema, []).map((event) => ({
    ...event,
    image: resolvePublicAssetUrl(event.image),
  }));

  return eventsCache;
};

export const getEvents = (): EventItem[] => {
  return loadEvents();
};

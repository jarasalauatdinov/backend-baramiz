import type { AssistantCatalogSnapshot, Language, PublicServiceItem } from "../types/tourism.types";
import { normalizeText } from "../utils/text-helpers";
import { getAllPlaces, getFeaturedPlaces } from "./places.service";
import { getServices } from "./services.service";
import { getFeaturedTours } from "./tours.service";

const BOOKING_READY_SECTION_SLUGS = new Set(["hotels", "restaurants", "taxi", "services"]);
const ASSISTANT_PRIORITY_SECTION_ORDER = ["pharmacies", "hospitals", "atms", "taxi", "hotels", "restaurants", "services"];

const hasPracticalContact = (item: PublicServiceItem): boolean => {
  return item.phoneNumbers.length > 0
    || Boolean(item.telegram)
    || Boolean(item.website)
    || Boolean(item.mapLink);
};

const getSectionPriority = (sectionSlug: string): number => {
  const priorityIndex = ASSISTANT_PRIORITY_SECTION_ORDER.indexOf(sectionSlug);
  return priorityIndex === -1 ? ASSISTANT_PRIORITY_SECTION_ORDER.length : priorityIndex;
};

export const getBookingReadyServiceItems = (language: Language = "en", limit = 6): PublicServiceItem[] => {
  return getServices({ language })
    .filter((item) => BOOKING_READY_SECTION_SLUGS.has(item.sectionSlug))
    .filter(hasPracticalContact)
    .slice(0, limit);
};

export const getAssistantServiceHighlights = (language: Language = "en", limit = 8): PublicServiceItem[] => {
  return [...getServices({ language })]
    .filter((item) => item.featured || hasPracticalContact(item) || getSectionPriority(item.sectionSlug) < ASSISTANT_PRIORITY_SECTION_ORDER.length)
    .sort((left, right) => {
      const leftPriority = getSectionPriority(left.sectionSlug);
      const rightPriority = getSectionPriority(right.sectionSlug);

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      if (left.featured !== right.featured) {
        return Number(right.featured) - Number(left.featured);
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
};

export const getAssistantCatalogSnapshot = (language: Language = "en"): AssistantCatalogSnapshot => {
  const featuredPlaces = getFeaturedPlaces(6, language);
  const services = getAssistantServiceHighlights(language);
  const tours = getFeaturedTours(language);

  return {
    places: getAllPlaces(language),
    featuredPlaces,
    services,
    tours,
  };
};

export const hasCityBookingSupport = (city: string, language: Language = "en"): boolean => {
  return getBookingReadyServiceItems(language, 20).some((item) => {
    return normalizeText(item.city ?? "") === normalizeText(city);
  });
};

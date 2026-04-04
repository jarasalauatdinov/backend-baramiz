import path from "node:path";
import { serviceSectionsDataSchema, servicesDataSchema } from "../schemas/tourism-data.schema";
import type {
  AdminServiceItemInput,
  AdminServiceSectionInput,
  Coordinates,
  Language,
  PublicServiceItem,
  PublicServiceSection,
  ServiceItem,
  ServiceSection,
  ServiceSectionCard,
  ServiceSectionType,
} from "../types/tourism.types";
import { AppError } from "../utils/app-error";
import { readJsonFile, writeJsonFile } from "../utils/json-storage";
import { calculateDistanceKm } from "../utils/route-helpers";
import {
  getConsistentMultilingualLanguage,
  localizeOptionalMultilingualText,
  localizeMultilingualText,
  normalizeMultilingualTextInput,
  normalizeText,
  slugify,
} from "../utils/text-helpers";
import { resolvePublicAssetUrl } from "../utils/url-helpers";

const serviceSectionsFilePath = path.join(process.cwd(), "src", "data", "service-sections.json");
const serviceItemsFilePath = path.join(process.cwd(), "src", "data", "service-items.json");

interface ServiceItemFilters {
  city?: string;
  featured?: boolean;
  search?: string;
  coordinates?: Coordinates;
  radiusKm?: number;
  language?: Language;
}

let serviceSectionsCache: ServiceSection[] | null = null;
let serviceItemsCache: ServiceItem[] | null = null;

const getDefaultSectionImagePath = (slugValue: string): string => `/assets/service/sections/${slugValue}.svg`;
const isPlaceholderImageUrl = (value: string | undefined): boolean => {
  return Boolean(value && /^https?:\/\/placehold\.co\//i.test(value.trim()));
};
const uniqueNonEmptyStrings = (values: Array<string | undefined>): string[] => {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
};
const normalizeOptionalString = (value: string | undefined): string | undefined => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
};

const sortSections = (sections: ServiceSection[]): ServiceSection[] => {
  return [...sections].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.title.en.localeCompare(right.title.en);
  });
};

const sortItems = (items: ServiceItem[]): ServiceItem[] => {
  return [...items].sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured);
    }

    return left.title.en.localeCompare(right.title.en);
  });
};

const roundDistanceKm = (value: number): number => {
  return Math.round(value * 10) / 10;
};

const formatDistanceText = (distanceKm: number): string => {
  return `${distanceKm.toFixed(1)} km`;
};

const normalizeServiceSection = (section: ServiceSection): ServiceSection => {
  const fallbackTitle = normalizeMultilingualTextInput(section.title);

  if (!fallbackTitle) {
    throw new AppError(500, `Service section "${section.id}" is missing title translations`);
  }

  const slugValue = slugify(section.slug || fallbackTitle.en);

  return {
    ...section,
    slug: slugValue,
    title: fallbackTitle,
    shortDescription: normalizeMultilingualTextInput(section.shortDescription),
    description: normalizeMultilingualTextInput(section.description),
    image: section.image?.trim() || getDefaultSectionImagePath(slugValue),
  };
};

const normalizeServiceItem = (item: ServiceItem): ServiceItem => {
  const fallbackTitle = normalizeMultilingualTextInput(item.title);

  if (!fallbackTitle) {
    throw new AppError(500, `Service item "${item.id}" is missing title translations`);
  }

  const normalizedSectionSlug = slugify(item.sectionSlug);
  const normalizedImage = !item.image || isPlaceholderImageUrl(item.image)
    ? getDefaultSectionImagePath(normalizedSectionSlug)
    : item.image.trim();
  const normalizedGallery = uniqueNonEmptyStrings(item.gallery);
  const normalizedPhoneNumbers = uniqueNonEmptyStrings(item.phoneNumbers);
  const normalizedTags = uniqueNonEmptyStrings(item.tags);

  return {
    ...item,
    sectionSlug: normalizedSectionSlug,
    slug: slugify(item.slug || fallbackTitle.en),
    title: fallbackTitle,
    shortDescription: normalizeMultilingualTextInput(item.shortDescription),
    description: normalizeMultilingualTextInput(item.description),
    image: normalizedImage,
    gallery: normalizedGallery.length > 0 ? normalizedGallery : [normalizedImage],
    phoneNumbers: normalizedPhoneNumbers,
    address: normalizeOptionalString(item.address),
    city: normalizeOptionalString(item.city),
    workingHours: normalizeOptionalString(item.workingHours),
    district: normalizeOptionalString(item.district),
    mapLink: normalizeOptionalString(item.mapLink),
    instagram: normalizeOptionalString(item.instagram),
    telegram: normalizeOptionalString(item.telegram),
    website: normalizeOptionalString(item.website),
    emergencyNote: normalizeOptionalString(item.emergencyNote),
    serviceType: normalizeOptionalString(item.serviceType),
    tags: normalizedTags,
    featured: item.featured ?? false,
    metadata: item.metadata ?? {},
  };
};

const mapServiceSectionForClient = (section: ServiceSection): ServiceSection => ({
  ...section,
  image: resolvePublicAssetUrl(section.image),
});

const mapServiceSectionCardForClient = (section: ServiceSection): ServiceSectionCard => ({
  id: section.id,
  slug: section.slug,
  title: section.title.en,
  image: resolvePublicAssetUrl(section.image),
  order: section.order,
  isActive: section.isActive,
  shortDescription: section.shortDescription?.en,
  description: section.description?.en,
  icon: section.icon,
  type: section.type,
});

const mapServiceSectionCardForClientLanguage = (
  section: ServiceSection,
  language: Language,
): ServiceSectionCard => ({
  ...mapServiceSectionCardForClient(section),
  title: localizeMultilingualText(section.title, language) ?? section.title.en,
  shortDescription: localizeOptionalMultilingualText(section.shortDescription, language),
  description: localizeOptionalMultilingualText(section.description, language),
});

const mapServiceSectionForPublic = (
  section: ServiceSection,
  language: Language,
): PublicServiceSection => mapServiceSectionCardForClientLanguage(section, language);

const mapServiceItemForClient = (item: ServiceItem): ServiceItem => ({
  ...item,
  image: item.image ? resolvePublicAssetUrl(item.image) : undefined,
  gallery: item.gallery.map(resolvePublicAssetUrl),
});

const mapServiceItemForPublic = (
  item: ServiceItem,
  language: Language,
  distanceKm?: number,
): PublicServiceItem => {
  const contentLanguage = getConsistentMultilingualLanguage(language, [
    item.title,
    item.shortDescription,
    item.description,
  ]);

  return {
    id: item.id,
    sectionSlug: item.sectionSlug,
    slug: item.slug,
    title: localizeMultilingualText(item.title, contentLanguage) ?? item.title.en,
    shortDescription: localizeMultilingualText(item.shortDescription, contentLanguage),
    description: localizeMultilingualText(item.description, contentLanguage),
    image: item.image ? resolvePublicAssetUrl(item.image) : undefined,
    gallery: item.gallery.map(resolvePublicAssetUrl),
    address: item.address,
    city: item.city,
    phoneNumbers: item.phoneNumbers,
    workingHours: item.workingHours,
    district: item.district,
    mapLink: item.mapLink,
    instagram: item.instagram,
    telegram: item.telegram,
    website: item.website,
    distanceKm,
    distanceText: distanceKm === undefined ? undefined : formatDistanceText(distanceKm),
    emergencyNote: item.emergencyNote,
    serviceType: item.serviceType,
    coordinates: item.coordinates,
    tags: item.tags,
    featured: item.featured,
    isActive: item.isActive,
    metadata: item.metadata,
  };
};

const loadServiceSections = (): ServiceSection[] => {
  if (serviceSectionsCache) {
    return serviceSectionsCache;
  }

  serviceSectionsCache = sortSections(
    readJsonFile(serviceSectionsFilePath, serviceSectionsDataSchema, []).map(normalizeServiceSection),
  );
  return serviceSectionsCache;
};

const saveServiceSections = (sections: ServiceSection[]): ServiceSection[] => {
  serviceSectionsCache = writeJsonFile(
    serviceSectionsFilePath,
    serviceSectionsDataSchema,
    sortSections(sections.map(normalizeServiceSection)),
  );
  return serviceSectionsCache;
};

const loadServiceItems = (): ServiceItem[] => {
  if (serviceItemsCache) {
    return serviceItemsCache;
  }

  serviceItemsCache = sortItems(
    readJsonFile(serviceItemsFilePath, servicesDataSchema, []).map(normalizeServiceItem),
  );
  return serviceItemsCache;
};

const saveServiceItems = (items: ServiceItem[]): ServiceItem[] => {
  serviceItemsCache = writeJsonFile(
    serviceItemsFilePath,
    servicesDataSchema,
    sortItems(items.map(normalizeServiceItem)),
  );
  return serviceItemsCache;
};

const getNextSectionOrder = (): number => {
  return loadServiceSections().reduce((maxOrder, section) => Math.max(maxOrder, section.order), 0) + 1;
};

const createUniqueSectionId = (slugValue: string): string => {
  const baseId = `service-section-${slugValue}`;
  const sections = loadServiceSections();
  let nextId = baseId;
  let suffix = 2;

  while (sections.some((section) => section.id === nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return nextId;
};

const createUniqueItemId = (sectionSlug: string, itemSlug: string): string => {
  const baseId = `service-item-${sectionSlug}-${itemSlug}`;
  const items = loadServiceItems();
  let nextId = baseId;
  let suffix = 2;

  while (items.some((item) => item.id === nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return nextId;
};

const ensureSectionExistsBySlug = (slugValue: string): ServiceSection => {
  const section = loadServiceSections().find((item) => item.slug === slugValue);

  if (!section) {
    throw new AppError(404, `Service section "${slugValue}" not found`);
  }

  return section;
};

const ensureUniqueSectionSlug = (slugValue: string, currentId?: string): void => {
  const duplicateSection = loadServiceSections().find((section) => {
    return section.slug === slugValue && section.id !== currentId;
  });

  if (duplicateSection) {
    throw new AppError(409, `Service section slug "${slugValue}" already exists`);
  }
};

const ensureUniqueItemSlug = (sectionSlug: string, itemSlug: string, currentId?: string): void => {
  const duplicateItem = loadServiceItems().find((item) => {
    return item.sectionSlug === sectionSlug && item.slug === itemSlug && item.id !== currentId;
  });

  if (duplicateItem) {
    throw new AppError(409, `Service item slug "${itemSlug}" already exists in section "${sectionSlug}"`);
  }
};

const matchesServiceItemFilters = (item: ServiceItem, filters: ServiceItemFilters): boolean => {
  if (filters.featured !== undefined && item.featured !== filters.featured) {
    return false;
  }

  if (filters.city && normalizeText(item.city ?? "") !== normalizeText(filters.city)) {
    return false;
  }

  if (filters.search) {
    const normalizedSearch = normalizeText(filters.search);
    const searchableText = [
      ...Object.values(item.title),
      ...(item.shortDescription ? Object.values(item.shortDescription) : []),
      ...(item.description ? Object.values(item.description) : []),
      item.address,
      item.city,
      item.district,
      item.serviceType,
      ...item.tags,
      ...item.phoneNumbers,
    ]
      .filter(Boolean)
      .map((value) => normalizeText(value as string))
      .join(" ");

    if (!searchableText.includes(normalizedSearch)) {
      return false;
    }
  }

  return true;
};

const getDistanceKm = (item: ServiceItem, coordinates: Coordinates | undefined): number | undefined => {
  if (!coordinates || !item.coordinates) {
    return undefined;
  }

  return calculateDistanceKm(coordinates, item.coordinates);
};

const applyNearbySortingAndFiltering = (
  items: ServiceItem[],
  filters: ServiceItemFilters,
): Array<{ item: ServiceItem; distanceKm?: number }> => {
  const withDistances = items.map((item) => ({
    item,
    distanceKm: getDistanceKm(item, filters.coordinates),
  }));

  const withinRadius = withDistances.filter((candidate) => {
    if (filters.radiusKm === undefined) {
      return true;
    }

    return candidate.distanceKm !== undefined && candidate.distanceKm <= filters.radiusKm;
  });

  if (!filters.coordinates) {
    return sortItems(withinRadius.map((candidate) => candidate.item)).map((item) => ({
      item,
      distanceKm: undefined,
    }));
  }

  return [...withinRadius].sort((left, right) => {
    if (left.distanceKm !== undefined && right.distanceKm !== undefined && left.distanceKm !== right.distanceKm) {
      return left.distanceKm - right.distanceKm;
    }

    if (left.distanceKm !== undefined && right.distanceKm === undefined) {
      return -1;
    }

    if (left.distanceKm === undefined && right.distanceKm !== undefined) {
      return 1;
    }

    if (left.item.featured !== right.item.featured) {
      return Number(right.item.featured) - Number(left.item.featured);
    }

    return left.item.title.en.localeCompare(right.item.title.en);
  });
};

const buildServiceSectionFromInput = (
  input: AdminServiceSectionInput,
  existingSection?: ServiceSection,
): ServiceSection => {
  const normalizedTitle = normalizeMultilingualTextInput(input.title);

  if (!normalizedTitle) {
    throw new AppError(400, "title is required");
  }

  const slugValue = slugify(input.slug ?? normalizedTitle.en);

  ensureUniqueSectionSlug(slugValue, existingSection?.id);

  return normalizeServiceSection({
    id: existingSection?.id ?? createUniqueSectionId(slugValue),
    slug: slugValue,
    title: normalizedTitle,
    shortDescription: input.shortDescription === undefined
      ? existingSection?.shortDescription
      : normalizeMultilingualTextInput(input.shortDescription, existingSection?.shortDescription?.en),
    description: input.description === undefined
      ? existingSection?.description
      : normalizeMultilingualTextInput(input.description, existingSection?.description?.en),
    image: input.image.trim(),
    icon: input.icon?.trim(),
    order: input.order ?? existingSection?.order ?? getNextSectionOrder(),
    isActive: input.isActive ?? existingSection?.isActive ?? true,
    type: input.type,
  });
};

const buildServiceItemFromInput = (
  input: AdminServiceItemInput,
  defaultSectionSlug: string,
  existingItem?: ServiceItem,
): ServiceItem => {
  const sectionSlug = slugify(input.sectionSlug ?? existingItem?.sectionSlug ?? defaultSectionSlug);
  const normalizedTitle = normalizeMultilingualTextInput(input.title);

  if (!normalizedTitle) {
    throw new AppError(400, "title is required");
  }

  const slugValue = slugify(input.slug ?? normalizedTitle.en);
  const section = ensureSectionExistsBySlug(sectionSlug);

  ensureUniqueItemSlug(section.slug, slugValue, existingItem?.id);

  return normalizeServiceItem({
    id: existingItem?.id ?? createUniqueItemId(section.slug, slugValue),
    sectionSlug: section.slug,
    slug: slugValue,
    title: normalizedTitle,
    shortDescription: input.shortDescription === undefined
      ? existingItem?.shortDescription
      : normalizeMultilingualTextInput(input.shortDescription, existingItem?.shortDescription?.en),
    description: input.description === undefined
      ? existingItem?.description
      : normalizeMultilingualTextInput(input.description, existingItem?.description?.en),
    image: input.image?.trim(),
    gallery: input.gallery?.map((item) => item.trim()).filter(Boolean) ?? existingItem?.gallery ?? [],
    address: input.address?.trim(),
    city: input.city?.trim(),
    phoneNumbers: input.phoneNumbers?.map((item) => item.trim()).filter(Boolean) ?? existingItem?.phoneNumbers ?? [],
    workingHours: input.workingHours?.trim(),
    district: input.district?.trim(),
    mapLink: input.mapLink?.trim(),
    instagram: input.instagram?.trim(),
    telegram: input.telegram?.trim(),
    website: input.website?.trim(),
    emergencyNote: input.emergencyNote?.trim(),
    serviceType: input.serviceType?.trim(),
    coordinates: input.coordinates,
    tags: input.tags?.map((item) => item.trim()).filter(Boolean) ?? existingItem?.tags ?? [],
    featured: input.featured ?? existingItem?.featured ?? false,
    isActive: input.isActive ?? existingItem?.isActive ?? true,
    metadata: input.metadata ?? existingItem?.metadata ?? {},
  });
};

export const getServiceSections = (type?: ServiceSectionType, language: Language = "en"): ServiceSectionCard[] => {
  return loadServiceSections()
    .filter((section) => section.isActive)
    .filter((section) => (type ? section.type === type : true))
    .map((section) => mapServiceSectionCardForClientLanguage(section, language));
};

export const getServiceSectionBySlug = (slugValue: string, language: Language = "en"): PublicServiceSection | undefined => {
  const section = loadServiceSections()
    .filter((currentSection) => currentSection.isActive)
    .find((currentSection) => currentSection.slug === slugify(slugValue));

  return section ? mapServiceSectionForPublic(section, language) : undefined;
};

export const getServiceItemsBySection = (
  sectionSlug: string,
  filters: ServiceItemFilters = {},
): PublicServiceItem[] => {
  const normalizedSectionSlug = slugify(sectionSlug);
  const section = loadServiceSections().find((item) => item.slug === normalizedSectionSlug && item.isActive);

  if (!section) {
    throw new AppError(404, `Service section "${sectionSlug}" not found`);
  }

  return applyNearbySortingAndFiltering(
    loadServiceItems()
      .filter((item) => item.isActive)
      .filter((item) => item.sectionSlug === normalizedSectionSlug)
      .filter((item) => matchesServiceItemFilters(item, filters)),
    filters,
  ).map((candidate) => {
    return mapServiceItemForPublic(
      candidate.item,
      filters.language ?? "en",
      candidate.distanceKm === undefined ? undefined : roundDistanceKm(candidate.distanceKm),
    );
  });
};

export const getServiceItemBySectionAndSlug = (
  sectionSlug: string,
  itemSlug: string,
  language: Language = "en",
): PublicServiceItem | undefined => {
  const normalizedSectionSlug = slugify(sectionSlug);
  const normalizedItemSlug = slugify(itemSlug);
  const section = loadServiceSections().find((item) => item.slug === normalizedSectionSlug && item.isActive);

  if (!section) {
    return undefined;
  }

  const item = loadServiceItems().find((currentItem) => {
    return currentItem.isActive
      && currentItem.sectionSlug === normalizedSectionSlug
      && currentItem.slug === normalizedItemSlug;
  });

  return item ? mapServiceItemForPublic(item, language) : undefined;
};

export const getServices = (filters: ServiceItemFilters = {}): PublicServiceItem[] => {
  return applyNearbySortingAndFiltering(
    loadServiceItems()
      .filter((item) => item.isActive)
      .filter((item) => {
        const section = loadServiceSections().find((currentSection) => currentSection.slug === item.sectionSlug);
        return Boolean(section?.isActive);
      })
      .filter((item) => matchesServiceItemFilters(item, filters)),
    filters,
  ).map((candidate) => {
    return mapServiceItemForPublic(
      candidate.item,
      filters.language ?? "en",
      candidate.distanceKm === undefined ? undefined : roundDistanceKm(candidate.distanceKm),
    );
  });
};

export const getAdminServiceSections = (): ServiceSection[] => {
  return loadServiceSections().map(mapServiceSectionForClient);
};

export const createServiceSection = (input: AdminServiceSectionInput): ServiceSection => {
  const nextSection = buildServiceSectionFromInput(input);
  saveServiceSections([...loadServiceSections(), nextSection]);
  return mapServiceSectionForClient(nextSection);
};

export const updateServiceSection = (id: string, input: AdminServiceSectionInput): ServiceSection => {
  const sections = loadServiceSections();
  const sectionIndex = sections.findIndex((section) => section.id === id);

  if (sectionIndex === -1) {
    throw new AppError(404, "Service section not found");
  }

  const nextSection = buildServiceSectionFromInput(input, sections[sectionIndex]);
  const nextSections = [...sections];
  nextSections[sectionIndex] = nextSection;
  saveServiceSections(nextSections);
  return mapServiceSectionForClient(nextSection);
};

export const deleteServiceSection = (id: string): void => {
  const sections = loadServiceSections();
  const section = sections.find((currentSection) => currentSection.id === id);

  if (!section) {
    throw new AppError(404, "Service section not found");
  }

  saveServiceSections(sections.filter((currentSection) => currentSection.id !== id));
  saveServiceItems(loadServiceItems().filter((item) => item.sectionSlug !== section.slug));
};

export const getAdminServiceItemsBySection = (sectionSlug: string): ServiceItem[] => {
  const normalizedSectionSlug = slugify(sectionSlug);
  ensureSectionExistsBySlug(normalizedSectionSlug);

  return sortItems(
    loadServiceItems().filter((item) => item.sectionSlug === normalizedSectionSlug),
  ).map(mapServiceItemForClient);
};

export const getAdminServiceItemById = (id: string): ServiceItem | undefined => {
  const item = loadServiceItems().find((currentItem) => currentItem.id === id);
  return item ? mapServiceItemForClient(item) : undefined;
};

export const createServiceItem = (sectionSlug: string, input: AdminServiceItemInput): ServiceItem => {
  const nextItem = buildServiceItemFromInput(input, sectionSlug);
  saveServiceItems([...loadServiceItems(), nextItem]);
  return mapServiceItemForClient(nextItem);
};

export const updateServiceItem = (id: string, input: AdminServiceItemInput): ServiceItem => {
  const items = loadServiceItems();
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    throw new AppError(404, "Service item not found");
  }

  const nextItem = buildServiceItemFromInput(input, items[itemIndex].sectionSlug, items[itemIndex]);
  const nextItems = [...items];
  nextItems[itemIndex] = nextItem;
  saveServiceItems(nextItems);
  return mapServiceItemForClient(nextItem);
};

export const deleteServiceItem = (id: string): void => {
  const items = loadServiceItems();
  const nextItems = items.filter((item) => item.id !== id);

  if (nextItems.length === items.length) {
    throw new AppError(404, "Service item not found");
  }

  saveServiceItems(nextItems);
};

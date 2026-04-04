import type { Request, Response } from "express";
import {
  adminServiceItemBodySchema,
  adminServiceItemIdParamsSchema,
  adminServiceSectionBodySchema,
  adminServiceSectionIdParamsSchema,
  adminServiceSectionSlugParamsSchema,
  serviceItemDetailQuerySchema,
  serviceItemsQuerySchema,
  serviceSectionDetailQuerySchema,
  serviceSectionItemParamsSchema,
  serviceSectionsQuerySchema,
  serviceSectionSlugParamsSchema,
} from "../schemas/service.schema";
import {
  createServiceItem,
  createServiceSection,
  deleteServiceItem,
  deleteServiceSection,
  getAdminServiceItemById,
  getAdminServiceItemsBySection,
  getAdminServiceSections,
  getServiceItemBySectionAndSlug,
  getServiceItemsBySection,
  getServiceSectionBySlug,
  getServiceSections,
  updateServiceItem,
  updateServiceSection,
} from "../services/services.service";
import { AppError } from "../utils/app-error";
import { resolveRequestLanguage } from "../utils/request-language";

export const listServiceSections = (request: Request, response: Response): void => {
  const query = serviceSectionsQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  response.json({ items: getServiceSections(query.type, language) });
};

export const getServiceSection = (request: Request, response: Response): void => {
  const params = serviceSectionSlugParamsSchema.parse(request.params);
  const query = serviceSectionDetailQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  const section = getServiceSectionBySlug(params.slug, language);

  if (!section) {
    throw new AppError(404, "Service section not found");
  }

  response.json({ item: section });
};

export const listServiceSectionItems = (request: Request, response: Response): void => {
  const params = serviceSectionSlugParamsSchema.parse(request.params);
  const query = serviceItemsQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  response.json({ items: getServiceItemsBySection(params.slug, { ...query, language }) });
};

export const getServiceSectionItem = (request: Request, response: Response): void => {
  const params = serviceSectionItemParamsSchema.parse(request.params);
  const query = serviceItemDetailQuerySchema.parse(request.query);
  const language = resolveRequestLanguage(request, query.language);
  const item = getServiceItemBySectionAndSlug(params.slug, params.itemSlug, language);

  if (!item) {
    throw new AppError(404, "Service item not found");
  }

  response.json({ item });
};

export const listAdminServiceSections = (_request: Request, response: Response): void => {
  response.json({ items: getAdminServiceSections() });
};

export const createAdminServiceSection = (request: Request, response: Response): void => {
  const body = adminServiceSectionBodySchema.parse(request.body);
  const item = createServiceSection(body);
  response.status(201).json({ item });
};

export const updateAdminServiceSection = (request: Request, response: Response): void => {
  const params = adminServiceSectionIdParamsSchema.parse(request.params);
  const body = adminServiceSectionBodySchema.parse(request.body);
  const item = updateServiceSection(params.id, body);
  response.json({ item });
};

export const deleteAdminServiceSection = (request: Request, response: Response): void => {
  const params = adminServiceSectionIdParamsSchema.parse(request.params);
  deleteServiceSection(params.id);
  response.json({ message: "Service section deleted" });
};

export const listAdminServiceItems = (request: Request, response: Response): void => {
  const params = adminServiceSectionSlugParamsSchema.parse(request.params);
  response.json({ items: getAdminServiceItemsBySection(params.slug) });
};

export const createAdminServiceItem = (request: Request, response: Response): void => {
  const params = adminServiceSectionSlugParamsSchema.parse(request.params);
  const body = adminServiceItemBodySchema.parse(request.body);
  const item = createServiceItem(params.slug, {
    ...body,
    sectionSlug: params.slug,
  });
  response.status(201).json({ item });
};

export const getAdminServiceItem = (request: Request, response: Response): void => {
  const params = adminServiceItemIdParamsSchema.parse(request.params);
  const item = getAdminServiceItemById(params.id);

  if (!item) {
    throw new AppError(404, "Service item not found");
  }

  response.json({ item });
};

export const updateAdminServiceItem = (request: Request, response: Response): void => {
  const params = adminServiceItemIdParamsSchema.parse(request.params);
  const body = adminServiceItemBodySchema.parse(request.body);
  const item = updateServiceItem(params.id, body);
  response.json({ item });
};

export const deleteAdminServiceItem = (request: Request, response: Response): void => {
  const params = adminServiceItemIdParamsSchema.parse(request.params);
  deleteServiceItem(params.id);
  response.json({ message: "Service item deleted" });
};

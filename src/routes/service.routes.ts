import { Router } from "express";
import {
  getServiceSection,
  getServiceSectionItem,
  listServiceSectionItems,
  listServiceSections,
} from "../controllers/service.controller";
import { asyncHandler } from "../utils/async-handler";

const serviceRouter = Router();

serviceRouter.get("/sections", asyncHandler(listServiceSections));
serviceRouter.get("/sections/:slug", asyncHandler(getServiceSection));
serviceRouter.get("/sections/:slug/items", asyncHandler(listServiceSectionItems));
serviceRouter.get("/sections/:slug/items/:itemSlug", asyncHandler(getServiceSectionItem));

export default serviceRouter;

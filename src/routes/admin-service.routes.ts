import { Router } from "express";
import {
  createAdminServiceItem,
  createAdminServiceSection,
  deleteAdminServiceItem,
  deleteAdminServiceSection,
  getAdminServiceItem,
  listAdminServiceItems,
  listAdminServiceSections,
  updateAdminServiceItem,
  updateAdminServiceSection,
} from "../controllers/service.controller";
import { asyncHandler } from "../utils/async-handler";

const adminServiceRouter = Router();

adminServiceRouter.get("/sections", asyncHandler(listAdminServiceSections));
adminServiceRouter.post("/sections", asyncHandler(createAdminServiceSection));
adminServiceRouter.put("/sections/:id", asyncHandler(updateAdminServiceSection));
adminServiceRouter.delete("/sections/:id", asyncHandler(deleteAdminServiceSection));

adminServiceRouter.get("/sections/:slug/items", asyncHandler(listAdminServiceItems));
adminServiceRouter.post("/sections/:slug/items", asyncHandler(createAdminServiceItem));

adminServiceRouter.get("/items/:id", asyncHandler(getAdminServiceItem));
adminServiceRouter.put("/items/:id", asyncHandler(updateAdminServiceItem));
adminServiceRouter.delete("/items/:id", asyncHandler(deleteAdminServiceItem));

export default adminServiceRouter;

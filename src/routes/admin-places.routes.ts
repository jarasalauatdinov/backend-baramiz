import { Router } from "express";
import {
  createAdminPlace,
  deleteAdminPlace,
  getAdminPlaceById,
  getAdminPlaces,
  updateAdminPlace,
} from "../controllers/admin-places.controller";
import { asyncHandler } from "../utils/async-handler";

const adminPlacesRouter = Router();

adminPlacesRouter.get("/", asyncHandler(getAdminPlaces));
adminPlacesRouter.get("/:id", asyncHandler(getAdminPlaceById));
adminPlacesRouter.post("/", asyncHandler(createAdminPlace));
adminPlacesRouter.put("/:id", asyncHandler(updateAdminPlace));
adminPlacesRouter.delete("/:id", asyncHandler(deleteAdminPlace));

export default adminPlacesRouter;

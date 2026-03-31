import { Router } from "express";
import { getPlaceById, getPlaces } from "../controllers/places.controller";
import { asyncHandler } from "../utils/async-handler";

const placesRouter = Router();

placesRouter.get("/", asyncHandler(getPlaces));
placesRouter.get("/:id", asyncHandler(getPlaceById));

export default placesRouter;

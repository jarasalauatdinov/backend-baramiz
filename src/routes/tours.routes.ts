import { Router } from "express";
import { getTour, listTours } from "../controllers/tours.controller";
import { asyncHandler } from "../utils/async-handler";

const toursRouter = Router();

toursRouter.get("/", asyncHandler(listTours));
toursRouter.get("/:id", asyncHandler(getTour));

export default toursRouter;

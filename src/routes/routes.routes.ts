import { Router } from "express";
import { generateRoute } from "../controllers/routes.controller";
import { asyncHandler } from "../utils/async-handler";

const routesRouter = Router();

routesRouter.post("/generate", asyncHandler(generateRoute));

export default routesRouter;

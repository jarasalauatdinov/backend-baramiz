import { Router } from "express";
import { generateRouteController } from "../controllers/routes.controller";
import { asyncHandler } from "../utils/async-handler";

const routesRouter = Router();

routesRouter.post("/generate", asyncHandler(generateRouteController));

export default routesRouter;

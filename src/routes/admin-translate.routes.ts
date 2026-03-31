import { Router } from "express";
import { translateAdminPlaceContent } from "../controllers/admin-translate.controller";
import { asyncHandler } from "../utils/async-handler";

const adminTranslateRouter = Router();

adminTranslateRouter.post("/", asyncHandler(translateAdminPlaceContent));

export default adminTranslateRouter;

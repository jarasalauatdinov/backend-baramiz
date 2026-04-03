import { Router } from "express";
import { listGuides } from "../controllers/guides.controller";

const guidesRouter = Router();

guidesRouter.get("/", listGuides);

export default guidesRouter;

import { Router } from "express";
import { listServices } from "../controllers/services.controller";

const servicesRouter = Router();

servicesRouter.get("/", listServices);

export default servicesRouter;

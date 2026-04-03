import { Router } from "express";
import { listEvents } from "../controllers/events.controller";

const eventsRouter = Router();

eventsRouter.get("/", listEvents);

export default eventsRouter;

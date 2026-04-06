import { Router } from "express";
import { assistantChat } from "../controllers/assistant.controller";
import { asyncHandler } from "../utils/async-handler";

const assistantRouter = Router();

assistantRouter.post("/chat", asyncHandler(assistantChat));

export default assistantRouter;

import { Router } from "express";
import { chat } from "../controllers/chat.controller";
import { asyncHandler } from "../utils/async-handler";

const chatRouter = Router();

chatRouter.post("/", asyncHandler(chat));

export default chatRouter;

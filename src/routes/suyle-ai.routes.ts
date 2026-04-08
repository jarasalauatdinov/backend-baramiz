import multer from "multer";
import { Router } from "express";
import {
  speechToTextController,
  textToSpeechController,
  translateLocalToTouristController,
  translateTouristToLocalController,
} from "../controllers/suyle-ai.controller";
import { asyncHandler } from "../utils/async-handler";

const upload = multer({
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

const suyleAIRouter = Router();

suyleAIRouter.post("/translate/tourist-to-local", asyncHandler(translateTouristToLocalController));
suyleAIRouter.post("/translate/local-to-tourist", asyncHandler(translateLocalToTouristController));
suyleAIRouter.post("/speech-to-text", upload.single("audio"), asyncHandler(speechToTextController));
suyleAIRouter.post("/text-to-speech", asyncHandler(textToSpeechController));

export default suyleAIRouter;

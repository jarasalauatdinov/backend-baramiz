import type { Request, Response } from "express";
import { AppError } from "../utils/app-error";
import {
  speechToTextBodySchema,
  textToSpeechBodySchema,
  translateLocalToTouristBodySchema,
  translateTouristToLocalBodySchema,
} from "../schemas/suyle-ai.schema";
import { speechToText } from "../services/suyle-ai/speech-to-text.service";
import { textToSpeech } from "../services/suyle-ai/text-to-speech.service";
import { translateLocalToTourist, translateTouristToLocal } from "../services/suyle-ai/translate.service";

export const translateTouristToLocalController = async (request: Request, response: Response): Promise<void> => {
  const body = translateTouristToLocalBodySchema.parse(request.body);
  const result = await translateTouristToLocal(body);

  response.json({
    providerTargetCode: result.providerTargetCode,
    targetLanguage: body.targetLocalScript,
    translatedText: result.translatedText,
  });
};

export const translateLocalToTouristController = async (request: Request, response: Response): Promise<void> => {
  const body = translateLocalToTouristBodySchema.parse(request.body);
  const result = await translateLocalToTourist(body);

  response.json({
    providerTargetCode: result.providerTargetCode,
    targetLanguage: body.targetLanguage,
    translatedText: result.translatedText,
  });
};

export const speechToTextController = async (request: Request, response: Response): Promise<void> => {
  const body = speechToTextBodySchema.parse(request.body);
  const file = request.file;

  if (!file) {
    throw new AppError(400, "Audio file is required.", "MISSING_AUDIO_FILE");
  }

  const result = await speechToText({
    audioBuffer: file.buffer,
    fileName: file.originalname || "suyle-ai-recording.webm",
    languageHint: body.languageHint,
    mimeType: file.mimetype,
  });

  response.json(result);
};

export const textToSpeechController = async (request: Request, response: Response): Promise<void> => {
  const body = textToSpeechBodySchema.parse(request.body);
  const result = await textToSpeech(body);

  response.setHeader("Content-Type", result.mimeType);
  response.setHeader("Content-Disposition", `inline; filename="${result.fileName}"`);
  response.send(result.audioBuffer);
};

import type { Request, Response } from "express";
import { chatBodySchema } from "../schemas/chat.schema";
import { chatService } from "../services/chat.service";

export const chat = async (request: Request, response: Response): Promise<void> => {
  const body = chatBodySchema.parse(request.body);
  const reply = await chatService.reply(body);
  response.json(reply);
};

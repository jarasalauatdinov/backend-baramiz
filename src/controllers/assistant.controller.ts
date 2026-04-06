import type { Request, Response } from "express";
import { chatBodySchema } from "../schemas/chat.schema";
import { replyToChat } from "../services/chat.service";

export const assistantChat = async (request: Request, response: Response): Promise<void> => {
  const body = chatBodySchema.parse(request.body);
  const item = await replyToChat(body);
  response.json({ item });
};

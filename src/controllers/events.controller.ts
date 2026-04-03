import type { Request, Response } from "express";
import { getEvents } from "../services/events.service";

export const listEvents = (_request: Request, response: Response): void => {
  response.json({ items: getEvents() });
};

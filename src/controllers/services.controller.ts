import type { Request, Response } from "express";
import { serviceItemsQuerySchema } from "../schemas/service.schema";
import { getServices } from "../services/services.service";

export const listServices = (request: Request, response: Response): void => {
  const query = serviceItemsQuerySchema.parse(request.query);
  response.json({ items: getServices(query) });
};

import type { Request, Response } from "express";
import { generateRouteBodySchema } from "../schemas/routes.schema";
import { routeGeneratorService } from "../services/route-generator.service";

export const generateRoute = (request: Request, response: Response): void => {
  const body = generateRouteBodySchema.parse(request.body);
  response.json(routeGeneratorService.generateRoute(body));
};

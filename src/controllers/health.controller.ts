import type { Request, Response } from "express";

export const getHealth = (_request: Request, response: Response): void => {
  response.json({ item: { status: "ok" } });
};

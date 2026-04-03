import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";

const cloneJsonValue = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const stripByteOrderMark = (value: string): string => value.replace(/^\uFEFF/, "");

const ensureJsonFile = <T>(filePath: string, fallbackValue: T): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${JSON.stringify(fallbackValue, null, 2)}\n`, "utf8");
  }
};

export const readJsonFile = <T>(filePath: string, schema: z.ZodType<T>, fallbackValue: T): T => {
  ensureJsonFile(filePath, fallbackValue);

  try {
    const rawContent = stripByteOrderMark(fs.readFileSync(filePath, "utf8"));
    const parsedContent = JSON.parse(rawContent) as unknown;
    return schema.parse(parsedContent);
  } catch (error) {
    console.warn(`Resetting invalid JSON storage at ${filePath}`, error);
    const fallbackCopy = cloneJsonValue(fallbackValue);
    fs.writeFileSync(filePath, `${JSON.stringify(fallbackCopy, null, 2)}\n`, "utf8");
    return fallbackCopy;
  }
};

export const writeJsonFile = <T>(filePath: string, schema: z.ZodType<T>, value: T): T => {
  const validatedValue = schema.parse(value);
  ensureJsonFile(filePath, validatedValue);
  fs.writeFileSync(filePath, `${JSON.stringify(validatedValue, null, 2)}\n`, "utf8");
  return validatedValue;
};

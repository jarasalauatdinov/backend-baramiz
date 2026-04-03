import { env } from "../config/env";

export const resolvePublicAssetUrl = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return trimmedValue;
  }

  if (
    /^https?:\/\//i.test(trimmedValue)
    || /^data:/i.test(trimmedValue)
    || /^blob:/i.test(trimmedValue)
    || /^\/\//.test(trimmedValue)
  ) {
    return trimmedValue;
  }

  const publicBaseUrl = env.PUBLIC_BASE_URL
    || (env.NODE_ENV !== "production" ? `http://localhost:${env.PORT}` : undefined);

  if (trimmedValue.startsWith("/")) {
    return publicBaseUrl ? `${publicBaseUrl}${trimmedValue}` : trimmedValue;
  }

  if (trimmedValue.startsWith("assets/")) {
    return publicBaseUrl ? `${publicBaseUrl}/${trimmedValue}` : `/${trimmedValue}`;
  }

  if (trimmedValue.startsWith("./assets/")) {
    const normalizedAssetPath = trimmedValue.slice(2);
    return publicBaseUrl ? `${publicBaseUrl}/${normalizedAssetPath}` : `/${normalizedAssetPath}`;
  }

  return trimmedValue;
};

import type { Language, LocalizedValue } from "../types/tourism.types";

export const createLocalizedValue = (
  value: string,
  overrides: Partial<Record<Language, string>> = {},
): LocalizedValue<string> => ({
  en: overrides.en ?? value,
  uz: overrides.uz ?? value,
  ru: overrides.ru ?? value,
  kaa: overrides.kaa ?? overrides.uz ?? value,
});

export const createLocalizedList = (
  values: string[],
  overrides: Partial<Record<Language, string[]>> = {},
): LocalizedValue<string[]> => ({
  en: overrides.en ?? values,
  uz: overrides.uz ?? values,
  ru: overrides.ru ?? values,
  kaa: overrides.kaa ?? overrides.uz ?? values,
});

export const createGuidePortrait = (name: string, accent: string, tone: string): string => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 960">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff8ea" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="800" height="960" fill="url(#bg)"/>
      <circle cx="400" cy="308" r="126" fill="${tone}"/>
      <path d="M198 826c18-168 118-254 202-254s184 86 202 254" fill="#1f3f31" opacity="0.94"/>
      <path d="M312 212c24-68 150-92 216 10 16 24 24 54 24 84-18-30-56-48-110-48-56 0-96 16-130 46-8-34-8-60 0-92z" fill="#16271f"/>
      <circle cx="400" cy="308" r="126" fill="none" stroke="rgba(255,255,255,0.38)" stroke-width="8"/>
      <rect x="56" y="54" width="120" height="44" rx="22" fill="rgba(255,255,255,0.78)"/>
      <text x="94" y="84" font-family="Manrope, Arial, sans-serif" font-size="28" font-weight="700" fill="#1d3a2f">${initials}</text>
      <text x="56" y="910" font-family="Manrope, Arial, sans-serif" font-size="24" fill="#254536">Baramiz local guide</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

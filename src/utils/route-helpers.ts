import type { CategoryId, Language, Place } from "../types/tourism.types";
import { localize } from "./text-helpers";

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60) + minutes;
};

export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const createTimeRange = (startMinutes: number, endMinutes: number): string => {
  return `${minutesToTime(startMinutes)}-${minutesToTime(endMinutes)}`;
};

export const rankPlaces = (places: Place[], interests: CategoryId[]): Place[] => {
  return [...places].sort((leftPlace, rightPlace) => {
    const leftMatchesInterest = interests.includes(leftPlace.category) ? 1 : 0;
    const rightMatchesInterest = interests.includes(rightPlace.category) ? 1 : 0;

    if (leftMatchesInterest !== rightMatchesInterest) {
      return rightMatchesInterest - leftMatchesInterest;
    }

    if (leftPlace.featured !== rightPlace.featured) {
      return Number(rightPlace.featured) - Number(leftPlace.featured);
    }

    if (leftPlace.durationMinutes !== rightPlace.durationMinutes) {
      return leftPlace.durationMinutes - rightPlace.durationMinutes;
    }

    return leftPlace.name.localeCompare(rightPlace.name);
  });
};

export const buildRouteReason = (
  place: Place,
  interests: CategoryId[],
  language: Language,
  requestedCity: string,
): string => {
  const matchesInterest = interests.includes(place.category);
  const isSameCity = place.city.toLowerCase() === requestedCity.toLowerCase();

  if (matchesInterest && isSameCity) {
    return localize(language, {
      uz: `${place.name} siz tanlagan qiziqishlarga mos va ${place.city} ichida qulay stop hisoblanadi.`,
      en: `${place.name} matches your interests and fits naturally into a route inside ${place.city}.`,
      ru: `${place.name} \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432\u0430\u0448\u0438\u043c \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0430\u043c \u0438 \u0443\u0434\u043e\u0431\u043d\u043e \u0432\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0432 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u043f\u043e ${place.city}.`,
    });
  }

  if (matchesInterest) {
    return localize(language, {
      uz: `${place.name} sizning qiziqishlaringizga mos keladi va marshrutni boyitish uchun yaxshi qo'shimcha bo'ladi.`,
      en: `${place.name} matches your interests and adds a stronger local highlight to the route.`,
      ru: `${place.name} \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432\u0430\u0448\u0438\u043c \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0430\u043c \u0438 \u0434\u0435\u043b\u0430\u0435\u0442 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u0431\u043e\u043b\u0435\u0435 \u043d\u0430\u0441\u044b\u0449\u0435\u043d\u043d\u044b\u043c.`,
    });
  }

  if (place.featured) {
    return localize(language, {
      uz: `${place.name} mashhur va demo marshrut uchun ishonchli tavsiya hisoblanadi.`,
      en: `${place.name} is a featured highlight, so it is a reliable addition for a polished demo itinerary.`,
      ru: `${place.name} \u043e\u0442\u043c\u0435\u0447\u0435\u043d\u043e \u043a\u0430\u043a \u043a\u043b\u044e\u0447\u0435\u0432\u0430\u044f \u043b\u043e\u043a\u0430\u0446\u0438\u044f, \u043f\u043e\u044d\u0442\u043e\u043c\u0443 \u0445\u043e\u0440\u043e\u0448\u043e \u043f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u0434\u043b\u044f \u0434\u0435\u043c\u043e-\u043c\u0430\u0440\u0448\u0440\u0443\u0442\u0430.`,
    });
  }

  return localize(language, {
    uz: `${place.name} vaqt bo'yicha mos keladi va marshrutni muvozanatli qiladi.`,
    en: `${place.name} fits the remaining time well and keeps the route balanced.`,
    ru: `${place.name} \u0445\u043e\u0440\u043e\u0448\u043e \u043f\u043e\u043c\u0435\u0449\u0430\u0435\u0442\u0441\u044f \u043f\u043e \u0432\u0440\u0435\u043c\u0435\u043d\u0438 \u0438 \u0434\u0435\u043b\u0430\u0435\u0442 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u0431\u043e\u043b\u0435\u0435 \u0441\u0431\u0430\u043b\u0430\u043d\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u043c.`,
  });
};

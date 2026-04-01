import {
  CROSS_CITY_TRAVEL_SPEED_KMH,
  TRANSFER_BUFFER_MINUTES,
} from "../constants/tourism.constants";
import type { CategoryId, Coordinates, Language, Place } from "../types/tourism.types";
import { getCategoryLabel, localize, normalizeText } from "./text-helpers";

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

export const calculateDistanceKm = (from: Coordinates, to: Coordinates): number => {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(to.lat - from.lat);
  const lngDiff = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const haversineValue = (Math.sin(latDiff / 2) ** 2)
    + (Math.cos(fromLat) * Math.cos(toLat) * (Math.sin(lngDiff / 2) ** 2));
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * angularDistance;
};

const toRadians = (value: number): number => {
  return value * (Math.PI / 180);
};

export const estimateTransferMinutes = (
  fromCoordinates: Coordinates,
  toCoordinates: Coordinates,
  isSameCity: boolean,
): number => {
  if (isSameCity) {
    return TRANSFER_BUFFER_MINUTES;
  }

  const distanceKm = calculateDistanceKm(fromCoordinates, toCoordinates);
  const driveMinutes = Math.round((distanceKm / CROSS_CITY_TRAVEL_SPEED_KMH) * 60);
  const roundedDriveMinutes = Math.max(30, Math.ceil(driveMinutes / 10) * 10);

  return TRANSFER_BUFFER_MINUTES + roundedDriveMinutes;
};

interface RouteReasonInput {
  place: Place;
  interests: CategoryId[];
  language: Language;
  requestedCity: string;
  transferMinutes: number;
}

export const buildRouteReason = ({
  place,
  interests,
  language,
  requestedCity,
  transferMinutes,
}: RouteReasonInput): string => {
  const matchesInterest = interests.includes(place.category);
  const isSameCity = normalizeText(place.city) === normalizeText(requestedCity);
  const categoryLabel = getCategoryLabel(place.category, language);

  if (matchesInterest && isSameCity) {
    return localize(language, {
      kaa: `${place.name} ${categoryLabel} qızıǵıwıńızǵa sa'ykes ha'm ${place.city} ishinde qolay stop esaplanadı.`,
      uz: `${place.name} ${categoryLabel} qiziqishingizga mos va ${place.city} ichida qulay stop hisoblanadi.`,
      en: `${place.name} matches your ${categoryLabel} interest and fits naturally inside ${place.city}.`,
      ru: `${place.name} \u0445\u043e\u0440\u043e\u0448\u043e \u043f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u043f\u043e \u0442\u0435\u043c\u0435 ${categoryLabel} \u0438 \u0443\u0434\u043e\u0431\u043d\u043e \u043b\u043e\u0436\u0438\u0442\u0441\u044f \u0432 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u043f\u043e ${place.city}.`,
    });
  }

  if (matchesInterest) {
    return localize(language, {
      kaa: `${place.name} ${categoryLabel} boyınsha ku'shli tańlaw ha'm marshrutti bayıtadı.`,
      uz: `${place.name} ${categoryLabel} bo'yicha kuchli tanlov va marshrutni boyitadi.`,
      en: `${place.name} is a strong ${categoryLabel} match and adds more value to the route.`,
      ru: `${place.name} \u0441\u0438\u043b\u044c\u043d\u043e \u043f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u043f\u043e \u0442\u0435\u043c\u0435 ${categoryLabel} \u0438 \u0443\u0441\u0438\u043b\u0438\u0432\u0430\u0435\u0442 \u043c\u0430\u0440\u0448\u0440\u0443\u0442.`,
    });
  }

  if (!isSameCity) {
    return localize(language, {
      kaa: `${place.name} basqa qalada bolsa da, uzaǵraq jolǵa tu'rarlı belgili stop ha'm shamamen ${transferMinutes} minutlıq o’tiw menen jetip barıladı.`,
      uz: `${place.name} boshqa shaharda bo'lsa ham, uzoqroq yo'lga arziydigan mashhur stop va taxminan ${transferMinutes} daqiqalik o'tish bilan yetib boriladi.`,
      en: `${place.name} is outside ${requestedCity}, but it is a worthwhile highlight if you are comfortable with about ${transferMinutes} minutes of transfer time.`,
      ru: `${place.name} \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u0441\u044f \u043d\u0435 \u0432 ${requestedCity}, \u043d\u043e \u044d\u0442\u043e \u0441\u0438\u043b\u044c\u043d\u0430\u044f \u0442\u043e\u0447\u043a\u0430, \u0435\u0441\u043b\u0438 \u0432\u0430\u0441 \u0443\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u0442 \u043f\u0435\u0440\u0435\u0435\u0437\u0434 \u043f\u0440\u0438\u043c\u0435\u0440\u043d\u043e \u0432 ${transferMinutes} \u043c\u0438\u043d\u0443\u0442.`,
    });
  }

  if (place.featured) {
    return localize(language, {
      kaa: `${place.name} taniqlı highlight bolıp, demo marshrutti isenimli etedi.`,
      uz: `${place.name} taniqli highlight bo'lib, demo marshrutni ishonchli qiladi.`,
      en: `${place.name} is a featured highlight, so it keeps the itinerary strong and easy to present.`,
      ru: `${place.name} \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0437\u0430\u043c\u0435\u0442\u043d\u043e\u0439 \u043a\u043b\u044e\u0447\u0435\u0432\u043e\u0439 \u0442\u043e\u0447\u043a\u043e\u0439 \u0438 \u0443\u043a\u0440\u0435\u043f\u043b\u044f\u0435\u0442 \u043c\u0430\u0440\u0448\u0440\u0443\u0442.`,
    });
  }

  return localize(language, {
    kaa: `${place.name} waqıt boyınsha sa'ykes keledi ha'm marshrutti teńsalmaqlı etedi.`,
    uz: `${place.name} vaqt bo'yicha mos keladi va marshrutni muvozanatli qiladi.`,
    en: `${place.name} fits the remaining time well and keeps the route balanced.`,
    ru: `${place.name} \u0445\u043e\u0440\u043e\u0448\u043e \u0432\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043f\u043e \u0432\u0440\u0435\u043c\u0435\u043d\u0438 \u0438 \u0434\u0435\u043b\u0430\u0435\u0442 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u0431\u043e\u043b\u0435\u0435 \u0441\u0431\u0430\u043b\u0430\u043d\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u043c.`,
  });
};

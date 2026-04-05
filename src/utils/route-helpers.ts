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
      kaa: `${place.name} ${categoryLabel} qızıǵıwıńızǵa say keledi hám ${place.city} ishinde qolay stop boladı.`,
      uz: `${place.name} ${categoryLabel} qiziqishingizga mos va ${place.city} ichida qulay stop bo'ladi.`,
      ru: `${place.name} хорошо подходит по теме ${categoryLabel} и удобно ложится в маршрут по ${place.city}.`,
      en: `${place.name} matches your ${categoryLabel} interest and fits naturally inside ${place.city}.`,
    });
  }

  if (matchesInterest) {
    return localize(language, {
      kaa: `${place.name} ${categoryLabel} boyınsha kúshli tańlaw hám marshrutti bayıtadı.`,
      uz: `${place.name} ${categoryLabel} bo'yicha kuchli tanlov va marshrutni boyitadi.`,
      ru: `${place.name} хорошо подходит по теме ${categoryLabel} и усиливает маршрут.`,
      en: `${place.name} is a strong ${categoryLabel} match and adds more value to the route.`,
    });
  }

  if (!isSameCity) {
    return localize(language, {
      kaa: `${place.name} basqa qalada, biraq shamamen ${transferMinutes} minutlıq ótis penen barıwǵa arziydıǵan stop.`,
      uz: `${place.name} boshqa shaharda, lekin taxminan ${transferMinutes} daqiqalik o'tish bilan borishga arziydigan stop.`,
      ru: `${place.name} находится не в ${requestedCity}, но стоит поездки, если вас устраивает переезд примерно в ${transferMinutes} минут.`,
      en: `${place.name} is outside ${requestedCity}, but it is worthwhile if you are comfortable with about ${transferMinutes} minutes of transfer time.`,
    });
  }

  if (place.featured) {
    return localize(language, {
      kaa: `${place.name} tanılǵan highlight bolıp, marshruttı isenimli etedi.`,
      uz: `${place.name} taniqli highlight bo'lib, marshrutni ishonchli qiladi.`,
      ru: `${place.name} является заметной ключевой точкой и укрепляет маршрут.`,
      en: `${place.name} is a featured highlight, so it keeps the itinerary strong and easy to present.`,
    });
  }

  return localize(language, {
    kaa: `${place.name} qalıp qalǵan waqıtqa say keledi hám marshruttı teńsalmaqlı etedi.`,
    uz: `${place.name} qolgan vaqtga mos keladi va marshrutni muvozanatli qiladi.`,
    ru: `${place.name} хорошо вписывается по времени и делает маршрут более сбалансированным.`,
    en: `${place.name} fits the remaining time well and keeps the route balanced.`,
  });
};

import {
  CROSS_CITY_TRAVEL_SPEED_KMH,
  TRANSFER_BUFFER_MINUTES,
} from "../constants/tourism.constants";
import type { Coordinates, Language, Place, RecommendationPreferenceId } from "../types/tourism.types";
import {
  getPrimaryMatchingPreference,
  getRecommendationPreferenceLabel,
} from "./recommendation-preferences";
import { localize, normalizeText } from "./text-helpers";

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
  preferences: RecommendationPreferenceId[];
  language: Language;
  requestedCity: string;
  transferMinutes: number;
}

export const buildRouteReason = ({
  place,
  preferences,
  language,
  requestedCity,
  transferMinutes,
}: RouteReasonInput): string => {
  const isSameCity = normalizeText(place.city) === normalizeText(requestedCity);
  const matchingPreference = getPrimaryMatchingPreference(place, preferences, requestedCity);
  const preferenceLabel = matchingPreference
    ? getRecommendationPreferenceLabel(matchingPreference, language)
    : null;

  if (matchingPreference && isSameCity) {
    return localize(language, {
      kaa: `${place.name} ${preferenceLabel} qalawıńızǵa mas keledi hám ${place.city} ishinde qolay variant boladı.`,
      uz: `${place.name} ${preferenceLabel} afzalligingizga mos va ${place.city} ichida qulay variant bo'ladi.`,
      ru: `${place.name} хорошо подходит под ваш запрос на ${preferenceLabel} и удобно расположен в ${place.city}.`,
      en: `${place.name} matches your preference for ${preferenceLabel} and sits conveniently inside ${place.city}.`,
    });
  }

  if (matchingPreference) {
    return localize(language, {
      kaa: `${place.name} ${preferenceLabel} ushın kúshli tavsiya bolıp, tańlawıńızdı bayıtadı.`,
      uz: `${place.name} ${preferenceLabel} uchun kuchli tavsiya bo'lib, tanlovingizni boyitadi.`,
      ru: `${place.name} — сильная рекомендация под запрос на ${preferenceLabel}.`,
      en: `${place.name} is a strong match for your preference for ${preferenceLabel}.`,
    });
  }

  if (!isSameCity) {
    return localize(language, {
      kaa: `${place.name} ${requestedCity} sırtında, biraq shamamen ${transferMinutes} minutlıq jól menen barıwǵa arziydı.`,
      uz: `${place.name} ${requestedCity} tashqarisida, lekin taxminan ${transferMinutes} daqiqalik yo'l bilan borishga arziydi.`,
      ru: `${place.name} находится не в ${requestedCity}, но туда стоит поехать, если вас устраивает дорога примерно на ${transferMinutes} минут.`,
      en: `${place.name} sits outside ${requestedCity}, but it is still worth considering if you are comfortable with about ${transferMinutes} minutes of travel.`,
    });
  }

  if (place.featured) {
    return localize(language, {
      kaa: `${place.name} tanılǵan highlight bolıp, sizge isenimli tańlaw beredi.`,
      uz: `${place.name} taniqli highlight bo'lib, sizga ishonchli tanlov beradi.`,
      ru: `${place.name} — заметный городской highlight и надежная рекомендация.`,
      en: `${place.name} is a featured highlight and an easy place to recommend with confidence.`,
    });
  }

  return localize(language, {
    kaa: `${place.name} osı qala ushın jaqsı tavsiya bolıp, sapar tańlawıńızdı toltıradı.`,
    uz: `${place.name} shu shahar uchun yaxshi tavsiya bo'lib, tanlovingizni to'ldiradi.`,
    ru: `${place.name} хорошо дополняет подборку мест по этому городу.`,
    en: `${place.name} rounds out the recommendation set for this city nicely.`,
  });
};

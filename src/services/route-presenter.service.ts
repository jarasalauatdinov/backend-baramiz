import { ROUTE_START_TIME } from "../constants/tourism.constants";
import type { GeneratedRoute, Language, RouteDuration } from "../types/tourism.types";
import { buildRouteReason, timeToMinutes } from "../utils/route-helpers";
import { localize, normalizeText } from "../utils/text-helpers";
import { toRouteStop } from "./places.service";
import type { PlannedRoute } from "./route-planner.service";

const formatClockTime = (minutes: number): string => {
  return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

const getLocalizedDurationLabel = (language: Language, duration: RouteDuration): string => {
  return localize(language, {
    kaa: duration === "3_hours" ? "3 saatliq" : duration === "half_day" ? "jarim kunlik" : "1 kunlik",
    uz: duration === "3_hours" ? "3 soatlik" : duration === "half_day" ? "yarim kunlik" : "1 kunlik",
    ru: duration === "3_hours" ? "3 часа" : duration === "half_day" ? "полдня" : "1 день",
    en: duration === "3_hours" ? "3-hour" : duration === "half_day" ? "half-day" : "1-day",
  });
};

const buildLocalizedTitle = (
  language: Language,
  resolvedCity: string,
  duration: RouteDuration,
): string => {
  const formattedDuration = getLocalizedDurationLabel(language, duration);

  return localize(language, {
    kaa: `${resolvedCity} ushin ${formattedDuration} marshrut`,
    uz: `${resolvedCity} uchun ${formattedDuration} marshrut`,
    ru: `Маршрут по ${resolvedCity} на ${formattedDuration}`,
    en: `${resolvedCity} ${formattedDuration} itinerary`,
  });
};

const buildLocalizedSummary = (
  language: Language,
  stopCount: number,
  totalDurationMinutes: number,
): string => {
  const endMinutes = timeToMinutes(ROUTE_START_TIME) + totalDurationMinutes;
  const formattedEndTime = formatClockTime(endMinutes);

  return localize(language, {
    kaa: `${stopCount} stop ${ROUTE_START_TIME} de baslanip, shamamen ${formattedEndTime} da juwmaqlanadi.`,
    uz: `${stopCount} ta stop ${ROUTE_START_TIME} da boshlanib taxminan ${formattedEndTime} da yakunlanadi.`,
    ru: `${stopCount} остановки, старт в ${ROUTE_START_TIME} и завершение примерно в ${formattedEndTime}.`,
    en: `${stopCount} stops starting at ${ROUTE_START_TIME} and ending around ${formattedEndTime}.`,
  });
};

const buildFallbackTips = (plannedRoute: PlannedRoute): string[] => {
  const longestStop = [...plannedRoute.stops]
    .sort((left, right) => right.place.duration - left.place.duration)[0]
    ?.place;
  const hasCrossCityStop = plannedRoute.stops.some((stop) => {
    return normalizeText(stop.place.city) !== normalizeText(plannedRoute.resolvedCity);
  });

  return [
    localize(plannedRoute.language, {
      kaa: `${ROUTE_START_TIME} da baslaw marshruttı jedel etedi.`,
      uz: `${ROUTE_START_TIME} da boshlash marshrutni silliq olib boradi.`,
      ru: `Старт около ${ROUTE_START_TIME} поможет пройти маршрут без спешки.`,
      en: `Starting around ${ROUTE_START_TIME} keeps the route comfortable.`,
    }),
    longestStop
      ? localize(plannedRoute.language, {
          kaa: `${longestStop.name} ushın kóbirek waqıt ajıratıń.`,
          uz: `${longestStop.name} uchun ko'proq vaqt ajrating.`,
          ru: `Заложите больше времени на ${longestStop.name}.`,
          en: `Set aside extra time for ${longestStop.name}.`,
        })
      : localize(plannedRoute.language, {
          kaa: `Har bir stop ushin qısqa demalıs waqtın esepteń.`,
          uz: `Har bir stop uchun qisqa tanaffus vaqtini hisoblang.`,
          ru: `Оставьте короткий запас времени между остановками.`,
          en: `Leave a short buffer between stops.`,
        }),
    hasCrossCityStop
      ? localize(plannedRoute.language, {
          kaa: `Qala aralıǵındaǵı ótis ushin aldınnan transport kelisip alıń.`,
          uz: `Shaharlar orasidagi o'tish uchun transportni oldindan kelishib oling.`,
          ru: `Для межгородского переезда лучше заранее договориться о транспорте.`,
          en: `Arrange transport in advance for the cross-city segment.`,
        })
      : localize(plannedRoute.language, {
          kaa: `Suw hám telefon quwatın dayınlap júriń.`,
          uz: `Suv va telefon quvvatini tayyorlab yuring.`,
          ru: `Возьмите воду и держите телефон заряженным.`,
          en: `Carry water and keep your phone charged.`,
        }),
  ];
};

export const presentRoute = (plannedRoute: PlannedRoute): GeneratedRoute => {
  const stops = plannedRoute.stops.map((stop, index) => ({
    ...toRouteStop(stop.place, index + 1),
    description: buildRouteReason({
      place: stop.place,
      interests: plannedRoute.interests,
      language: plannedRoute.language,
      requestedCity: plannedRoute.resolvedCity,
      transferMinutes: stop.transferMinutes,
    }),
  }));

  return {
    city: plannedRoute.resolvedCity,
    language: plannedRoute.language,
    duration: plannedRoute.duration,
    mode: "deterministic",
    title: buildLocalizedTitle(plannedRoute.language, plannedRoute.resolvedCity, plannedRoute.duration),
    summary: buildLocalizedSummary(plannedRoute.language, stops.length, plannedRoute.totalDurationMinutes),
    tips: buildFallbackTips(plannedRoute),
    totalDurationMinutes: plannedRoute.totalDurationMinutes,
    stops,
  };
};

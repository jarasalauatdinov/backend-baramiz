import type { GeneratedRoute, Language } from "../types/tourism.types";
import { buildRouteReason } from "../utils/route-helpers";
import { localize, normalizeText } from "../utils/text-helpers";
import { toRouteStop } from "./places.service";
import type { PlannedRoute } from "./route-planner.service";

const buildLocalizedTitle = (language: Language, resolvedCity: string): string => {
  return localize(language, {
    kaa: `${resolvedCity} ushın tavsiya etilgen orınlar`,
    uz: `${resolvedCity} uchun tavsiya etilgan joylar`,
    ru: `Рекомендованные места в ${resolvedCity}`,
    en: `Recommended places in ${resolvedCity}`,
  });
};

const buildLocalizedSummary = (
  language: Language,
  resolvedCity: string,
  stopCount: number,
  preferenceCount: number,
): string => {
  return localize(language, {
    kaa: `${resolvedCity} ushın ${stopCount} tavsiya etilgen orın. ${preferenceCount} ta saylanǵan filtr esapqa alındı.`,
    uz: `${resolvedCity} uchun ${stopCount} ta tavsiya etilgan joy. ${preferenceCount} ta tanlangan filtr hisobga olindi.`,
    ru: `${stopCount} рекомендаций по ${resolvedCity}. Учтено ${preferenceCount} выбранных фильтра.`,
    en: `${stopCount} recommended places in ${resolvedCity}, matched to ${preferenceCount} selected filters.`,
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
      kaa: `Eń kúshli birinshi varianttan baslap, qalǵanların ornında qarap tańlań.`,
      uz: `Avval eng kuchli birinchi variantni ko'rib, qolganlarini joyida tanlang.`,
      ru: `Начните с самого сильного первого варианта, а остальные выберите уже на месте.`,
      en: `Start with the strongest first pick, then decide the rest on the spot.`,
    }),
    longestStop
      ? localize(plannedRoute.language, {
          kaa: `${longestStop.name} ushın kóbirek waqıt ajıratqan maqul.`,
          uz: `${longestStop.name} uchun ko'proq vaqt ajratsangiz yaxshi bo'ladi.`,
          ru: `На ${longestStop.name} лучше заложить побольше времени.`,
          en: `It is worth setting aside extra time for ${longestStop.name}.`,
        })
      : localize(plannedRoute.language, {
          kaa: `Qısqa dem alıw hám foto úshin azraq bos waqıt qaldırıń.`,
          uz: `Qisqa tanaffus va suratlar uchun ozroq bo'sh vaqt qoldiring.`,
          ru: `Оставьте немного свободного времени на паузу и фото.`,
          en: `Leave a little buffer for a short pause and photos.`,
        }),
    hasCrossCityStop
      ? localize(plannedRoute.language, {
          kaa: `Qala sırtına shıǵatuǵın orınlar ushın transporttı aldınnan kelisip alıń.`,
          uz: `Shahar tashqarisidagi joylar uchun transportni oldindan kelishib oling.`,
          ru: `Для мест за пределами города лучше заранее договориться о транспорте.`,
          en: `For places outside the city, it is better to arrange transport in advance.`,
        })
      : localize(plannedRoute.language, {
          kaa: `Jaqın servisler sapardı jeńillestiredi, kerek bolsa olardı da ashıp kóriń.`,
          uz: `Yaqin servislar sayohatni yengillashtiradi, kerak bo'lsa ularni ham ko'rib chiqing.`,
          ru: `Ближайшие сервисы могут упростить поездку, если они вам понадобятся.`,
          en: `Nearby services can make the visit easier if you need them along the way.`,
        }),
  ];
};

export const presentRoute = (plannedRoute: PlannedRoute): GeneratedRoute => {
  const stops = plannedRoute.stops.map((stop, index) => ({
    ...toRouteStop(stop.place, index + 1),
    description: buildRouteReason({
      place: stop.place,
      preferences: plannedRoute.preferences,
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
    title: buildLocalizedTitle(plannedRoute.language, plannedRoute.resolvedCity),
    summary: buildLocalizedSummary(
      plannedRoute.language,
      plannedRoute.resolvedCity,
      stops.length,
      plannedRoute.preferences.length,
    ),
    tips: buildFallbackTips(plannedRoute),
    totalDurationMinutes: plannedRoute.totalDurationMinutes,
    stops,
  };
};

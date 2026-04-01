import type { CategoryId, ChatInput, ChatResponse, Language, Place, RouteDuration } from "../types/tourism.types";
import {
  buildChatSuggestions,
  detectCityFromMessage,
  detectDurationFromMessage,
  detectInterestsFromMessage,
  detectPlaceFromMessage,
  formatPlaceNames,
  getCategoryLabel,
  localize,
} from "../utils/text-helpers";
import { aiProviderService } from "./ai-provider.service";
import { placesService } from "./places.service";
import { routeGeneratorService } from "./route-generator.service";

interface ChatInsights {
  allPlaces: Place[];
  detectedCity?: string;
  detectedDuration?: RouteDuration;
  detectedInterests: CategoryId[];
  detectedPlace?: Place;
  relevantPlaces: Place[];
}

interface ChatProviderRequest {
  message: string;
  language: Language;
  contextPlaces: Place[];
  instructions: string[];
}

interface ChatProvider {
  readonly source: Exclude<ChatResponse["source"], "fallback"> | string;
  isAvailable(): boolean;
  generateReply(request: ChatProviderRequest): Promise<string | null>;
}

class ConfiguredAIChatProvider implements ChatProvider {
  readonly source = "openai";

  isAvailable(): boolean {
    return aiProviderService.isEnabled();
  }

  async generateReply(request: ChatProviderRequest): Promise<string | null> {
    return aiProviderService.createChatReply(request);
  }
}

class ChatService {
  constructor(private readonly providers: ChatProvider[] = [new ConfiguredAIChatProvider()]) {}

  async reply(input: ChatInput): Promise<ChatResponse> {
    const insights = this.buildInsights(input);
    const providerReply = await this.tryProviders(input, insights);

    if (providerReply) {
      return {
        reply: providerReply.reply,
        source: providerReply.source as ChatResponse["source"],
        suggestions: buildChatSuggestions(input.language),
      };
    }

    return {
      reply: this.buildFallbackReply(input.language, insights),
      source: "fallback",
      suggestions: buildChatSuggestions(input.language),
    };
  }

  private async tryProviders(
    input: ChatInput,
    insights: ChatInsights,
  ): Promise<{ reply: string; source: string } | null> {
    const request: ChatProviderRequest = {
      message: input.message,
      language: input.language,
      contextPlaces: insights.relevantPlaces,
      instructions: this.buildPromptInstructions(),
    };

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        const reply = await provider.generateReply(request);

        if (reply) {
          return {
            reply,
            source: provider.source,
          };
        }
      } catch (error) {
        console.error(`${provider.source} chat fallback triggered:`, error);
      }
    }

    return null;
  }

  private buildInsights(input: ChatInput): ChatInsights {
    const allPlaces = placesService.getAllPlaces(input.language);
    const detectedCity = detectCityFromMessage(input.message, allPlaces);
    const detectedDuration = detectDurationFromMessage(input.message);
    const detectedInterests = detectInterestsFromMessage(input.message);
    const detectedPlace = detectPlaceFromMessage(input.message, allPlaces);
    const relevantPlaces = this.buildRelevantContext(allPlaces, detectedCity, detectedInterests, detectedPlace);

    return {
      allPlaces,
      detectedCity,
      detectedDuration,
      detectedInterests,
      detectedPlace,
      relevantPlaces,
    };
  }

  private buildRelevantContext(
    allPlaces: Place[],
    city?: string,
    interests: CategoryId[] = [],
    detectedPlace?: Place,
  ): Place[] {
    return [...allPlaces]
      .sort((leftPlace, rightPlace) => {
        const leftScore = this.scorePlace(leftPlace, city, interests, detectedPlace);
        const rightScore = this.scorePlace(rightPlace, city, interests, detectedPlace);

        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }

        if (leftPlace.featured !== rightPlace.featured) {
          return Number(rightPlace.featured) - Number(leftPlace.featured);
        }

        return leftPlace.name.localeCompare(rightPlace.name);
      })
      .slice(0, 6);
  }

  private scorePlace(
    place: Place,
    city?: string,
    interests: CategoryId[] = [],
    detectedPlace?: Place,
  ): number {
    let score = 0;

    if (detectedPlace && place.id === detectedPlace.id) {
      score += 8;
    }

    if (city && place.city.toLowerCase() === city.toLowerCase()) {
      score += 4;
    }

    if (interests.includes(place.category)) {
      score += 3;
    }

    if (place.featured) {
      score += 1;
    }

    return score;
  }

  private buildPromptInstructions(): string[] {
    return [
      "Answer as a Baramiz AI travel assistant for Karakalpakstan.",
      "Keep the answer short, practical, and tourism-focused.",
      "Prefer the provided local places over generic advice.",
      "Use exact local place names from the context when possible.",
      "If the request is vague, ask for city or available time in one short sentence.",
    ];
  }

  private buildFallbackReply(language: Language, insights: ChatInsights): string {
    const { allPlaces, detectedCity, detectedDuration, detectedInterests, detectedPlace } = insights;

    if (detectedPlace) {
      return this.buildSpecificPlaceReply(language, detectedPlace, allPlaces);
    }

    if (detectedCity && detectedDuration) {
      const routeReply = this.buildRouteReply(language, detectedCity, detectedDuration, detectedInterests);

      if (routeReply) {
        return routeReply;
      }
    }

    if (detectedCity) {
      return this.buildCityReply(language, detectedCity, detectedInterests);
    }

    if (detectedInterests.length > 0) {
      return this.buildInterestReply(language, detectedInterests, allPlaces);
    }

    return this.buildGeneralReply(language);
  }

  private buildSpecificPlaceReply(language: Language, place: Place, allPlaces: Place[]): string {
    const nearbyPlaces = allPlaces
      .filter((candidatePlace) => candidatePlace.city === place.city && candidatePlace.id !== place.id)
      .sort((leftPlace, rightPlace) => {
        if (leftPlace.featured !== rightPlace.featured) {
          return Number(rightPlace.featured) - Number(leftPlace.featured);
        }

        return leftPlace.durationMinutes - rightPlace.durationMinutes;
      })
      .slice(0, 2);

    const nearbySummary = nearbyPlaces.length > 0 ? formatPlaceNames(nearbyPlaces, language) : place.city;
    const categoryLabel = getCategoryLabel(place.category, language);

    return localize(language, {
      kaa: `${place.name} ${place.city}dagi ku'shli ${categoryLabel} stoplardan biri. Bul jerge shamamen ${place.durationMinutes} minut ajıratıń. Oni ${nearbySummary} menen birge ko'riw qolay.`,
      uz: `${place.name} ${place.city}dagi kuchli ${categoryLabel} stoplaridan biri. Bu joy uchun taxminan ${place.durationMinutes} daqiqa ajrating. Uni ${nearbySummary} bilan birga ko'rish qulay bo'ladi.`,
      en: `${place.name} is one of the stronger ${categoryLabel} stops in ${place.city}. Plan about ${place.durationMinutes} minutes there. It pairs well with ${nearbySummary}.`,
      ru: `${place.name} \u044d\u0442\u043e \u043e\u0434\u043d\u0430 \u0438\u0437 \u0441\u0438\u043b\u044c\u043d\u044b\u0445 ${categoryLabel} \u0442\u043e\u0447\u0435\u043a \u0432 ${place.city}. \u0417\u0430\u043b\u043e\u0436\u0438\u0442\u0435 \u043d\u0430 \u043d\u0435\u0435 \u043f\u0440\u0438\u043c\u0435\u0440\u043d\u043e ${place.durationMinutes} \u043c\u0438\u043d\u0443\u0442. \u0415\u0435 \u0443\u0434\u043e\u0431\u043d\u043e \u0441\u043e\u0447\u0435\u0442\u0430\u0442\u044c \u0441 ${nearbySummary}.`,
    });
  }

  private buildRouteReply(
    language: Language,
    city: string,
    duration: RouteDuration,
    detectedInterests: CategoryId[],
  ): string | null {
    try {
      const route = routeGeneratorService.generateRoute({
        city,
        duration,
        interests: this.resolvePreferredInterests(city, detectedInterests, language),
        language,
      });

      const routeSummary = route.items
        .slice(0, 4)
        .map((item) => `${item.time} ${item.place.name}`)
        .join("; ");

      return localize(language, {
        kaa: `${city} ushin a'meliy reja: ${routeSummary}. Qalesen'iz, buni ja'nede bayawraq, qısqaraq yamasa bir tema boyınsha qayta du'zemen.`,
        uz: `${city} uchun amaliy reja: ${routeSummary}. Xohlasangiz, buni sokinroq yoki aniqroq mavzu bo'yicha qayta tuzaman.`,
        en: `A practical ${city} plan is: ${routeSummary}. If you want, I can make it slower, shorter, or more focused on one theme.`,
        ru: `\u041f\u0440\u0430\u043a\u0442\u0438\u0447\u043d\u044b\u0439 \u043f\u043b\u0430\u043d \u0434\u043b\u044f ${city}: ${routeSummary}. \u0415\u0441\u043b\u0438 \u0445\u043e\u0442\u0438\u0442\u0435, \u044f \u043c\u043e\u0433\u0443 \u0441\u0434\u0435\u043b\u0430\u0442\u044c \u0435\u0433\u043e \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u0435\u0435, \u043a\u043e\u0440\u043e\u0447\u0435 \u0438\u043b\u0438 \u0431\u043e\u043b\u0435\u0435 \u0442\u0435\u043c\u0430\u0442\u0438\u0447\u043d\u044b\u043c.`,
      });
    } catch {
      return null;
    }
  }

  private buildCityReply(language: Language, city: string, detectedInterests: CategoryId[]): string {
    const cityPlaces = placesService.getPlacesByCity(city, language);
    const recommendations = cityPlaces
      .sort((leftPlace, rightPlace) => {
        const leftInterestScore = detectedInterests.includes(leftPlace.category) ? 1 : 0;
        const rightInterestScore = detectedInterests.includes(rightPlace.category) ? 1 : 0;

        if (leftInterestScore !== rightInterestScore) {
          return rightInterestScore - leftInterestScore;
        }

        if (leftPlace.featured !== rightPlace.featured) {
          return Number(rightPlace.featured) - Number(leftPlace.featured);
        }

        return leftPlace.durationMinutes - rightPlace.durationMinutes;
      })
      .slice(0, 3);

    const summary = recommendations
      .map((place) => `${place.name} (${place.durationMinutes} min)`)
      .join(", ");

    return localize(language, {
      kaa: `${city} ushin jaqsı baslanıw: ${summary}. Bul tan'law qaladag'i en qolay ha'm ko'p qollanılatuǵın stoplardı beredi. Waqtıńızdı jazsańız, men anıq marshrut du'zemen.`,
      uz: `${city} uchun yaxshi boshlanish: ${summary}. Bu tanlov shahardagi eng qulay va ko'p ishlatiladigan stoplarni beradi. Vaqtingizni yozsangiz, men aniq marshrut tuzaman.`,
      en: `A strong starting set for ${city} is ${summary}. That gives you the most practical city highlights first. If you share your available time, I can turn it into a precise route.`,
      ru: `\u0425\u043e\u0440\u043e\u0448\u0438\u0439 \u0441\u0442\u0430\u0440\u0442 \u0434\u043b\u044f ${city}: ${summary}. \u042d\u0442\u043e \u0434\u0430\u0435\u0442 \u0441\u0430\u043c\u044b\u0435 \u043f\u0440\u0430\u043a\u0442\u0438\u0447\u043d\u044b\u0435 \u0433\u043e\u0440\u043e\u0434\u0441\u043a\u0438\u0435 \u0442\u043e\u0447\u043a\u0438. \u0415\u0441\u043b\u0438 \u043d\u0430\u043f\u0438\u0448\u0435\u0442\u0435, \u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0443 \u0432\u0430\u0441 \u0432\u0440\u0435\u043c\u0435\u043d\u0438, \u044f \u0441\u043e\u0431\u0435\u0440\u0443 \u0442\u043e\u0447\u043d\u044b\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442.`,
    });
  }

  private buildInterestReply(language: Language, detectedInterests: CategoryId[], allPlaces: Place[]): string {
    const interestPlaces = allPlaces
      .filter((place) => detectedInterests.includes(place.category))
      .sort((leftPlace, rightPlace) => {
        if (leftPlace.featured !== rightPlace.featured) {
          return Number(rightPlace.featured) - Number(leftPlace.featured);
        }

        return leftPlace.name.localeCompare(rightPlace.name);
      })
      .slice(0, 4);

    const summary = interestPlaces
      .map((place) => `${place.name} (${place.city})`)
      .join(", ");

    return localize(language, {
      kaa: `${this.formatInterestLabels(detectedInterests, language)} ushin ku'shli variantlar: ${summary}. Qalan'ızdı yamasa waqıt aralığın jazsańız, men tan'lawdı anıǵıraq qısqartaman.`,
      uz: `${this.formatInterestLabels(detectedInterests, language)} uchun kuchli variantlar: ${summary}. Shahar yoki davomiylikni yozsangiz, tanlovni aniqroq qisqartiraman.`,
      en: `Strong options for ${this.formatInterestLabels(detectedInterests, language)} are ${summary}. Tell me your city or time window, and I will narrow this down properly.`,
      ru: `\u0421\u0438\u043b\u044c\u043d\u044b\u0435 \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u044b \u043f\u043e \u0442\u0435\u043c\u0435 ${this.formatInterestLabels(detectedInterests, language)}: ${summary}. \u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0433\u043e\u0440\u043e\u0434 \u0438\u043b\u0438 \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e\u0435 \u043e\u043a\u043d\u043e, \u0438 \u044f \u0441\u0443\u0436\u0443 \u0432\u044b\u0431\u043e\u0440.`,
    });
  }

  private buildGeneralReply(language: Language): string {
    const featuredPlaces = placesService.getFeaturedPlaces(4, language);
    const featuredSummary = featuredPlaces
      .map((place) => `${place.name} (${place.city})`)
      .join(", ");

    return localize(language, {
      kaa: `Baslaw ushin en jaqsı variantlar: ${featuredSummary}. Nokis muzeyler ushin, Moynaq Aral ten'izi tariyxı ushin, al Ellikqala qala marshrutları ushin ku'shli bag'dar. Qala yaki sapar uzaqlıǵın jazsańız, men buni anıǵıraq etemen.`,
      uz: `Boshlash uchun eng yaxshi variantlar: ${featuredSummary}. Nukus muzeylar uchun, Moynaq Aral dengizi tarixi uchun, Ellikqala esa qal'alar uchun kuchli yo'nalish. Shahar yoki vaqtni yozsangiz, men aniqroq tavsiya beraman.`,
      en: `A strong starting set is ${featuredSummary}. Nukus is strongest for museums, Moynaq for Aral Sea history, and Ellikqala for fortress routes. Tell me your city or trip length, and I will make it more specific.`,
      ru: `\u0425\u043e\u0440\u043e\u0448\u0438\u0439 \u0441\u0442\u0430\u0440\u0442: ${featuredSummary}. \u041d\u0443\u043a\u0443\u0441 \u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e \u0441\u0438\u043b\u0435\u043d \u0434\u043b\u044f \u043c\u0443\u0437\u0435\u0435\u0432, \u041c\u043e\u0439\u043d\u0430\u043a \u0434\u043b\u044f \u0438\u0441\u0442\u043e\u0440\u0438\u0438 \u0410\u0440\u0430\u043b\u044c\u0441\u043a\u043e\u0433\u043e \u043c\u043e\u0440\u044f, \u0430 Ellikqala \u0434\u043b\u044f \u043c\u0430\u0440\u0448\u0440\u0443\u0442\u043e\u0432 \u043f\u043e \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u044f\u043c. \u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0433\u043e\u0440\u043e\u0434 \u0438\u043b\u0438 \u0434\u043b\u0438\u043d\u0443 \u043f\u043e\u0435\u0437\u0434\u043a\u0438, \u0438 \u044f \u0443\u0442\u043e\u0447\u043d\u044e \u043f\u043b\u0430\u043d.`,
    });
  }

  private resolvePreferredInterests(
    city: string,
    detectedInterests: CategoryId[],
    language: Language,
  ): CategoryId[] {
    if (detectedInterests.length > 0) {
      return detectedInterests;
    }

    const cityPlaces = placesService.getPlacesByCity(city, language);
    const categoryCounts = new Map<CategoryId, number>();

    for (const place of cityPlaces) {
      const existingCount = categoryCounts.get(place.category) ?? 0;
      categoryCounts.set(place.category, existingCount + (place.featured ? 2 : 1));
    }

    const rankedCategories = [...categoryCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([category]) => category);

    return rankedCategories.slice(0, 2).length > 0 ? rankedCategories.slice(0, 2) : ["history", "culture"];
  }

  private formatInterestLabels(interests: CategoryId[], language: Language): string {
    return interests.map((interest) => getCategoryLabel(interest, language)).join(", ");
  }
}

export const chatService = new ChatService();

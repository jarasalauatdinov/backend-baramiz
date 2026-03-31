import type { CategoryId, ChatInput, ChatResponse, Language, Place, RouteDuration } from "../types/tourism.types";
import {
  buildChatSuggestions,
  detectCityFromMessage,
  detectDurationFromMessage,
  detectInterestsFromMessage,
  formatPlaceNames,
  localize,
} from "../utils/text-helpers";
import { openAIService } from "./openai.service";
import { placesService } from "./places.service";
import { routeGeneratorService } from "./route-generator.service";

interface ChatInsights {
  allPlaces: Place[];
  detectedCity?: string;
  detectedDuration?: RouteDuration;
  detectedInterests: CategoryId[];
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

class OpenAIChatProvider implements ChatProvider {
  readonly source = "openai";

  isAvailable(): boolean {
    return openAIService.isEnabled();
  }

  async generateReply(request: ChatProviderRequest): Promise<string | null> {
    return openAIService.createChatReply(request);
  }
}

class ChatService {
  constructor(private readonly providers: ChatProvider[] = [new OpenAIChatProvider()]) {}

  async reply(input: ChatInput): Promise<ChatResponse> {
    const insights = this.buildInsights(input.message);
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

  private buildInsights(message: string): ChatInsights {
    const allPlaces = placesService.getAllPlaces();
    const detectedCity = detectCityFromMessage(message, allPlaces);
    const detectedDuration = detectDurationFromMessage(message);
    const detectedInterests = detectInterestsFromMessage(message);
    const relevantPlaces = this.buildRelevantContext(allPlaces, detectedCity, detectedInterests);

    return {
      allPlaces,
      detectedCity,
      detectedDuration,
      detectedInterests,
      relevantPlaces,
    };
  }

  private buildRelevantContext(allPlaces: Place[], city?: string, interests: CategoryId[] = []): Place[] {
    const scoredPlaces = [...allPlaces].sort((leftPlace, rightPlace) => {
      const leftScore = this.scorePlace(leftPlace, city, interests);
      const rightScore = this.scorePlace(rightPlace, city, interests);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (leftPlace.featured !== rightPlace.featured) {
        return Number(rightPlace.featured) - Number(leftPlace.featured);
      }

      return leftPlace.name.localeCompare(rightPlace.name);
    });

    return scoredPlaces.slice(0, 6);
  }

  private scorePlace(place: Place, city?: string, interests: CategoryId[] = []): number {
    let score = 0;

    if (city && place.city.toLowerCase() === city.toLowerCase()) {
      score += 3;
    }

    if (interests.includes(place.category)) {
      score += 2;
    }

    if (place.featured) {
      score += 1;
    }

    return score;
  }

  private buildPromptInstructions(): string[] {
    return [
      "Answer as a travel assistant for Baramiz AI.",
      "Keep the answer short, useful, and focused on tourism in Karakalpakstan.",
      "Prefer places from the provided local context over generic advice.",
      "Mention 2 to 4 concrete suggestions when possible.",
      "If the request is vague, ask for city or available time in one short sentence.",
    ];
  }

  private buildFallbackReply(language: Language, insights: ChatInsights): string {
    const { allPlaces, detectedCity, detectedDuration, detectedInterests } = insights;

    if (detectedCity && detectedDuration) {
      try {
        const route = routeGeneratorService.generateRoute({
          city: detectedCity,
          duration: detectedDuration,
          interests: detectedInterests.length > 0 ? detectedInterests : ["history", "culture"],
          language,
        });

        const routeSummary = route.items
          .slice(0, 4)
          .map((item) => `${item.time} - ${item.place.name}`)
          .join("\n");

        return localize(language, {
          uz: `${detectedCity} uchun qisqa tavsiya:\n${routeSummary}\nAgar xohlasangiz, buni yanada sokin yoki tarixga yo'naltirilgan variantga moslab beraman.`,
          en: `Here is a practical ${detectedCity} plan:\n${routeSummary}\nIf you want, I can also adapt it for a slower museum-style trip or a history-focused visit.`,
          ru: `\u0412\u043e\u0442 \u043f\u0440\u0430\u043a\u0442\u0438\u0447\u043d\u044b\u0439 \u043f\u043b\u0430\u043d \u0434\u043b\u044f ${detectedCity}:\n${routeSummary}\n\u0415\u0441\u043b\u0438 \u0445\u043e\u0442\u0438\u0442\u0435, \u044f \u043c\u043e\u0433\u0443 \u0441\u0434\u0435\u043b\u0430\u0442\u044c \u0435\u0433\u043e \u0431\u043e\u043b\u0435\u0435 \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u044b\u043c \u0438\u043b\u0438 \u0441\u0438\u043b\u044c\u043d\u0435\u0435 \u0441\u043c\u0435\u0441\u0442\u0438\u0442\u044c \u0432 \u0441\u0442\u043e\u0440\u043e\u043d\u0443 \u0438\u0441\u0442\u043e\u0440\u0438\u0438.`,
        });
      } catch {
        // If route generation cannot help, continue to city-based fallback below.
      }
    }

    if (detectedCity) {
      const cityPlaces = placesService.getPlacesByCity(detectedCity);
      const matchingCityPlaces = cityPlaces.filter((place) => {
        return detectedInterests.length === 0 || detectedInterests.includes(place.category);
      });
      const fallbackPlaces = (matchingCityPlaces.length > 0 ? matchingCityPlaces : cityPlaces).slice(0, 3);

      return localize(language, {
        uz: `${detectedCity} uchun men ${formatPlaceNames(fallbackPlaces)} joylarini tavsiya qilaman. Bu joylar shaharda qulay va sayohat uchun yaxshi start beradi. Vaqtingizni aytsangiz, aniq marshrut tuzib beraman.`,
        en: `For ${detectedCity}, I recommend ${formatPlaceNames(fallbackPlaces)}. They give you a solid mix of local highlights and are easy to turn into a practical route. If you share your available time, I can make it more precise.`,
        ru: `\u0414\u043b\u044f ${detectedCity} \u044f \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u044e ${formatPlaceNames(fallbackPlaces)}. \u042d\u0442\u043e \u0443\u0434\u043e\u0431\u043d\u044b\u0439 \u043d\u0430\u0431\u043e\u0440 \u0441\u0438\u043b\u044c\u043d\u044b\u0445 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0445 \u0442\u043e\u0447\u0435\u043a, \u0438\u0437 \u043a\u043e\u0442\u043e\u0440\u043e\u0433\u043e \u043b\u0435\u0433\u043a\u043e \u0441\u043e\u0431\u0440\u0430\u0442\u044c \u0445\u043e\u0440\u043e\u0448\u0438\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442. \u0415\u0441\u043b\u0438 \u043d\u0430\u043f\u0438\u0448\u0435\u0442\u0435, \u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0443 \u0432\u0430\u0441 \u0432\u0440\u0435\u043c\u0435\u043d\u0438, \u044f \u0443\u0442\u043e\u0447\u043d\u044e \u043f\u043b\u0430\u043d.`,
      });
    }

    if (detectedInterests.length > 0) {
      const interestPlaces = allPlaces
        .filter((place) => detectedInterests.includes(place.category))
        .slice(0, 4);

      if (interestPlaces.length > 0) {
        const placeSummary = interestPlaces
          .map((place) => `${place.name} in ${place.city}`)
          .join(", ");

        return localize(language, {
          uz: `${this.formatInterests(detectedInterests, language)} uchun yaxshi variantlar: ${placeSummary}. Bu joylar Karakalpakstanning turli tomonlarini ko'rsatadi. Shahar yoki vaqtni aytsangiz, men tanlovni toraytiraman.`,
          en: `For ${this.formatInterests(detectedInterests, language)}, a strong starting set is ${placeSummary}. These spots give a useful cross-section of Karakalpakstan. Tell me your city or time window, and I will narrow it down.`,
          ru: `\u0414\u043b\u044f ${this.formatInterests(detectedInterests, language)} \u0445\u043e\u0440\u043e\u0448\u0438\u043c \u0441\u0442\u0430\u0440\u0442\u043e\u043c \u0431\u0443\u0434\u0443\u0442 ${placeSummary}. \u042d\u0442\u0438 \u043c\u0435\u0441\u0442\u0430 \u043d\u0435\u043f\u043b\u043e\u0445\u043e \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e\u0442 \u0440\u0430\u0437\u043d\u044b\u0435 \u0441\u0442\u043e\u0440\u043e\u043d\u044b \u041a\u0430\u0440\u0430\u043a\u0430\u043b\u043f\u0430\u043a\u0441\u0442\u0430\u043d\u0430. \u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0433\u043e\u0440\u043e\u0434 \u0438\u043b\u0438 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e\u0435 \u0432\u0440\u0435\u043c\u044f, \u0438 \u044f \u0441\u0443\u0436\u0443 \u0432\u044b\u0431\u043e\u0440.`,
        });
      }
    }

    const featuredPlaces = placesService.getFeaturedPlaces(4);
    const featuredSummary = featuredPlaces
      .map((place) => `${place.name} in ${place.city}`)
      .join(", ");

    return localize(language, {
      uz: `Karakalpakstan bo'yicha boshlash uchun eng yaxshi variantlar: ${featuredSummary}. Nukus muzeylar uchun, Moynaq Aral dengizi tarixi uchun, Ellikqala esa qadimiy qal'alar uchun kuchli yo'nalish hisoblanadi. Shahar yoki davomiylikni yozsangiz, aniqroq tavsiya beraman.`,
      en: `A strong Karakalpakstan starting set is ${featuredSummary}. Nukus works well for museums, Moynaq for Aral Sea history, and Ellikqala for ancient fortresses. Tell me your city or trip length, and I will make this more specific.`,
      ru: `\u0425\u043e\u0440\u043e\u0448\u0438\u0439 \u0441\u0442\u0430\u0440\u0442 \u043f\u043e \u041a\u0430\u0440\u0430\u043a\u0430\u043b\u043f\u0430\u043a\u0441\u0442\u0430\u043d\u0443: ${featuredSummary}. \u041d\u0443\u043a\u0443\u0441 \u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e \u0441\u0438\u043b\u0435\u043d \u0434\u043b\u044f \u043c\u0443\u0437\u0435\u0435\u0432, \u041c\u0443\u0439\u043d\u0430\u043a \u0434\u043b\u044f \u0438\u0441\u0442\u043e\u0440\u0438\u0438 \u0410\u0440\u0430\u043b\u044c\u0441\u043a\u043e\u0433\u043e \u043c\u043e\u0440\u044f, \u0430 \u042d\u043b\u043b\u0438\u043a\u043a\u0430\u043b\u0430 \u0434\u043b\u044f \u0434\u0440\u0435\u0432\u043d\u0438\u0445 \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u0435\u0439. \u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0433\u043e\u0440\u043e\u0434 \u0438\u043b\u0438 \u0434\u043b\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u043f\u043e\u0435\u0437\u0434\u043a\u0438, \u0438 \u044f \u0434\u0430\u043c \u0431\u043e\u043b\u0435\u0435 \u0442\u043e\u0447\u043d\u044b\u0439 \u0441\u043e\u0432\u0435\u0442.`,
    });
  }

  private formatInterests(interests: CategoryId[], language: Language): string {
    const labels: Record<CategoryId, Record<Language, string>> = {
      history: {
        uz: "tarix",
        en: "history",
        ru: "\u0438\u0441\u0442\u043e\u0440\u0438\u0438",
      },
      culture: {
        uz: "madaniyat",
        en: "culture",
        ru: "\u043a\u0443\u043b\u044c\u0442\u0443\u0440\u044b",
      },
      museum: {
        uz: "muzeylar",
        en: "museums",
        ru: "\u043c\u0443\u0437\u0435\u0435\u0432",
      },
      nature: {
        uz: "tabiat",
        en: "nature",
        ru: "\u043f\u0440\u0438\u0440\u043e\u0434\u044b",
      },
      adventure: {
        uz: "sarguzasht",
        en: "adventure",
        ru: "\u043f\u0440\u0438\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0439",
      },
      food: {
        uz: "taomlar",
        en: "food",
        ru: "\u0435\u0434\u044b",
      },
    };

    return interests.map((interest) => labels[interest][language]).join(", ");
  }
}

export const chatService = new ChatService();

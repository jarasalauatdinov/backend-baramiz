import type { GeneratedRoute, RouteGenerationInput } from "../types/tourism.types";
import { planRoute } from "./route-planner.service";
import { presentRoute } from "./route-presenter.service";
import { enrichRouteWithAi } from "./route-ai-enrichment.service";

const mergeRouteEnrichment = (
  generatedRoute: GeneratedRoute,
  enrichment: Awaited<ReturnType<typeof enrichRouteWithAi>>,
): GeneratedRoute => {
  if (!enrichment) {
    return generatedRoute;
  }

  return {
    ...generatedRoute,
    mode: "ai_enriched",
    title: enrichment.title,
    summary: enrichment.summary,
    tips: enrichment.tips,
  };
};

const logRouteEnrichmentFallback = (reason: string, error?: unknown): void => {
  if (error instanceof Error) {
    console.warn(`AI route enrichment fallback: ${reason}. ${error.message}`);
    return;
  }

  console.warn(`AI route enrichment fallback: ${reason}.`);
};

export const generateRoute = async (input: RouteGenerationInput): Promise<GeneratedRoute> => {
  const plannedRoute = planRoute(input);
  const generatedRoute = presentRoute(plannedRoute);

  try {
    const enrichment = await enrichRouteWithAi({
      resolvedCity: plannedRoute.resolvedCity,
      language: plannedRoute.language,
      preferences: plannedRoute.preferences,
      generatedRoute,
    });

    if (!enrichment) {
      return generatedRoute;
    }

    return mergeRouteEnrichment(generatedRoute, enrichment);
  } catch (error) {
    logRouteEnrichmentFallback("using deterministic route presentation", error);
    return generatedRoute;
  }
};

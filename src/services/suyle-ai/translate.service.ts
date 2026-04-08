import { env } from "../../config/env";
import type {
  AppLanguage,
  InternalTranslateParams,
  InternalTranslateResult,
  LocalLanguage,
  TouristLanguage,
  TranslateResponse,
  TranslateLocalToTouristRequest,
  TranslateTouristToLocalRequest,
  TranslationProvider,
} from "../../types/suyle-ai.types";
import {
  findMatchingGlossaryTerms,
  findSeedTranslation,
  getSourceTermForms,
  normalizeSuyleText,
} from "./glossary.service";
import { mapToTahrirchiLanguageCode, TahrirchiTranslationProvider } from "./providers/tahrirchi.provider";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLocalPhrase(latn: string, cyrl: string, targetLanguage: LocalLanguage) {
  return targetLanguage === "kaa_cyrl" ? cyrl : latn;
}

function stripTrailingPunctuation(text: string) {
  return text.trim().replace(/[.?!]+$/g, "").trim();
}

function resolveTouristToLocalOverride(text: string, targetLanguage: LocalLanguage) {
  const normalized = normalizeSuyleText(text);

  if (
    /where is the nearest pharmacy|где ближайшая аптека|eng yaqin dorixona qayerda|en yakın eczane nerede/.test(normalized)
  ) {
    return buildLocalPhrase(
      "Eń jaqın darixana qay jerde?",
      "Ең жақын дәрихана қай жерде?",
      targetLanguage,
    );
  }

  if (/call a taxi please|вызовите такси пожалуйста|taksi chaqiring|taksi çağır/.test(normalized)) {
    return buildLocalPhrase(
      "Iltimas, taksi shaqırıp beriń.",
      "Илтимас, такси шақырып бериń.",
      targetLanguage,
    );
  }

  if (/do you know where feep up is|feep up/.test(normalized)) {
    return buildLocalPhrase(
      "Feep up qay jerde ekenin bilesizbe?",
      "Фееп up қай жерде екенин билесизбе?",
      targetLanguage,
    );
  }

  if (/i need help|мне нужна помощь|menga yordam kerak|yardıma ihtiyacım var/.test(normalized)) {
    return buildLocalPhrase(
      "Maǵan járdem kerek.",
      "Маған жәрдем керек.",
      targetLanguage,
    );
  }

  return null;
}

function resolveLocalToTouristOverride(text: string, targetLanguage: TouristLanguage) {
  const normalized = normalizeSuyleText(text);

  if (/jaqın dorixana anaw kósheniń basında|жақын дорихана анаў көшениң басында/.test(normalized)) {
    return {
      en: "The nearest pharmacy is at the beginning of that street.",
      ru: "Ближайшая аптека находится в начале той улицы.",
      tr: "En yakın eczane caddenin başındadır.",
      uz: "Eng yaqin dorixona ko‘chaning boshida.",
    }[targetLanguage];
  }

  if (/men taksi shaqırıp beremen|мен такси шақырып беремен/.test(normalized)) {
    return {
      en: "I will call a taxi for you.",
      ru: "Я вызову вам такси.",
      tr: "Size taksi çağıracağım.",
      uz: "Sizga taksi chaqirib beraman.",
    }[targetLanguage];
  }

  if (/bul jerde emes alǵa barıń|бул жерде емес алға барың/.test(normalized)) {
    return {
      en: "It is not here. Go straight ahead.",
      ru: "Это не здесь. Идите вперед.",
      tr: "Burada değil, ileri gidin.",
      uz: "Bu yerda emas, oldinga boring.",
    }[targetLanguage];
  }

  if (/jaqın meymanxana anaw jerde|жақын мейманхана анаў жерде/.test(normalized)) {
    return {
      en: "The nearest hotel is over there.",
      ru: "Ближайший отель вон там.",
      tr: "En yakın otel şuradadır.",
      uz: "Eng yaqin mehmonxona anavi yerda.",
    }[targetLanguage];
  }

  return null;
}

function applyGlossaryPostProcessing(
  translatedText: string,
  request: InternalTranslateParams,
) {
  const matchingTerms = findMatchingGlossaryTerms(request.text, request.sourceLanguage);

  if (matchingTerms.length === 0) {
    return translatedText.trim();
  }

  let nextText = translatedText.trim();

  for (const term of matchingTerms) {
    const preferredTargetTerm = term.translations[request.targetLanguage];

    for (const sourceForm of getSourceTermForms(term, request.sourceLanguage)) {
      if (!sourceForm) {
        continue;
      }

      nextText = nextText.replace(new RegExp(escapeRegExp(sourceForm), "giu"), preferredTargetTerm);
    }
  }

  return nextText.trim();
}

class MockTranslationProvider implements TranslationProvider {
  async translate(request: InternalTranslateParams): Promise<InternalTranslateResult> {
    const seededTranslation = findSeedTranslation(
      request.sourceLanguage,
      request.targetLanguage,
      request.text,
    );

    if (seededTranslation) {
      return {
        providerSourceCode: mapToTahrirchiLanguageCode(request.sourceLanguage),
        providerTargetCode: mapToTahrirchiLanguageCode(request.targetLanguage),
        translatedText: seededTranslation.translatedText,
      };
    }

    const practicalTranslation = request.targetLanguage === "kaa_latn" || request.targetLanguage === "kaa_cyrl"
      ? resolveTouristToLocalOverride(request.text, request.targetLanguage)
      : resolveLocalToTouristOverride(request.text, request.targetLanguage as TouristLanguage);

    return {
      providerSourceCode: mapToTahrirchiLanguageCode(request.sourceLanguage),
      providerTargetCode: mapToTahrirchiLanguageCode(request.targetLanguage),
      translatedText: practicalTranslation ?? `${stripTrailingPunctuation(request.text)}.`,
    };
  }
}

function createTranslationProvider() {
  return env.USE_MOCK_AI ? new MockTranslationProvider() : new TahrirchiTranslationProvider();
}

async function runTranslation(request: InternalTranslateParams): Promise<InternalTranslateResult> {
  const provider = createTranslationProvider();
  const response = await provider.translate(request);

  return {
    ...response,
    translatedText: applyGlossaryPostProcessing(response.translatedText, request),
  };
}

export async function translateTouristToLocal(
  request: TranslateTouristToLocalRequest,
): Promise<TranslateResponse> {
  const result = await runTranslation({
    sourceLanguage: request.sourceLanguage,
    targetLanguage: request.targetLocalScript,
    text: request.text,
  });

  return {
    providerSourceCode: result.providerSourceCode,
    providerTargetCode: result.providerTargetCode,
    targetLanguage: request.targetLocalScript,
    translatedText: result.translatedText,
  };
}

export async function translateLocalToTourist(
  request: TranslateLocalToTouristRequest,
): Promise<TranslateResponse> {
  const result = await runTranslation({
    sourceLanguage: request.sourceLocalScript,
    targetLanguage: request.targetLanguage,
    text: request.text,
  });

  return {
    providerSourceCode: result.providerSourceCode,
    providerTargetCode: result.providerTargetCode,
    targetLanguage: request.targetLanguage,
    translatedText: result.translatedText,
  };
}

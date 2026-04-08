import glossaryData from "../../data/karakalpak-glossary.json";
import type { AppLanguage, GlossaryTerm, KarakalpakGlossary, SeedTranslation } from "../../types/suyle-ai.types";

const glossary = glossaryData as KarakalpakGlossary;

export function normalizeSuyleText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTermForms(term: GlossaryTerm, language: AppLanguage) {
  return [
    term.translations[language],
    ...(term.synonyms?.[language] ?? []),
  ]
    .map(normalizeSuyleText)
    .filter(Boolean);
}

export function findSeedTranslation(
  sourceLanguage: AppLanguage,
  targetLanguage: AppLanguage,
  text: string,
): SeedTranslation | undefined {
  const normalizedText = normalizeSuyleText(text);

  return glossary.seedExamples.find((item) => {
    return item.sourceLanguage === sourceLanguage
      && item.targetLanguage === targetLanguage
      && normalizeSuyleText(item.sourceText) === normalizedText;
  });
}

export function findMatchingGlossaryTerms(text: string, language: AppLanguage) {
  const normalizedText = normalizeSuyleText(text);

  return glossary.terms.filter((term) => {
    return getTermForms(term, language).some((form) => normalizedText.includes(form));
  });
}

export function getSourceTermForms(term: GlossaryTerm, language: AppLanguage) {
  return getTermForms(term, language);
}

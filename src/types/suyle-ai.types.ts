export type TouristLanguage = "uz" | "ru" | "en" | "tr";
export type LocalLanguage = "kaa_latn" | "kaa_cyrl";
export type AppLanguage = TouristLanguage | LocalLanguage;
export type TranslationDirection = "tourist_to_local" | "local_to_tourist";

export interface TranslateTouristToLocalRequest {
  sourceLanguage: TouristLanguage;
  targetLocalScript: LocalLanguage;
  text: string;
}

export interface TranslateLocalToTouristRequest {
  sourceLocalScript: LocalLanguage;
  targetLanguage: TouristLanguage;
  text: string;
}

export interface TranslateResponse {
  providerSourceCode?: string;
  providerTargetCode: string;
  targetLanguage: AppLanguage;
  translatedText: string;
}

export interface InternalTranslateParams {
  sourceLanguage: AppLanguage;
  targetLanguage: AppLanguage;
  text: string;
}

export interface InternalTranslateResult {
  providerSourceCode: string;
  providerTargetCode: string;
  translatedText: string;
}

export interface TahrirchiTranslateRequest {
  model: string;
  source_lang: string;
  target_lang: string;
  text: string;
}

export interface TahrirchiTranslateResponse {
  translated_text: string;
}

export interface STTRequest {
  audioBuffer: Buffer;
  fileName: string;
  languageHint: AppLanguage;
  mimeType?: string;
}

export interface SpeechToTextResponse {
  language: AppLanguage;
  text: string;
}

export interface TTSRequest {
  language: AppLanguage;
  text: string;
}

export interface TTSResponse {
  audioBuffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface GlossaryTerm {
  key: string;
  synonyms?: Partial<Record<AppLanguage, string[]>>;
  translations: Record<AppLanguage, string>;
}

export interface SeedTranslation {
  sourceLanguage: AppLanguage;
  sourceText: string;
  targetLanguage: AppLanguage;
  translatedText: string;
}

export interface KarakalpakGlossary {
  seedExamples: SeedTranslation[];
  terms: GlossaryTerm[];
}

export interface TranslationProvider {
  translate: (params: InternalTranslateParams) => Promise<InternalTranslateResult>;
}

export interface SpeechToTextProvider {
  transcribe: (request: STTRequest) => Promise<SpeechToTextResponse>;
}

export interface TextToSpeechProvider {
  synthesize: (request: TTSRequest) => Promise<TTSResponse>;
}

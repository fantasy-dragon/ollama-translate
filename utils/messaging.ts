export enum MessageType {
  TRANSLATE = "TRANSLATE",
  FETCH_MODELS = "FETCH_MODELS",
  TRANSLATION_STATUS = "TRANSLATION_STATUS",
}

export interface TranslateRequest {
  type: MessageType.TRANSLATE;
  texts: string[];
}

export interface TranslateResponse {
  translations: string[];
}

export interface FetchModelsRequest {
  type: MessageType.FETCH_MODELS;
}

export interface FetchModelsResponse {
  models: string[];
  error?: string;
}

export interface TranslationStatusMessage {
  type: MessageType.TRANSLATION_STATUS;
  status: "translating" | "idle";
  latency?: number;
}

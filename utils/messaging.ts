export enum MessageType {
  TRANSLATE = "TRANSLATE",
  FETCH_MODELS = "FETCH_MODELS",
  TRANSLATION_STATUS = "TRANSLATION_STATUS",
}

/** 翻译请求 */
export interface TranslateRequest {
  type: MessageType.TRANSLATE;
  texts: string[];
}

/** 翻译响应 */
export interface TranslateResponse {
  translations: string[];
}

/** 获取模型列表请求 */
export interface FetchModelsRequest {
  type: MessageType.FETCH_MODELS;
}

/** 获取模型列表响应 */
export interface FetchModelsResponse {
  models: string[];
  error?: string;
}

/** 翻译状态消息（background → popup） */
export interface TranslationStatusMessage {
  type: MessageType.TRANSLATION_STATUS;
  status: "translating" | "idle";
  latency?: number;
}

/** 所有可能的消息类型联合 */
export type ExtensionMessage =
  | TranslateRequest
  | FetchModelsRequest
  | TranslationStatusMessage;
